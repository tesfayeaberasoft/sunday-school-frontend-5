import type { Account, Transaction } from "@/types/models";

/** Statuses whose amounts count toward balances: Verified, and Reversed originals (cancelled by their Reversal). */
export function countsTowardBalance(t: Transaction): boolean {
  return t.status === "Verified" || t.status === "Reversed";
}

export function computeBalance(account: Account, txns: Transaction[]): number {
  return txns
    .filter((t) => t.accountId === account.id && countsTowardBalance(t))
    .reduce((sum, t) => sum + t.effect * t.amount, account.openingBalance);
}

export function effectForType(type: "Income" | "Expense" | "TransferIn" | "TransferOut"): 1 | -1 {
  return type === "Income" || type === "TransferIn" ? 1 : -1;
}

export type CorrectionError =
  | "not_verified"
  | "already_reversed"
  | "is_correction"
  | "reason_required"
  | "amount_invalid";

/** A Reversal or Adjustment may only target a Verified, original (non-correction) transaction. */
export function validateCorrection(
  original: Transaction,
  kind: "Reversal" | "Adjustment",
  reason: string,
  amount?: number,
): CorrectionError | null {
  if (!reason.trim()) return "reason_required";
  if (original.status === "Reversed") return "already_reversed";
  if (original.status !== "Verified") return "not_verified";
  if (original.type === "Reversal" || original.type === "Adjustment") return "is_correction";
  if (kind === "Adjustment" && (!amount || amount <= 0)) return "amount_invalid";
  return null;
}

/** Reversal = same amount, opposite effect, linked to original. Original is marked Reversed (never edited otherwise). */
export function buildReversal(
  original: Transaction,
  reason: string,
  base: Pick<Transaction, "id" | "ref" | "createdBy" | "createdAt" | "date">,
): Transaction {
  return {
    ...base,
    type: "Reversal",
    effect: original.effect === 1 ? -1 : 1,
    accountId: original.accountId,
    ...(original.categoryId ? { categoryId: original.categoryId } : {}),
    amount: original.amount,
    description: original.description,
    paymentMethod: original.paymentMethod,
    status: "Verified",
    originalTransactionId: original.id,
    reason,
    verifiedBy: base.createdBy,
    verifiedAt: base.createdAt,
  };
}

export interface ReconciliationRow {
  accountId: string;
  computed: number;
  stored: number;
  difference: number;
  balanced: boolean;
}

export function reconcile(accounts: Account[], txns: Transaction[]): ReconciliationRow[] {
  return accounts.map((a) => {
    const computed = computeBalance(a, txns);
    const difference = Math.round((a.storedBalance - computed) * 100) / 100;
    return { accountId: a.id, computed, stored: a.storedBalance, difference, balanced: difference === 0 };
  });
}

export function isHighExpense(t: Transaction, threshold: number): boolean {
  return t.type === "Expense" && t.amount > threshold && t.status !== "Rejected";
}
