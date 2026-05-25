import type { APIErrorResponse } from "@/lib/api-types";

export const API_BASE_URL =
  typeof process !== "undefined" && process.env.BUN_PUBLIC_API_BASE_URL ? process.env.BUN_PUBLIC_API_BASE_URL : "/api";

export class ApiError extends Error {
  code?: string;
  leaderAddress?: string;
  validationErrors: APIErrorResponse["errors"];
  status: number;

  constructor(status: number, payload: APIErrorResponse, fallbackMessage: string) {
    super(payload.message || fallbackMessage);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.leaderAddress = payload.leader_address;
    this.validationErrors = payload.errors;
  }

  get isNotRaftLeader() {
    return this.status === 409 && this.code === "not_raft_leader";
  }
}

async function readErrorPayload(response: Response, fallbackMessage: string): Promise<APIErrorResponse> {
  let text: string;

  try {
    text = await response.text();
  } catch {
    return { message: fallbackMessage };
  }

  const message = text.trim();
  if (!message) {
    return { message: fallbackMessage };
  }

  try {
    const payload = JSON.parse(text) as APIErrorResponse;
    return {
      message: payload.message || fallbackMessage,
      code: payload.code,
      leader_address: payload.leader_address,
      errors: payload.errors,
    };
  } catch {
    return { message };
  }
}

export function apiPath(path: string) {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, fallbackMessage = "API request failed"): Promise<T> {
  const response = await fetch(apiPath(path), init);

  if (!response.ok) {
    const payload = await readErrorPayload(response, fallbackMessage);
    throw new ApiError(response.status, payload, fallbackMessage);
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function apiGet<T>(path: string, fallbackMessage?: string) {
  return apiFetch<T>(path, undefined, fallbackMessage);
}

export function apiPut<T>(path: string, body: unknown, fallbackMessage?: string) {
  return apiFetch<T>(
    path,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    fallbackMessage,
  );
}

export function apiPost<T>(path: string, body: unknown, fallbackMessage?: string) {
  return apiFetch<T>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    fallbackMessage,
  );
}

export function apiPostNoContent(path: string, body: unknown, fallbackMessage?: string) {
  return apiFetch<void>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    fallbackMessage,
  );
}

export function apiDelete(path: string, fallbackMessage?: string) {
  return apiFetch<void>(path, { method: "DELETE" }, fallbackMessage);
}

export function formatApiError(error: unknown) {
  if (error instanceof ApiError && error.isNotRaftLeader) {
    return error.leaderAddress ? `${error.message} Leader Raft address: ${error.leaderAddress}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected API error";
}
