import type { StatusView } from "@/lib/api-types";

export type ProjectionApplicationState = "loading" | "applied" | "pending" | "error";

export interface ProjectionApplicationStatus {
  state: ProjectionApplicationState;
  label: string;
  description: string;
  applied: boolean;
  projectionStatus?: string;
  appliedAt?: string;
}

export function getProjectionApplicationStatus(status?: StatusView): ProjectionApplicationStatus {
  if (!status) {
    return {
      state: "loading",
      label: "Checking applied state",
      description: "Waiting for node projection status.",
      applied: false,
    };
  }

  const projection = status.node.projection;
  const appliedAt = status.node.applied_at;

  if (projection.status === "ok") {
    return {
      state: "applied",
      label: "Config applied",
      description: "Desired config has been applied on this node.",
      applied: true,
      appliedAt,
    };
  }

  if (projection.last_error) {
    return {
      state: "error",
      label: "Config apply failed",
      description: projection.last_error,
      applied: false,
      projectionStatus: projection.status,
      appliedAt,
    };
  }

  return {
    state: "pending",
    label: "Config not fully applied",
    description: `Projection status is ${projection.status}. Desired config may not be active on this node yet.`,
    applied: false,
    projectionStatus: projection.status,
    appliedAt,
  };
}
