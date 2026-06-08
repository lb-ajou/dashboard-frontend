import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DashboardApiError,
  bootstrapCluster,
  fetchCluster,
  fetchConfig,
  fetchNodeClusterStatus,
  fetchRuntime,
  fetchStatus,
  joinCluster,
  saveConfig,
} from "@/lib/api-client";
import type { ClusterBootstrapRequest, NodeJoinClusterRequest, ReplaceConfigRequest } from "@/lib/api-types";

export const queryKeys = {
  nodeClusterStatus: ["node", "cluster-status"] as const,
  status: ["status"] as const,
  runtime: ["runtime"] as const,
  cluster: ["cluster"] as const,
  config: ["config"] as const,
};

export function saveConfigErrorInvalidationKeys(error: unknown) {
  if (!(error instanceof DashboardApiError)) {
    return [];
  }

  if (error.isNotLeader) {
    return [queryKeys.status, queryKeys.cluster];
  }

  if (error.requiresSetup) {
    return [queryKeys.nodeClusterStatus, queryKeys.status];
  }

  return [];
}

export function setupErrorInvalidationKeys(error: unknown) {
  if (!(error instanceof DashboardApiError)) {
    return [];
  }

  if (error.code === "cluster_already_configured") {
    return [queryKeys.nodeClusterStatus, queryKeys.status, queryKeys.cluster];
  }

  return [];
}

export function useNodeClusterStatus() {
  return useQuery({
    queryKey: queryKeys.nodeClusterStatus,
    queryFn: fetchNodeClusterStatus,
    refetchInterval: 5000,
  });
}

export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: fetchStatus,
    refetchInterval: 5000,
  });
}

export function useRuntime(enabled = true) {
  return useQuery({
    queryKey: queryKeys.runtime,
    queryFn: fetchRuntime,
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useCluster(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cluster,
    queryFn: fetchCluster,
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: fetchConfig,
  });
}

export function useSaveConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ReplaceConfigRequest) => saveConfig(request),
    onSuccess: (config) => {
      queryClient.setQueryData(queryKeys.config, config);
      queryClient.invalidateQueries({ queryKey: queryKeys.config });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.runtime });
    },
    onError: (error) => {
      for (const queryKey of saveConfigErrorInvalidationKeys(error)) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

export function useBootstrapCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ClusterBootstrapRequest) => bootstrapCluster(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeClusterStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.cluster });
      queryClient.invalidateQueries({ queryKey: queryKeys.runtime });
      queryClient.invalidateQueries({ queryKey: queryKeys.config });
    },
    onError: (error) => {
      for (const queryKey of setupErrorInvalidationKeys(error)) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

export function useJoinCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: NodeJoinClusterRequest) => joinCluster(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeClusterStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.cluster });
      queryClient.invalidateQueries({ queryKey: queryKeys.runtime });
      queryClient.invalidateQueries({ queryKey: queryKeys.config });
    },
    onError: (error) => {
      for (const queryKey of setupErrorInvalidationKeys(error)) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
