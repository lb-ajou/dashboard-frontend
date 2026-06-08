import type { RuntimeUpstreamView } from "@/lib/api-types";

export type UpstreamTargetRuntimeState = "loading" | "healthy" | "unhealthy" | "not_applied" | "unknown";

export interface UpstreamTargetRuntimeStatus {
  address: string;
  state: UpstreamTargetRuntimeState;
  label: string;
  activeConnections?: number;
  lastError?: string;
}

interface UpstreamTargetRuntimeStatusInput {
  poolId: string;
  upstreams: string[];
  runtimeUpstreams?: RuntimeUpstreamView[];
  runtimeLoading?: boolean;
  runtimeUnavailable?: boolean;
  showActiveConnections?: boolean;
}

const stateLabels: Record<UpstreamTargetRuntimeState, string> = {
  loading: "Checking",
  healthy: "Healthy",
  unhealthy: "Unhealthy",
  not_applied: "Not applied",
  unknown: "Unknown",
};

function fixedState(addresses: string[], state: UpstreamTargetRuntimeState) {
  return addresses.map((address) => ({ address, state, label: stateLabels[state] }));
}

export function getUpstreamTargetRuntimeStatuses({
  poolId,
  upstreams,
  runtimeUpstreams,
  runtimeLoading = false,
  runtimeUnavailable = false,
  showActiveConnections = false,
}: UpstreamTargetRuntimeStatusInput): UpstreamTargetRuntimeStatus[] {
  if (runtimeLoading) {
    return fixedState(upstreams, "loading");
  }

  if (runtimeUnavailable) {
    return fixedState(upstreams, "unknown");
  }

  const runtimePool = runtimeUpstreams?.find((upstream) => upstream.local_id === poolId);

  if (!runtimePool) {
    return fixedState(upstreams, "not_applied");
  }

  return upstreams.map((address) => {
    const target = runtimePool.targets.find((runtimeTarget) => runtimeTarget.address === address);

    if (!target) {
      return { address, state: "not_applied", label: stateLabels.not_applied };
    }

    return {
      address,
      state: target.healthy ? "healthy" : "unhealthy",
      label: target.healthy ? stateLabels.healthy : stateLabels.unhealthy,
      activeConnections: showActiveConnections ? target.active_connections : undefined,
      lastError: target.last_error,
    };
  });
}
