import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config, NamespaceCreateResponse, NamespaceListResponse, Route, UpstreamPool } from "@/lib/types";

// Bun only inlines literal process.env references that are present at build time.
// Guard access so the browser still works when the public env is unset.
const API_BASE_URL =
  typeof process !== "undefined" && process.env.BUN_PUBLIC_API_BASE_URL ? process.env.BUN_PUBLIC_API_BASE_URL : "/api";

interface NamespaceSummaryApi {
  namespace: string;
  path: string;
  exists?: boolean;
  route_count?: number;
  upstream_pool_count?: number;
}

interface NamespaceListApiResponse {
  items: NamespaceSummaryApi[];
}

interface ApiErrorPayload {
  message?: string;
}

function namespaceBasePath(namespace: string) {
  return `${API_BASE_URL}/namespaces/${encodeURIComponent(namespace)}`;
}

async function readApiError(response: Response, fallbackMessage: string) {
  try {
    const error = (await response.json()) as ApiErrorPayload;
    return error.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function normalizeNamespaceSummary(summary: NamespaceSummaryApi): NamespaceCreateResponse {
  return {
    namespace: summary.namespace,
    path: summary.path,
    exists: summary.exists,
    route_count: summary.route_count,
    upstream_pool_count: summary.upstream_pool_count,
  };
}

function normalizeNamespaceListResponse(data: NamespaceListApiResponse): NamespaceListResponse {
  return {
    items: data.items.map(normalizeNamespaceSummary),
  };
}

// Fetch full config
async function fetchConfig(namespace: string): Promise<Config> {
  const response = await fetch(`${namespaceBasePath(namespace)}/config`);
  if (!response.ok) {
    throw new Error("Failed to fetch config");
  }
  return response.json();
}

// Fetch routes
async function fetchRoutes(namespace: string): Promise<Route[]> {
  const response = await fetch(`${namespaceBasePath(namespace)}/routes`);
  if (!response.ok) {
    throw new Error("Failed to fetch routes");
  }
  return response.json();
}

// Create route
async function createRoute(namespace: string, route: Route): Promise<Route> {
  const response = await fetch(`${namespaceBasePath(namespace)}/routes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(route),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to create route"));
  }
  return response.json();
}

// Update route
async function updateRoute(namespace: string, id: string, route: Route): Promise<Route> {
  const response = await fetch(`${namespaceBasePath(namespace)}/routes/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(route),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to update route"));
  }
  return response.json();
}

// Delete route
async function deleteRoute(namespace: string, id: string): Promise<void> {
  const response = await fetch(`${namespaceBasePath(namespace)}/routes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to delete route"));
  }
}

// Fetch upstream pools
async function fetchUpstreamPools(namespace: string): Promise<Record<string, UpstreamPool>> {
  const response = await fetch(`${namespaceBasePath(namespace)}/upstream-pools`);
  if (!response.ok) {
    throw new Error("Failed to fetch upstream pools");
  }
  return response.json();
}

// Create upstream pool
async function createUpstreamPool(
  namespace: string,
  id: string,
  pool: UpstreamPool,
): Promise<{ id: string; pool: UpstreamPool }> {
  const response = await fetch(`${namespaceBasePath(namespace)}/upstream-pools`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ...pool }),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to create upstream pool"));
  }
  return response.json();
}

// Update upstream pool
async function updateUpstreamPool(namespace: string, id: string, pool: UpstreamPool): Promise<UpstreamPool> {
  const response = await fetch(`${namespaceBasePath(namespace)}/upstream-pools/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pool),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to update upstream pool"));
  }
  return response.json();
}

// Delete upstream pool
async function deleteUpstreamPool(namespace: string, id: string): Promise<void> {
  const response = await fetch(`${namespaceBasePath(namespace)}/upstream-pools/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to delete upstream pool"));
  }
}

// Fetch available namespaces
async function fetchNamespaces(): Promise<NamespaceListResponse> {
  const response = await fetch(`${API_BASE_URL}/namespaces`);
  if (!response.ok) {
    throw new Error("Failed to fetch namespaces");
  }
  const data = (await response.json()) as NamespaceListApiResponse;
  return normalizeNamespaceListResponse(data);
}

async function createNamespace(namespace: string): Promise<NamespaceCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/namespaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ namespace }),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to create namespace"));
  }
  const data = (await response.json()) as NamespaceSummaryApi;
  return normalizeNamespaceSummary(data);
}

async function deleteNamespace(namespace: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/namespaces/${encodeURIComponent(namespace)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to delete namespace"));
  }
}

// Query keys
const queryKeys = {
  namespaces: ["namespaces"] as const,
  config: (namespace: string) => ["config", namespace] as const,
  routes: (namespace: string) => ["routes", namespace] as const,
  upstreamPools: (namespace: string) => ["upstreamPools", namespace] as const,
};

// Hooks
export function useNamespaces() {
  return useQuery({
    queryKey: queryKeys.namespaces,
    queryFn: fetchNamespaces,
  });
}

export function useConfig(namespace: string) {
  return useQuery({
    queryKey: queryKeys.config(namespace),
    queryFn: () => fetchConfig(namespace),
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

export function useRoutes(namespace: string) {
  return useQuery({
    queryKey: queryKeys.routes(namespace),
    queryFn: () => fetchRoutes(namespace),
  });
}

export function useCreateRoute(namespace: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (route: Route) => createRoute(namespace, route),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.config(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.namespaces });
    },
  });
}

export function useUpdateRoute(namespace: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, route }: { id: string; route: Route }) => updateRoute(namespace, id, route),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.config(namespace) });
    },
  });
}

export function useDeleteRoute(namespace: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoute(namespace, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.config(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.namespaces });
    },
  });
}

export function useUpstreamPools(namespace: string) {
  return useQuery({
    queryKey: queryKeys.upstreamPools(namespace),
    queryFn: () => fetchUpstreamPools(namespace),
  });
}

export function useCreateUpstreamPool(namespace: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pool }: { id: string; pool: UpstreamPool }) => createUpstreamPool(namespace, id, pool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upstreamPools(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.config(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.namespaces });
    },
  });
}

export function useUpdateUpstreamPool(namespace: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pool }: { id: string; pool: UpstreamPool }) => updateUpstreamPool(namespace, id, pool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upstreamPools(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.config(namespace) });
    },
  });
}

export function useDeleteUpstreamPool(namespace: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUpstreamPool(namespace, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upstreamPools(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.config(namespace) });
      queryClient.invalidateQueries({ queryKey: queryKeys.namespaces });
    },
  });
}
