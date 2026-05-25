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

export const queryKeys = {
  status: ["status"] as const,
  runtime: ["runtime"] as const,
  cluster: ["cluster"] as const,
  namespaces: ["namespaces"] as const,
  config: (namespace: string) => ["config", namespace] as const,
};

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
