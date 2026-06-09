import type {
  APIError,
  ClusterBootstrapRequest,
  ClusterView,
  ConfigRequest,
  ConfigView,
  NodeClusterStatusView,
  NodeJoinClusterRequest,
  RuntimeView,
  StatusView,
  ValidationError,
} from "./api-types";

export const API_BASE_URL =
  typeof process !== "undefined" && process.env.BUN_PUBLIC_API_BASE_URL ? process.env.BUN_PUBLIC_API_BASE_URL : "/api";

type RequestBody = unknown;

export class DashboardApiError extends Error {
  readonly status: number;
  readonly payload?: Partial<APIError>;
  readonly code?: string;
  readonly leaderAddress?: string;
  readonly validationErrors?: ValidationError[];
  readonly isNotLeader: boolean;
  readonly requiresSetup: boolean;

  constructor(status: number, payload: Partial<APIError> | undefined, fallbackMessage: string) {
    super(payload?.message || fallbackMessage);
    this.name = "DashboardApiError";
    this.status = status;
    this.payload = payload;
    this.code = payload?.code;
    this.leaderAddress = payload?.leader_address;
    this.validationErrors = payload?.errors;
    this.isNotLeader = payload?.code === "not_raft_leader";
    this.requiresSetup = payload?.code === "cluster_not_configured";
  }
}

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function maybeAPIErrorPayload(value: unknown): Partial<APIError> | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as Partial<APIError>;
}

async function parseErrorPayload(response: Response): Promise<Partial<APIError> | undefined> {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return maybeAPIErrorPayload(await response.json());
  } catch {
    return undefined;
  }
}

export async function requestJSON<T>(
  method: string,
  path: string,
  body: RequestBody | undefined,
  fallbackMessage: string,
): Promise<T> {
  const init: RequestInit = { method };

  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const response = await fetch(apiUrl(path), init);

  if (!response.ok) {
    throw new DashboardApiError(response.status, await parseErrorPayload(response), fallbackMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string, fallbackMessage: string) {
  return requestJSON<T>("GET", path, undefined, fallbackMessage);
}

export function apiPost<T>(path: string, body: RequestBody, fallbackMessage: string) {
  return requestJSON<T>("POST", path, body, fallbackMessage);
}

export function apiPut<T>(path: string, body: RequestBody, fallbackMessage: string) {
  return requestJSON<T>("PUT", path, body, fallbackMessage);
}

export function apiDelete(path: string, fallbackMessage: string) {
  return requestJSON<void>("DELETE", path, undefined, fallbackMessage);
}

export function apiPostNoContent(path: string, body: RequestBody, fallbackMessage: string) {
  return requestJSON<void>("POST", path, body, fallbackMessage);
}

export function fetchStatus() {
  return apiGet<StatusView>("/status", "Failed to fetch status");
}

export function fetchRuntime() {
  return apiGet<RuntimeView>("/runtime", "Failed to fetch runtime");
}

export function fetchCluster() {
  return apiGet<ClusterView>("/cluster", "Failed to fetch cluster");
}

export function fetchNodeClusterStatus() {
  return apiGet<NodeClusterStatusView>("/node/cluster-status", "Failed to fetch node cluster status");
}

export function fetchConfig() {
  return apiGet<ConfigView>("/config", "Failed to fetch configuration");
}

export function saveConfig(config: ConfigRequest) {
  return apiPut<ConfigView>("/config", config, "Failed to save configuration");
}

export function bootstrapCluster(request: ClusterBootstrapRequest) {
  return apiPostNoContent("/cluster/bootstrap", request, "Bootstrap failed");
}

export function joinCluster(request: NodeJoinClusterRequest) {
  return apiPostNoContent("/node/join-cluster", request, "Join failed");
}
