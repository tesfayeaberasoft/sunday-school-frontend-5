import type { Asset, AssetIssue, EventAllocation, SchoolEvent } from "@/types/models";

export function outstandingQuantity(issue: AssetIssue): number {
  return issue.quantity - issue.returnedQuantity - issue.damagedOnReturn - issue.missingOnReturn;
}

export function issuedNotReturned(assetId: string, issues: AssetIssue[]): number {
  return issues
    .filter((i) => i.assetId === assetId)
    .reduce((s, i) => s + Math.max(0, outstandingQuantity(i)), 0);
}

/** available_quantity = total_quantity - damaged_quantity - issued_not_returned */
export function availableQuantity(asset: Asset, issues: AssetIssue[]): number {
  return Math.max(0, asset.totalQuantity - asset.damagedQuantity - issuedNotReturned(asset.id, issues));
}

export interface ReturnInput {
  returned: number;
  damaged: number;
  missing: number;
}

export type ReturnError = "exceeds_outstanding" | "negative" | "empty";

export function validateReturn(issue: AssetIssue, input: ReturnInput): ReturnError | null {
  const { returned, damaged, missing } = input;
  if (returned < 0 || damaged < 0 || missing < 0) return "negative";
  if (returned + damaged + missing === 0) return "empty";
  if (returned + damaged + missing > outstandingQuantity(issue)) return "exceeds_outstanding";
  return null;
}

/** Missing permanently reduces total; damaged increases damaged until repaired. */
export function applyReturn(
  asset: Asset,
  issue: AssetIssue,
  input: ReturnInput,
  date: string,
): { asset: Asset; issue: AssetIssue } {
  const nextIssue: AssetIssue = {
    ...issue,
    returnedQuantity: issue.returnedQuantity + input.returned,
    damagedOnReturn: issue.damagedOnReturn + input.damaged,
    missingOnReturn: issue.missingOnReturn + input.missing,
    returnDate: date,
  };
  nextIssue.status = outstandingQuantity(nextIssue) === 0 ? "returned" : "partial";
  return {
    asset: {
      ...asset,
      totalQuantity: asset.totalQuantity - input.missing,
      damagedQuantity: asset.damagedQuantity + input.damaged,
    },
    issue: nextIssue,
  };
}

function overlaps(a: SchoolEvent, b: SchoolEvent): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/** Quantity still allocatable to an event: available minus allocations of overlapping events. */
export function allocatableForEvent(
  asset: Asset,
  issues: AssetIssue[],
  allocations: EventAllocation[],
  events: SchoolEvent[],
  eventId: string,
): number {
  const target = events.find((e) => e.id === eventId);
  if (!target) return 0;
  const reserved = allocations
    .filter((al) => al.assetId === asset.id)
    .filter((al) => {
      const ev = events.find((e) => e.id === al.eventId);
      return ev ? overlaps(ev, target) : false;
    })
    .reduce((s, al) => s + al.quantity, 0);
  return Math.max(0, availableQuantity(asset, issues) - reserved);
}
