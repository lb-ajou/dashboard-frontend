import { describe, expect, test } from "bun:test";
import type { StatusView } from "./api-types";
import { getProjectionApplicationStatus } from "./projection-status";

function status(projection: StatusView["node"]["projection"]): StatusView {
  return {
    node: {
      id: "node-1",
      proxy_listen_addr: ":8080",
      dashboard_listen_addr: ":9090",
      applied_at: "2026-06-08T15:35:36.400776+09:00",
      projection,
    },
    raft: {
      enabled: true,
      state: "leader",
      is_leader: true,
      leader_id: "node-1",
      leader_address: "127.0.0.1:7001",
      has_leader: true,
      quorum_status: "available",
    },
    vip: { enabled: false, owned: false },
    runtime: {
      route_count: 0,
      upstream_pool_count: 0,
      target_count: 0,
      healthy_target_count: 0,
      unhealthy_target_count: 0,
    },
  };
}

describe("getProjectionApplicationStatus", () => {
  test("returns loading when status is unavailable", () => {
    expect(getProjectionApplicationStatus(undefined)).toEqual({
      state: "loading",
      label: "Checking applied state",
      description: "Waiting for node projection status.",
      applied: false,
    });
  });

  test("treats ok projection as applied", () => {
    expect(getProjectionApplicationStatus(status({ status: "ok" }))).toEqual({
      state: "applied",
      label: "Config applied",
      description: "Desired config has been applied on this node.",
      applied: true,
      appliedAt: "2026-06-08T15:35:36.400776+09:00",
    });
  });

  test("treats non-ok projection as not fully applied", () => {
    expect(getProjectionApplicationStatus(status({ status: "syncing" }))).toMatchObject({
      state: "pending",
      label: "Config not fully applied",
      applied: false,
      projectionStatus: "syncing",
    });
  });

  test("shows last projection error when present", () => {
    expect(getProjectionApplicationStatus(status({ status: "error", last_error: "route backend pool is missing" }))).toEqual({
      state: "error",
      label: "Config apply failed",
      description: "route backend pool is missing",
      applied: false,
      projectionStatus: "error",
      appliedAt: "2026-06-08T15:35:36.400776+09:00",
    });
  });
});
