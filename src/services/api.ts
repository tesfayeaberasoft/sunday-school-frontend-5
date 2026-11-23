/**
 * SSMS `/api/v1` REST client.
 *
 * When `VITE_API_BASE_URL` is set, requests go to the real (PHP) server as JSON with a bearer token.
 * Otherwise a local mock adapter answers the same endpoints from the on-device store, so the whole
 * app runs today with sample data and swapping in the server only touches this file.
 */
import { useAuth } from "@/stores/auth";
import { useDb } from "@/stores/db";
import { DEMO_PASSWORD } from "@/data/mock";
import { t } from "@/i18n";
import { uuid } from "@/lib/format";
import type { AttendanceRecord, AssetIssue, TaskStatus, User } from "@/types/models";
import type { ReturnInput } from "@/lib/rules/assets";

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; conflict?: boolean };

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const API_PREFIX = "/api/v1";
const MAX_FAILED_LOGINS = 5;

function baseUrl(): string | undefined {
  const v = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
  return v && v.trim() ? v.replace(/\/$/, "") : undefined;
}

export function usingMockApi(): boolean {
  return !baseUrl();
}

async function httpRequest<T>(method: Method, path: string, body?: unknown, idempotencyKey?: string): Promise<ApiResult<T>> {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (idempotencyKey) headers["X-Client-UUID"] = idempotencyKey;
  try {
    const res = await fetch(`${baseUrl()}${API_PREFIX}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: T; message?: string };
    if (!res.ok) {
      return { ok: false, status: res.status, error: json.message ?? t.toast.error, conflict: res.status === 409 };
    }
    return { ok: true, status: res.status, data: json.data as T };
  } catch {
    return { ok: false, status: 0, error: t.toast.error };
  }
}

/* ---------------- Mock adapter ---------------- */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const okR = <T,>(data: T, status = 200): ApiResult<T> => ({ ok: true, data, status });
const errR = (error: string, status = 422, conflict = false): ApiResult<never> => ({ ok: false, error, status, conflict });

type Handler = (params: Record<string, string>, body: unknown) => ApiResult<unknown>;
interface MockRoute {
  method: Method;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}
const routes: MockRoute[] = [];
function route(method: Method, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/:([a-zA-Z]+)/g, (_, k: string) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "$",
  );
  routes.push({ method, pattern, keys, handler });
}

export interface LoginBody {
  username: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  user: User;
}

route("POST", "/auth/login", (_, body) => {
  const { username, password } = body as LoginBody;
  const db = useDb.getState();
  const key = username.trim().toLowerCase();
  const user = db.users.find((u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key);
  if (!user) return errR(t.login.invalid, 401);
  if (!user.active) return errR(t.login.inactive, 403);
  if (user.failedLogins >= MAX_FAILED_LOGINS) return errR(t.login.locked, 423);
  if (password !== DEMO_PASSWORD) {
    db.updateUser(user.id, { failedLogins: user.failedLogins + 1 });
    return errR(t.login.invalid, 401);
  }
  db.updateUser(user.id, { failedLogins: 0, lastLogin: new Date().toISOString().slice(0, 19) });
  return okR<LoginResponse>({ token: `demo.${uuid()}`, user });
});

route("POST", "/auth/logout", () => okR(null));

route("POST", "/attendance/sessions", (_, body) => {
  const b = body as AttendanceInput;
  const r = useDb.getState().submitAttendance(b);
  if (!r.ok) return errR(r.error, r.error === t.errors.attendanceConflict ? 409 : 422, r.error === t.errors.attendanceConflict);
  return okR(r.value, 201);
});

route("PATCH", "/tasks/:id/status", (p, body) => {
  const db = useDb.getState();
  if (!db.tasks.some((x) => x.id === p["id"])) return errR(t.errors.notFound, 404);
  db.updateTaskStatus(p["id"] ?? "", (body as { status: TaskStatus }).status);
  return okR(null);
});

route("POST", "/assets/issues", (_, body) => {
  const r = useDb.getState().issueAsset(body as AssetIssueInput);
  return r.ok ? okR(r.value, 201) : errR(r.error, 409, true);
});

route("POST", "/assets/issues/:id/return", (p, body) => {
  const r = useDb.getState().returnAsset(p["id"] ?? "", body as ReturnInput);
  return r.ok ? okR(null) : errR(r.error, 422);
});

async function mockRequest<T>(method: Method, path: string, body?: unknown): Promise<ApiResult<T>> {
  await delay(180 + Math.random() * 220);
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.pattern.exec(path);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] ?? "")));
    return r.handler(params, body) as ApiResult<T>;
  }
  return errR(t.errors.notFound, 404);
}

export function request<T>(method: Method, path: string, body?: unknown, idempotencyKey?: string): Promise<ApiResult<T>> {
  return baseUrl() ? httpRequest<T>(method, path, body, idempotencyKey) : mockRequest<T>(method, path, body);
}

/* ---------------- Typed endpoints ---------------- */

export interface AttendanceInput {
  classId: string;
  date: string;
  sessionName: string;
  records: AttendanceRecord[];
  clientUuid?: string;
}
export type AssetIssueInput = Omit<AssetIssue, "id" | "returnedQuantity" | "damagedOnReturn" | "missingOnReturn" | "status">;

export const api = {
  auth: {
    login: (body: LoginBody) => request<LoginResponse>("POST", "/auth/login", body),
    logout: () => request<null>("POST", "/auth/logout"),
  },
  attendance: {
    submit: (body: AttendanceInput) => request("POST", "/attendance/sessions", body, body.clientUuid),
  },
  tasks: {
    updateStatus: (id: string, status: TaskStatus, clientUuid?: string) =>
      request<null>("PATCH", `/tasks/${encodeURIComponent(id)}/status`, { status }, clientUuid),
  },
  assets: {
    issue: (body: AssetIssueInput, clientUuid?: string) => request("POST", "/assets/issues", body, clientUuid),
    return: (issueId: string, body: ReturnInput, clientUuid?: string) =>
      request<null>("POST", `/assets/issues/${encodeURIComponent(issueId)}/return`, body, clientUuid),
  },
};
