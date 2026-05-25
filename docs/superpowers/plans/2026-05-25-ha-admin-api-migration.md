# HA Admin API Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the dashboard frontend around the new Raft-aware HA admin API while preserving the existing namespace route and upstream editing workflows.

**Architecture:** Split the API contract into typed models, a small fetch client, pure namespace-config mutation helpers, and React Query hooks. Editing screens mutate a full `NamespaceConfigView` in memory and save with `PUT /api/namespaces/{namespace}/config`; operational screens read `/api/status`, `/api/runtime`, and `/api/cluster`.

**Tech Stack:** React 19, React Router 7, TanStack Query 5, TanStack Table, react-hook-form, zod, Bun, TypeScript.

---

## File Structure

- Create `src/lib/api-types.ts`: new API response/request types for status, runtime, cluster, namespace config, and API errors.
- Create `src/lib/api-client.ts`: shared `apiFetch`, `apiGet`, `apiPut`, `apiPostNoContent`, and typed `ApiError`.
- Create `src/lib/config-mutations.ts`: pure helpers for add/update/delete route and upstream pool against full namespace config.
- Create `src/lib/config-mutations.test.ts`: Bun unit tests for config mutation helpers.
- Modify `src/lib/types.ts`: keep form helpers but re-export or align editing types with `api-types`; add `algorithm?: RouteAlgorithm`.
- Modify `src/lib/validation.ts`: validate `algorithm`, stricter path rules, and upstream address rules already required by the new API.
- Replace most of `src/hooks/use-config.ts`: expose hooks for status, runtime, cluster, namespace config, full-config save mutations, namespace list/create/delete, and cluster join.
- Modify `src/pages/routes.tsx`: stop using removed route CRUD endpoints; save full config with route mutation helpers.
- Modify `src/pages/upstreams.tsx`: stop using removed upstream-pool CRUD endpoints; save full config with pool mutation helpers.
- Modify `src/pages/dashboard.tsx`: use `/api/status` for node/runtime summary and keep namespace desired config viewer as a secondary panel.
- Modify `src/components/dashboard/stats-cards.tsx`: render `StatusView.runtime`, Raft, VIP, and projection status instead of deriving all cards from namespace config.
- Create `src/pages/cluster.tsx`: show cluster enabled state, quorum, leader, local node, members, and join form.
- Create `src/components/cluster/cluster-summary.tsx`: cluster summary cards.
- Create `src/components/cluster/members-table.tsx`: members table.
- Create `src/components/cluster/join-node-form.tsx`: cluster join form using `POST /api/cluster/join`.
- Modify `src/App.tsx`: register `/namespaces/:namespace/cluster`.
- Modify `src/components/layout/app-sidebar.tsx`: add Cluster navigation.
- Optional after implementation: split `src/hooks/use-config.ts` into `use-api.ts`, `use-namespace-config.ts`, and `use-cluster.ts` if the file grows past easy review size.

## API Contract Reference

Use `docs/dashboard-frontend-api-migration.ko.md` as the source of truth:

- New endpoints: lines 17-23.
- Removed endpoints: lines 25-38.
- Recommended data flow: lines 40-48.
- Status type: lines 82-140.
- Runtime type: lines 182-253.
- Cluster type: lines 319-360.
- Namespace config write: lines 420-450.
- API error envelope: lines 555-602.

---

### Task 1: Add API Types

**Files:**
- Create: `src/lib/api-types.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/api-types.ts`**

```ts
export type ConfigStore = "file" | "raft" | string;

export type RaftState =
  | "disabled"
  | "leader"
  | "follower"
  | "candidate"
  | "shutdown"
  | "unknown"
  | string;

export type QuorumStatus = "available" | "unavailable" | "unknown" | "disabled" | string;
export type ClusterMemberRole = "voter" | "nonvoter" | "staging" | "unknown" | string;

export type RouteAlgorithm =
  | "round_robin"
  | "sticky_cookie"
  | "5_tuple_hash"
  | "least_connection"
  | string;

export type PathKind = "exact" | "prefix" | "regex" | "any" | "unknown" | string;
export type PathMatchType = "exact" | "prefix" | "regex";

export interface ProjectionView {
  status: "ok" | "degraded" | string;
  last_error?: string;
}

export interface StatusNodeView {
  id?: string;
  config_store: ConfigStore;
  proxy_listen_addr: string;
  dashboard_listen_addr: string;
  applied_at: string;
  projection: ProjectionView;
}

export interface StatusRaftView {
  enabled: boolean;
  state: RaftState;
  is_leader: boolean;
  leader_id?: string;
  leader_address?: string;
  has_leader: boolean;
  quorum_status: QuorumStatus;
}

export interface VIPStatusView {
  enabled: boolean;
  interface?: string;
  address?: string;
  owned: boolean;
  last_error?: string;
}

export interface StatusRuntimeView {
  route_count: number;
  upstream_pool_count: number;
  target_count: number;
  healthy_target_count: number;
  unhealthy_target_count: number;
}

export interface StatusView {
  node: StatusNodeView;
  raft: StatusRaftView;
  vip: VIPStatusView;
  runtime: StatusRuntimeView;
}

export interface RuntimeNodeView {
  id?: string;
  config_store: ConfigStore;
}

export interface RuntimeConfigSourceView {
  source: string;
  path?: string;
  name?: string;
  route_count: number;
  upstream_pool_count: number;
}

export interface RuntimePathMatcherView {
  kind: PathKind;
  value?: string;
}

export interface RuntimeRouteView {
  global_id: string;
  local_id: string;
  source: string;
  enabled: boolean;
  hosts: string[];
  path: RuntimePathMatcherView;
  algorithm: RouteAlgorithm;
  upstream_pool: string;
}

export interface RuntimeTargetView {
  address: string;
  healthy: boolean;
  last_checked_at?: string;
  last_error?: string;
  active_connections: number;
}

export interface RuntimeHealthCheckView {
  path: string;
  interval: string;
  timeout: string;
  expect_status: number;
}

export interface RuntimeUpstreamView {
  global_id: string;
  local_id: string;
  source: string;
  targets: RuntimeTargetView[];
  health_check?: RuntimeHealthCheckView;
}

export interface RuntimeView {
  applied_at: string;
  node: RuntimeNodeView;
  config_sources: RuntimeConfigSourceView[];
  routes: RuntimeRouteView[];
  upstreams: RuntimeUpstreamView[];
}

export interface ClusterLeaderView {
  id?: string;
  address?: string;
}

export interface ClusterLocalView {
  id?: string;
  address?: string;
  state?: RaftState;
  last_log_index?: string;
  commit_index?: string;
  applied_index?: string;
  term?: string;
}

export interface ClusterMemberView {
  id: string;
  address: string;
  role: ClusterMemberRole;
  is_leader: boolean;
}

export interface ClusterView {
  enabled: boolean;
  quorum_status?: QuorumStatus;
  leader: ClusterLeaderView;
  local: ClusterLocalView;
  members: ClusterMemberView[];
}

export interface HealthCheckConfig {
  path: string;
  interval: string;
  timeout: string;
  expect_status: number;
}

export interface UpstreamPoolConfig {
  upstreams: string[];
  health_check?: HealthCheckConfig;
}

export interface PathMatchConfig {
  type: PathMatchType;
  value: string;
}

export interface RouteMatchConfig {
  hosts: string[];
  path?: PathMatchConfig;
}

export interface RouteConfig {
  id: string;
  enabled: boolean;
  match: RouteMatchConfig;
  algorithm?: RouteAlgorithm;
  upstream_pool: string;
}

export interface NamespaceConfigView {
  namespace: string;
  exists: boolean;
  routes: RouteConfig[];
  upstream_pools: Record<string, UpstreamPoolConfig>;
  applied_at?: string;
}

export interface NamespaceConfigPutRequest {
  routes: RouteConfig[];
  upstream_pools: Record<string, UpstreamPoolConfig>;
}

export interface NamespaceView {
  namespace: string;
  path: string;
  exists: boolean;
  route_count: number;
  upstream_pool_count: number;
}

export interface NamespaceListView {
  items: NamespaceView[];
  default_namespace: string;
}

export interface ClusterJoinRequest {
  node_id: string;
  raft_address: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface APIErrorResponse {
  message: string;
  code?: string;
  leader_address?: string;
  errors?: ValidationError[];
}
```

- [ ] **Step 2: Align existing form-facing types in `src/lib/types.ts`**

Replace the top type declarations in `src/lib/types.ts` with imports and aliases:

```ts
import type {
  HealthCheckConfig,
  NamespaceConfigView,
  NamespaceView,
  PathMatchConfig,
  PathMatchType,
  RouteAlgorithm,
  RouteConfig,
  RouteMatchConfig,
  UpstreamPoolConfig,
} from "@/lib/api-types";

export type Config = NamespaceConfigView;
export type NamespaceSummary = NamespaceView;
export type NamespaceCreateResponse = NamespaceView;

export interface NamespaceListResponse {
  items: NamespaceSummary[];
  default_namespace?: string;
}

export type Route = RouteConfig;
export type RouteMatch = RouteMatchConfig;
export type PathMatch = PathMatchConfig;
export type UpstreamPool = UpstreamPoolConfig;
export type HealthCheck = HealthCheckConfig;

export type { PathMatchType, RouteAlgorithm };
```

Keep the existing `RouteFormData`, `UpstreamPoolFormData`, `routeToFormData`, `formDataToRoute`, `poolToFormData`, and `formDataToPool` functions below those aliases, then update `RouteFormData`:

```ts
export interface RouteFormData {
  id: string;
  enabled: boolean;
  hosts: string[];
  pathType: PathMatchType | "";
  pathValue: string;
  algorithm: RouteAlgorithm | "";
  upstream_pool: string;
}
```

Update `routeToFormData`:

```ts
export function routeToFormData(route: Route): RouteFormData {
  return {
    id: route.id,
    enabled: route.enabled,
    hosts: route.match.hosts,
    pathType: route.match.path?.type ?? "",
    pathValue: route.match.path?.value ?? "",
    algorithm: route.algorithm ?? "",
    upstream_pool: route.upstream_pool,
  };
}
```

Update `formDataToRoute`:

```ts
export function formDataToRoute(formData: RouteFormData): Route {
  const route: Route = {
    id: formData.id,
    enabled: formData.enabled,
    match: {
      hosts: formData.hosts.filter((h) => h.trim() !== ""),
    },
    upstream_pool: formData.upstream_pool,
  };

  if (formData.algorithm) {
    route.algorithm = formData.algorithm;
  }

  if (formData.pathType && formData.pathValue) {
    route.match.path = {
      type: formData.pathType,
      value: formData.pathValue,
    };
  }

  return route;
}
```

- [ ] **Step 3: Run build to catch type errors**

Run: `bun run build`

Expected: It may fail because `route-form.tsx` does not provide `algorithm` defaults yet. That failure confirms the type change reached the UI.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api-types.ts src/lib/types.ts
git commit -m "feat: add HA admin API types"
```

---

### Task 2: Add API Client and Error Handling

**Files:**
- Create: `src/lib/api-client.ts`
- Modify: `src/hooks/use-config.ts`

- [ ] **Step 1: Create `src/lib/api-client.ts`**

```ts
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
  try {
    const payload = (await response.json()) as APIErrorResponse;
    return {
      message: payload.message || fallbackMessage,
      code: payload.code,
      leader_address: payload.leader_address,
      errors: payload.errors,
    };
  } catch {
    return { message: fallbackMessage };
  }
}

export function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, fallbackMessage = "API request failed"): Promise<T> {
  const response = await fetch(apiPath(path), init);

  if (!response.ok) {
    const payload = await readErrorPayload(response, fallbackMessage);
    throw new ApiError(response.status, payload, fallbackMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
    return error.leaderAddress
      ? `${error.message} Leader Raft address: ${error.leaderAddress}`
      : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected API error";
}
```

- [ ] **Step 2: Remove duplicated API base/error code from `src/hooks/use-config.ts`**

Remove the local `API_BASE_URL`, `ApiErrorPayload`, `namespaceBasePath`, and `readApiError` declarations after hook rewrites in Task 4. Do not delete the file yet.

- [ ] **Step 3: Run build**

Run: `bun run build`

Expected: PASS if Task 1 UI updates were also completed, otherwise the same route form type failure remains.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api-client.ts src/hooks/use-config.ts
git commit -m "feat: add shared admin API client"
```

---

### Task 3: Add Pure Namespace Config Mutations

**Files:**
- Create: `src/lib/config-mutations.ts`
- Create: `src/lib/config-mutations.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add a Bun test script to `package.json`**

Modify `scripts`:

```json
{
  "dev": "bun --hot src/index.tsx",
  "start": "NODE_ENV=production bun src/index.tsx",
  "build": "bun run build.ts",
  "build-html": "bun run build --compile --target=browser",
  "test": "bun test"
}
```

- [ ] **Step 2: Write failing tests in `src/lib/config-mutations.test.ts`**

```ts
import { describe, expect, test } from "bun:test";
import type { NamespaceConfigView, RouteConfig, UpstreamPoolConfig } from "@/lib/api-types";
import {
  addRouteToConfig,
  deletePoolFromConfig,
  deleteRouteFromConfig,
  upsertPoolInConfig,
  upsertRouteInConfig,
} from "@/lib/config-mutations";

function baseConfig(): NamespaceConfigView {
  return {
    namespace: "default",
    exists: true,
    applied_at: "2026-05-24T12:00:00Z",
    routes: [
      {
        id: "r-api",
        enabled: true,
        match: { hosts: ["api.example.com"], path: { type: "prefix", value: "/api/" } },
        upstream_pool: "pool-api",
      },
    ],
    upstream_pools: {
      "pool-api": {
        upstreams: ["10.0.0.11:8080"],
      },
      "pool-web": {
        upstreams: ["10.0.0.12:8080"],
      },
    },
  };
}

describe("config mutations", () => {
  test("adds a route without mutating the original config", () => {
    const config = baseConfig();
    const route: RouteConfig = {
      id: "r-web",
      enabled: true,
      match: { hosts: ["www.example.com"] },
      algorithm: "round_robin",
      upstream_pool: "pool-web",
    };

    const next = addRouteToConfig(config, route);

    expect(next.routes.map((item) => item.id)).toEqual(["r-api", "r-web"]);
    expect(config.routes.map((item) => item.id)).toEqual(["r-api"]);
  });

  test("rejects duplicate route ids", () => {
    const config = baseConfig();

    expect(() =>
      addRouteToConfig(config, {
        id: "r-api",
        enabled: true,
        match: { hosts: ["copy.example.com"] },
        upstream_pool: "pool-api",
      }),
    ).toThrow("Route id already exists: r-api");
  });

  test("updates a route and supports route id rename", () => {
    const config = baseConfig();

    const next = upsertRouteInConfig(config, "r-api", {
      id: "r-api-v2",
      enabled: false,
      match: { hosts: ["api-v2.example.com"] },
      upstream_pool: "pool-api",
    });

    expect(next.routes).toHaveLength(1);
    expect(next.routes[0]?.id).toBe("r-api-v2");
    expect(next.routes[0]?.enabled).toBe(false);
  });

  test("deletes a route by id", () => {
    const next = deleteRouteFromConfig(baseConfig(), "r-api");

    expect(next.routes).toEqual([]);
  });

  test("adds or updates an upstream pool", () => {
    const pool: UpstreamPoolConfig = {
      upstreams: ["10.0.0.20:8080"],
      health_check: { path: "/health", interval: "30s", timeout: "3s", expect_status: 200 },
    };

    const next = upsertPoolInConfig(baseConfig(), "pool-api", pool);

    expect(next.upstream_pools["pool-api"]).toEqual(pool);
  });

  test("deletes an unused upstream pool", () => {
    const next = deletePoolFromConfig(baseConfig(), "pool-web");

    expect(Object.keys(next.upstream_pools)).toEqual(["pool-api"]);
  });

  test("rejects deleting a pool referenced by a route", () => {
    expect(() => deletePoolFromConfig(baseConfig(), "pool-api")).toThrow(
      "Cannot delete upstream pool pool-api because route r-api uses it",
    );
  });
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run: `bun test src/lib/config-mutations.test.ts`

Expected: FAIL with module-not-found for `src/lib/config-mutations.ts`.

- [ ] **Step 4: Implement `src/lib/config-mutations.ts`**

```ts
import type { NamespaceConfigPutRequest, NamespaceConfigView, RouteConfig, UpstreamPoolConfig } from "@/lib/api-types";

function cloneConfig(config: NamespaceConfigView): NamespaceConfigView {
  return {
    ...config,
    routes: config.routes.map((route) => ({
      ...route,
      match: {
        ...route.match,
        hosts: [...route.match.hosts],
        path: route.match.path ? { ...route.match.path } : undefined,
      },
    })),
    upstream_pools: Object.fromEntries(
      Object.entries(config.upstream_pools).map(([id, pool]) => [
        id,
        {
          ...pool,
          upstreams: [...pool.upstreams],
          health_check: pool.health_check ? { ...pool.health_check } : undefined,
        },
      ]),
    ),
  };
}

export function toPutRequest(config: NamespaceConfigView): NamespaceConfigPutRequest {
  return {
    routes: config.routes,
    upstream_pools: config.upstream_pools,
  };
}

export function addRouteToConfig(config: NamespaceConfigView, route: RouteConfig): NamespaceConfigView {
  if (config.routes.some((item) => item.id === route.id)) {
    throw new Error(`Route id already exists: ${route.id}`);
  }

  const next = cloneConfig(config);
  next.routes.push(route);
  return next;
}

export function upsertRouteInConfig(
  config: NamespaceConfigView,
  previousRouteId: string,
  route: RouteConfig,
): NamespaceConfigView {
  const existingIndex = config.routes.findIndex((item) => item.id === previousRouteId);

  if (existingIndex === -1) {
    return addRouteToConfig(config, route);
  }

  const duplicate = config.routes.some((item, index) => index !== existingIndex && item.id === route.id);

  if (duplicate) {
    throw new Error(`Route id already exists: ${route.id}`);
  }

  const next = cloneConfig(config);
  next.routes[existingIndex] = route;
  return next;
}

export function deleteRouteFromConfig(config: NamespaceConfigView, routeId: string): NamespaceConfigView {
  return {
    ...cloneConfig(config),
    routes: config.routes.filter((route) => route.id !== routeId),
  };
}

export function upsertPoolInConfig(
  config: NamespaceConfigView,
  poolId: string,
  pool: UpstreamPoolConfig,
): NamespaceConfigView {
  const next = cloneConfig(config);
  next.upstream_pools[poolId] = pool;
  return next;
}

export function renamePoolInConfig(
  config: NamespaceConfigView,
  previousPoolId: string,
  nextPoolId: string,
  pool: UpstreamPoolConfig,
): NamespaceConfigView {
  if (previousPoolId !== nextPoolId && config.upstream_pools[nextPoolId]) {
    throw new Error(`Upstream pool id already exists: ${nextPoolId}`);
  }

  const next = cloneConfig(config);
  delete next.upstream_pools[previousPoolId];
  next.upstream_pools[nextPoolId] = pool;
  next.routes = next.routes.map((route) =>
    route.upstream_pool === previousPoolId ? { ...route, upstream_pool: nextPoolId } : route,
  );
  return next;
}

export function deletePoolFromConfig(config: NamespaceConfigView, poolId: string): NamespaceConfigView {
  const referencedRoute = config.routes.find((route) => route.upstream_pool === poolId);

  if (referencedRoute) {
    throw new Error(`Cannot delete upstream pool ${poolId} because route ${referencedRoute.id} uses it`);
  }

  const next = cloneConfig(config);
  delete next.upstream_pools[poolId];
  return next;
}
```

- [ ] **Step 5: Run tests and build**

Run: `bun test src/lib/config-mutations.test.ts`

Expected: PASS.

Run: `bun run build`

Expected: PASS after Task 1 UI defaults are completed.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/config-mutations.ts src/lib/config-mutations.test.ts
git commit -m "feat: add namespace config mutation helpers"
```

---

### Task 4: Rewrite React Query Hooks for New Endpoints

**Files:**
- Modify: `src/hooks/use-config.ts`

- [ ] **Step 1: Replace imports**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ClusterJoinRequest,
  ClusterView,
  NamespaceConfigPutRequest,
  NamespaceConfigView,
  NamespaceListView,
  NamespaceView,
  RuntimeView,
  StatusView,
} from "@/lib/api-types";
import { apiDelete, apiGet, apiPost, apiPostNoContent, apiPut } from "@/lib/api-client";
```

- [ ] **Step 2: Replace query keys**

```ts
export const queryKeys = {
  status: ["status"] as const,
  runtime: ["runtime"] as const,
  cluster: ["cluster"] as const,
  namespaces: ["namespaces"] as const,
  config: (namespace: string) => ["config", namespace] as const,
};
```

- [ ] **Step 3: Add endpoint helpers**

```ts
function namespaceConfigPath(namespace: string) {
  return `/namespaces/${encodeURIComponent(namespace)}/config`;
}

function namespacePath(namespace: string) {
  return `/namespaces/${encodeURIComponent(namespace)}`;
}

async function fetchStatus() {
  return apiGet<StatusView>("/status", "Failed to fetch node status");
}

async function fetchRuntime() {
  return apiGet<RuntimeView>("/runtime", "Failed to fetch runtime snapshot");
}

async function fetchCluster() {
  return apiGet<ClusterView>("/cluster", "Failed to fetch cluster state");
}

async function fetchNamespaces() {
  return apiGet<NamespaceListView>("/namespaces", "Failed to fetch namespaces");
}

async function createNamespace(namespace: string) {
  return apiPost<NamespaceView>("/namespaces", { namespace }, "Failed to create namespace");
}

async function deleteNamespace(namespace: string) {
  return apiDelete(namespacePath(namespace), "Failed to delete namespace");
}

async function fetchNamespaceConfig(namespace: string) {
  return apiGet<NamespaceConfigView>(namespaceConfigPath(namespace), "Failed to fetch namespace config");
}

async function saveNamespaceConfig(namespace: string, request: NamespaceConfigPutRequest) {
  return apiPut<NamespaceConfigView>(namespaceConfigPath(namespace), request, "Failed to save namespace config");
}

async function joinCluster(request: ClusterJoinRequest) {
  return apiPostNoContent("/cluster/join", request, "Failed to join cluster");
}
```

- [ ] **Step 4: Add hooks**

```ts
export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: fetchStatus,
    refetchInterval: 5000,
  });
}

export function useRuntime() {
  return useQuery({
    queryKey: queryKeys.runtime,
    queryFn: fetchRuntime,
    refetchInterval: 5000,
  });
}

export function useCluster() {
  return useQuery({
    queryKey: queryKeys.cluster,
    queryFn: fetchCluster,
    refetchInterval: 5000,
  });
}

export function useNamespaces() {
  return useQuery({
    queryKey: queryKeys.namespaces,
    queryFn: fetchNamespaces,
  });
}

export function useConfig(namespace: string) {
  return useQuery({
    queryKey: queryKeys.config(namespace),
    queryFn: () => fetchNamespaceConfig(namespace),
  });
}

export function useCreateNamespace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNamespace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.namespaces });
    },
  });
}

export function useDeleteNamespace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNamespace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.namespaces });
    },
  });
}

export function useSaveConfig(namespace: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: NamespaceConfigPutRequest) => saveNamespaceConfig(namespace, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.namespaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.runtime });
    },
  });
}

export function useJoinCluster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cluster });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}
```

- [ ] **Step 5: Remove legacy hooks**

Remove these exports because their endpoints now return `404`:

```ts
useRoutes
useCreateRoute
useUpdateRoute
useDeleteRoute
useUpstreamPools
useCreateUpstreamPool
useUpdateUpstreamPool
useDeleteUpstreamPool
```

- [ ] **Step 6: Run build and note expected failures**

Run: `bun run build`

Expected: FAIL in `routes.tsx` and `upstreams.tsx` because they still import removed hooks. This confirms no legacy API usage remains hidden in the data layer.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-config.ts
git commit -m "feat: switch hooks to HA admin API"
```

---

### Task 5: Update Route Editing to Save Full Config

**Files:**
- Modify: `src/pages/routes.tsx`
- Modify: `src/components/routes/route-form.tsx`
- Modify: `src/components/routes/routes-table.tsx`
- Modify: `src/lib/validation.ts`

- [ ] **Step 1: Update route form defaults**

In `src/components/routes/route-form.tsx`, add `algorithm` default:

```ts
defaultValues: route
  ? routeToFormData(route)
  : {
      id: "",
      enabled: true,
      hosts: [""],
      pathType: "",
      pathValue: "",
      algorithm: "round_robin",
      upstream_pool: "",
    },
```

- [ ] **Step 2: Add algorithm select to `route-form.tsx`**

Place this field before `upstream_pool`:

```tsx
<FormField
  control={form.control}
  name="algorithm"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Load Balancing Algorithm</FormLabel>
      <Select onValueChange={field.onChange} value={field.value || "round_robin"}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select algorithm" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="round_robin">Round robin</SelectItem>
          <SelectItem value="sticky_cookie">Sticky cookie</SelectItem>
          <SelectItem value="5_tuple_hash">5-tuple hash</SelectItem>
          <SelectItem value="least_connection">Least connection</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>Server defaults to round robin when omitted.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

- [ ] **Step 3: Update route validation**

In `src/lib/validation.ts`, add algorithm:

```ts
const routeAlgorithms = ["round_robin", "sticky_cookie", "5_tuple_hash", "least_connection"] as const;
```

Update `routeFormSchema`:

```ts
export const routeFormSchema = z.object({
  id: z.string().min(1, "Route ID is required"),
  enabled: z.boolean(),
  hosts: z.array(z.string().min(1, "Host cannot be empty")).min(1, "At least one host is required"),
  pathType: z.enum(["exact", "prefix", "regex", ""]).optional(),
  pathValue: z.string().optional(),
  algorithm: z.enum(routeAlgorithms).or(z.literal("")).optional(),
  upstream_pool: z.string().min(1, "Upstream pool is required"),
}).refine((data) => {
  if (data.pathType && data.pathType !== "") {
    return !!data.pathValue && data.pathValue.length > 0;
  }
  return true;
}, {
  message: "Path value is required when path type is selected",
  path: ["pathValue"],
}).refine((data) => {
  if (!data.pathType || data.pathType === "" || !data.pathValue) {
    return true;
  }

  if (data.pathType === "regex") {
    return data.pathValue.length > 0;
  }

  if (!data.pathValue.startsWith("/")) {
    return false;
  }

  if (data.pathType === "prefix") {
    return data.pathValue === "/" || data.pathValue.endsWith("/");
  }

  return true;
}, {
  message: "Invalid path format for the selected type",
  path: ["pathValue"],
});
```

- [ ] **Step 4: Add algorithm column to `routes-table.tsx`**

Insert before `upstream_pool`:

```tsx
{
  accessorKey: "algorithm",
  header: "Algorithm",
  cell: ({ row }) => {
    const algorithm = row.original.algorithm ?? "round_robin";
    return <Badge variant="secondary">{algorithm}</Badge>;
  },
},
```

- [ ] **Step 5: Rewrite `src/pages/routes.tsx` imports**

```ts
import * as React from "react";
import { Plus } from "lucide-react";

import { useConfig, useSaveConfig } from "@/hooks/use-config";
import { useCurrentNamespace } from "@/hooks/use-namespace";
import { addRouteToConfig, deleteRouteFromConfig, toPutRequest, upsertRouteInConfig } from "@/lib/config-mutations";
import { formatApiError } from "@/lib/api-client";
import type { Route } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RoutesTable } from "@/components/routes/routes-table";
import { RouteDialog } from "@/components/routes/route-dialog";
```

- [ ] **Step 6: Rewrite route page data and handlers**

Use this structure inside `RoutesPage`:

```tsx
const namespace = useCurrentNamespace();
const { data: config, isLoading } = useConfig(namespace);
const saveConfig = useSaveConfig(namespace);

const [dialogOpen, setDialogOpen] = React.useState(false);
const [editingRoute, setEditingRoute] = React.useState<Route | null>(null);

const routes = config?.routes ?? [];
const upstreamPoolIds = Object.keys(config?.upstream_pools ?? {});

function saveNextConfig(nextConfig: typeof config, onSuccess: () => void) {
  if (!nextConfig) {
    window.alert("Namespace config is not loaded yet.");
    return;
  }

  saveConfig.mutate(toPutRequest(nextConfig), {
    onSuccess,
    onError: (error) => {
      window.alert(formatApiError(error));
    },
  });
}

const handleSubmit = (routeData: Route) => {
  if (!config) {
    window.alert("Namespace config is not loaded yet.");
    return;
  }

  try {
    const nextConfig = editingRoute
      ? upsertRouteInConfig(config, editingRoute.id, routeData)
      : addRouteToConfig(config, routeData);

    saveNextConfig(nextConfig, () => {
      setDialogOpen(false);
      setEditingRoute(null);
    });
  } catch (error) {
    window.alert(formatApiError(error));
  }
};

const handleDelete = (route: Route) => {
  if (!config) {
    window.alert("Namespace config is not loaded yet.");
    return;
  }

  if (confirm(`Are you sure you want to delete route "${route.id}"?`)) {
    saveNextConfig(deleteRouteFromConfig(config, route.id), () => {
      setEditingRoute(null);
    });
  }
};
```

Keep `handleCreate`, `handleEdit`, and `handleDuplicate`, but duplicate should set `editingRoute` to `null` after preparing a copy:

```ts
const handleDuplicate = (route: Route) => {
  setEditingRoute({
    ...route,
    id: `${route.id}-copy`,
  });
  setDialogOpen(true);
};
```

Use `isSubmitting={saveConfig.isPending}` in `RouteDialog`.

- [ ] **Step 7: Run build**

Run: `bun run build`

Expected: Upstreams page still fails until Task 6 because it imports removed hooks. Routes page should no longer reference removed route endpoints.

- [ ] **Step 8: Commit**

```bash
git add src/pages/routes.tsx src/components/routes/route-form.tsx src/components/routes/routes-table.tsx src/lib/validation.ts
git commit -m "feat: save routes through namespace config"
```

---

### Task 6: Update Upstream Pool Editing to Save Full Config

**Files:**
- Modify: `src/pages/upstreams.tsx`

- [ ] **Step 1: Rewrite imports**

```ts
import * as React from "react";
import { Plus } from "lucide-react";

import { useConfig, useSaveConfig } from "@/hooks/use-config";
import { useCurrentNamespace } from "@/hooks/use-namespace";
import { deletePoolFromConfig, renamePoolInConfig, toPutRequest, upsertPoolInConfig } from "@/lib/config-mutations";
import { formatApiError } from "@/lib/api-client";
import type { UpstreamPool } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PoolsTable } from "@/components/upstreams/pools-table";
import { PoolDialog } from "@/components/upstreams/pool-dialog";
```

- [ ] **Step 2: Rewrite data and mutation setup**

```tsx
const namespace = useCurrentNamespace();
const { data: config, isLoading } = useConfig(namespace);
const saveConfig = useSaveConfig(namespace);

const [dialogOpen, setDialogOpen] = React.useState(false);
const [editingPoolId, setEditingPoolId] = React.useState<string | null>(null);
const [editingPool, setEditingPool] = React.useState<UpstreamPool | null>(null);

const poolsArray: PoolWithId[] = React.useMemo(() => {
  return Object.entries(config?.upstream_pools ?? {}).map(([id, pool]) => ({ id, pool }));
}, [config?.upstream_pools]);

function saveNextConfig(nextConfig: typeof config, onSuccess: () => void) {
  if (!nextConfig) {
    window.alert("Namespace config is not loaded yet.");
    return;
  }

  saveConfig.mutate(toPutRequest(nextConfig), {
    onSuccess,
    onError: (error) => {
      window.alert(formatApiError(error));
    },
  });
}
```

- [ ] **Step 3: Rewrite submit/delete handlers**

```tsx
const handleSubmit = (id: string, poolData: UpstreamPool) => {
  if (!config) {
    window.alert("Namespace config is not loaded yet.");
    return;
  }

  try {
    const nextConfig = editingPoolId
      ? renamePoolInConfig(config, editingPoolId, id, poolData)
      : upsertPoolInConfig(config, id, poolData);

    saveNextConfig(nextConfig, () => {
      setDialogOpen(false);
      setEditingPoolId(null);
      setEditingPool(null);
    });
  } catch (error) {
    window.alert(formatApiError(error));
  }
};

const handleDelete = (id: string) => {
  if (!config) {
    window.alert("Namespace config is not loaded yet.");
    return;
  }

  if (confirm(`Are you sure you want to delete upstream pool "${id}"?`)) {
    try {
      saveNextConfig(deletePoolFromConfig(config, id), () => {
        setEditingPoolId(null);
        setEditingPool(null);
      });
    } catch (error) {
      window.alert(formatApiError(error));
    }
  }
};
```

- [ ] **Step 4: Use the new pending state**

In `PoolDialog`:

```tsx
isSubmitting={saveConfig.isPending}
```

- [ ] **Step 5: Run tests and build**

Run: `bun test src/lib/config-mutations.test.ts`

Expected: PASS.

Run: `bun run build`

Expected: PASS.

- [ ] **Step 6: Confirm removed endpoints are gone**

Run: `rg -n "/routes|/upstream-pools|useCreateRoute|useUpstreamPools|useDeleteRoute|useUpdateRoute|useCreateUpstreamPool|useUpdateUpstreamPool|useDeleteUpstreamPool" src`

Expected: no removed endpoint paths and no removed hook names. It is acceptable for route UI paths such as React Router `/routes` to appear in `src/App.tsx` and sidebar code.

- [ ] **Step 7: Commit**

```bash
git add src/pages/upstreams.tsx
git commit -m "feat: save upstream pools through namespace config"
```

---

### Task 7: Rebuild Dashboard Around Status and Runtime

**Files:**
- Modify: `src/pages/dashboard.tsx`
- Modify: `src/components/dashboard/stats-cards.tsx`
- Modify: `src/components/dashboard/config-viewer.tsx`

- [ ] **Step 1: Change `StatsCards` props**

Replace props in `src/components/dashboard/stats-cards.tsx`:

```ts
import { Activity, CheckCircle, GitBranch, RadioTower, Route, Server } from "lucide-react";
import type { StatusView } from "@/lib/api-types";

interface StatsCardsProps {
  status: StatusView | undefined;
  isLoading: boolean;
}
```

- [ ] **Step 2: Render status-derived cards**

Use this stats array:

```ts
const runtime = status?.runtime;
const raft = status?.raft;
const vip = status?.vip;
const projection = status?.node.projection;

const stats = [
  {
    title: "Routes",
    value: isLoading ? "-" : runtime?.route_count ?? 0,
    description: `${isLoading ? "-" : runtime?.upstream_pool_count ?? 0} upstream pools`,
    icon: Route,
  },
  {
    title: "Targets",
    value: isLoading ? "-" : runtime?.target_count ?? 0,
    description: `${isLoading ? "-" : runtime?.healthy_target_count ?? 0} healthy / ${isLoading ? "-" : runtime?.unhealthy_target_count ?? 0} unhealthy`,
    icon: Activity,
  },
  {
    title: "Raft",
    value: isLoading ? "-" : raft?.state ?? "unknown",
    description: raft?.enabled ? raft.quorum_status : "disabled",
    icon: GitBranch,
  },
  {
    title: "VIP",
    value: isLoading ? "-" : vip?.enabled ? (vip.owned ? "owned" : "standby") : "disabled",
    description: vip?.last_error || vip?.address || projection?.status || "no VIP configured",
    icon: vip?.owned ? CheckCircle : RadioTower,
  },
];
```

Keep the existing card rendering markup.

- [ ] **Step 3: Update dashboard page imports**

```ts
import { Link } from "react-router";
import { GitBranch, Plus, Route, Server } from "lucide-react";

import { useConfig, useRuntime, useStatus } from "@/hooks/use-config";
import { namespacePath, useCurrentNamespace } from "@/hooks/use-namespace";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ConfigViewer } from "@/components/dashboard/config-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
```

- [ ] **Step 4: Add status/runtime data to dashboard**

```tsx
const namespace = useCurrentNamespace();
const { data: config, isLoading: isConfigLoading } = useConfig(namespace);
const { data: status, isLoading: isStatusLoading } = useStatus();
const { data: runtime } = useRuntime();
```

- [ ] **Step 5: Use status cards and runtime source summary**

Replace `StatsCards` usage:

```tsx
<StatsCards status={status} isLoading={isStatusLoading} />
```

Add a runtime source card beside quick actions:

```tsx
<Card className="flex flex-col">
  <CardHeader>
    <CardTitle>Runtime Sources</CardTitle>
    <CardDescription>Applied snapshot from this node</CardDescription>
  </CardHeader>
  <CardContent className="flex-1 space-y-3">
    {runtime?.config_sources.length ? (
      runtime.config_sources.map((source) => (
        <div key={source.source} className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{source.name || source.source}</div>
            <div className="truncate text-xs text-muted-foreground">{source.path || source.source}</div>
          </div>
          <Badge variant="outline">
            {source.route_count}/{source.upstream_pool_count}
          </Badge>
        </div>
      ))
    ) : (
      <p className="text-sm text-muted-foreground">No runtime source loaded.</p>
    )}
  </CardContent>
</Card>
```

Add a Cluster quick action button:

```tsx
<Button asChild variant="outline" className="justify-start">
  <Link to={namespacePath(namespace, "cluster")}>
    <GitBranch className="mr-2 h-4 w-4" />
    Cluster Status
  </Link>
</Button>
```

- [ ] **Step 6: Keep config viewer as desired config**

Use:

```tsx
<ConfigViewer config={config} isLoading={isConfigLoading} namespace={namespace} />
```

- [ ] **Step 7: Run build**

Run: `bun run build`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/dashboard.tsx src/components/dashboard/stats-cards.tsx src/components/dashboard/config-viewer.tsx
git commit -m "feat: show HA node status on dashboard"
```

---

### Task 8: Add Cluster Page and Join Flow

**Files:**
- Create: `src/pages/cluster.tsx`
- Create: `src/components/cluster/cluster-summary.tsx`
- Create: `src/components/cluster/members-table.tsx`
- Create: `src/components/cluster/join-node-form.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1: Create `cluster-summary.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClusterView } from "@/lib/api-types";

interface ClusterSummaryProps {
  cluster: ClusterView | undefined;
  isLoading: boolean;
}

export function ClusterSummary({ cluster, isLoading }: ClusterSummaryProps) {
  const items = [
    { title: "Mode", value: isLoading ? "-" : cluster?.enabled ? "raft" : "file" },
    { title: "Quorum", value: isLoading ? "-" : cluster?.quorum_status ?? "disabled" },
    { title: "Leader", value: isLoading ? "-" : cluster?.leader.id ?? "unknown" },
    { title: "Local Node", value: isLoading ? "-" : cluster?.local.id ?? "unknown" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{item.value}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `members-table.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClusterMemberView } from "@/lib/api-types";

interface MembersTableProps {
  members: ClusterMemberView[];
}

export function MembersTable({ members }: MembersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Raft membership reported by the current node</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node ID</TableHead>
              <TableHead>Raft Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Leader</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono">{member.id}</TableCell>
                  <TableCell className="font-mono">{member.address}</TableCell>
                  <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                  <TableCell>{member.is_leader ? <Badge>Leader</Badge> : <Badge variant="outline">Member</Badge>}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No cluster members reported.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create `join-node-form.tsx`**

```tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiError } from "@/lib/api-client";
import { useJoinCluster } from "@/hooks/use-config";

export function JoinNodeForm() {
  const joinCluster = useJoinCluster();
  const [nodeId, setNodeId] = React.useState("");
  const [raftAddress, setRaftAddress] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    joinCluster.mutate(
      { node_id: nodeId.trim(), raft_address: raftAddress.trim() },
      {
        onSuccess: () => {
          setNodeId("");
          setRaftAddress("");
        },
        onError: (error) => {
          window.alert(formatApiError(error));
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Node</CardTitle>
        <CardDescription>Add a Raft node by node ID and Raft advertise address</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="node-id">Node ID</Label>
            <Input id="node-id" value={nodeId} onChange={(event) => setNodeId(event.target.value)} placeholder="node-2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raft-address">Raft Address</Label>
            <Input id="raft-address" value={raftAddress} onChange={(event) => setRaftAddress(event.target.value)} placeholder="127.0.0.1:7002" />
          </div>
          <Button type="submit" disabled={joinCluster.isPending || !nodeId.trim() || !raftAddress.trim()}>
            {joinCluster.isPending ? "Joining..." : "Join Cluster"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create `src/pages/cluster.tsx`**

```tsx
import { useCluster } from "@/hooks/use-config";
import { ClusterSummary } from "@/components/cluster/cluster-summary";
import { JoinNodeForm } from "@/components/cluster/join-node-form";
import { MembersTable } from "@/components/cluster/members-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ClusterPage() {
  const { data: cluster, isLoading } = useCluster();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cluster</h1>
        <p className="text-muted-foreground">Raft leader, local node, and membership state</p>
      </div>

      <ClusterSummary cluster={cluster} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MembersTable members={cluster?.members ?? []} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Node</CardTitle>
              <CardDescription>Indexes are Raft log positions from this node</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Address</span><span className="font-mono">{cluster?.local.address ?? "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">State</span><span>{cluster?.local.state ?? "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Term</span><span>{cluster?.local.term ?? "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Commit</span><span>{cluster?.local.commit_index ?? "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Applied</span><span>{cluster?.local.applied_index ?? "-"}</span></div>
            </CardContent>
          </Card>
          <JoinNodeForm />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Register route in `src/App.tsx`**

Add import:

```ts
import { ClusterPage } from "@/pages/cluster"
```

Add route:

```tsx
<Route path="cluster" element={<ClusterPage />} />
```

- [ ] **Step 6: Add sidebar navigation**

In `src/components/layout/app-sidebar.tsx`, update import:

```ts
import { ChevronDown, GitBranch, LayoutDashboard, Route, Server } from "lucide-react"
```

Add item:

```ts
{
  title: "Cluster",
  subpath: "cluster",
  icon: GitBranch,
},
```

- [ ] **Step 7: Run build**

Run: `bun run build`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/cluster.tsx src/components/cluster/cluster-summary.tsx src/components/cluster/members-table.tsx src/components/cluster/join-node-form.tsx src/App.tsx src/components/layout/app-sidebar.tsx
git commit -m "feat: add cluster management page"
```

---

### Task 9: Final Verification and Manual Smoke Test

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run all unit tests**

Run: `bun test`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `bun run build`

Expected: PASS.

- [ ] **Step 3: Search for removed backend endpoints**

Run: `rg -n "runtime/routes|runtime/config|/upstreams|app-config|proxy-configs|raft/join|upstream-pools|/routes" src`

Expected:
- No backend API calls to removed endpoints.
- React Router UI paths such as `/routes` are acceptable.
- Text labels containing `routes` are acceptable.

- [ ] **Step 4: Start dev server**

Run: `bun dev`

Expected: server logs `Dashboard frontend server running at http://localhost:3000/`.

- [ ] **Step 5: Browser smoke test**

Open `http://localhost:3000`.

Verify:
- Initial namespace redirect still works.
- Dashboard loads status cards without layout overlap.
- Routes page can create, edit, duplicate, and delete by sending `PUT /api/namespaces/{namespace}/config`.
- Upstream Pools page can create, edit, rename, and delete unused pools by sending `PUT /api/namespaces/{namespace}/config`.
- Deleting a referenced pool shows a client-side alert.
- Cluster page shows members and local node details.
- Join form calls `POST /api/cluster/join`.
- A `409 not_raft_leader` response displays the leader Raft address as a hint and does not retry against that address.

- [ ] **Step 6: Commit final fixes**

If the smoke test finds layout or behavior fixes:

```bash
git add src
git commit -m "fix: polish HA admin API migration"
```

If no fixes are needed, do not create an empty commit.

---

## Self-Review

- Spec coverage: The plan covers new `/status`, `/runtime`, `/cluster`, `/cluster/join`, and full namespace config `PUT`; it removes route and upstream-pool CRUD calls.
- Error handling: `ApiError` preserves `code`, `leader_address`, and `errors`; `not_raft_leader` is surfaced as a hint rather than retried.
- Type consistency: editing types use `RouteConfig` and `UpstreamPoolConfig`; runtime types use separate target-object models.
- Testing: pure config mutations get Bun unit tests; final verification includes build, endpoint grep, and browser smoke testing.
