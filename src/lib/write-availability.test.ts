import { describe, expect, test } from "bun:test";
import type { StatusView } from "./api-types";
import { getWriteAvailability } from "./write-availability";

function status(overrides: Partial<StatusView> = {}): StatusView {
  return {
    node: {
      id: "node-1",
      proxy_listen_addr: ":8080",
      dashboard_listen_addr: ":9090",
      applied_at: "2026-06-08T00:00:00Z",
      projection: { status: "ok" },
    },
    raft: {
      enabled: true,
      state: "leader",
      is_leader: true,
      leader_id: "node-1",
      leader_address: "10.0.0.11:7001",
      has_leader: true,
      quorum_status: "healthy",
    },
    vip: { enabled: false, owned: false },
    runtime: {
      route_count: 1,
      upstream_pool_count: 1,
      target_count: 2,
      healthy_target_count: 2,
      unhealthy_target_count: 0,
    },
    ...overrides,
  };
}

describe("getWriteAvailability", () => {
  test("allows writes on raft leader", () => {
    expect(getWriteAvailability(status())).toEqual({ canWrite: true, reason: undefined });
  });

  test("allows writes when leader quorum is available", () => {
    const result = getWriteAvailability(status({ raft: { ...status().raft, quorum_status: "available" } }));

    expect(result).toEqual({ canWrite: true, reason: undefined });
  });

  test("allows writes when raft is disabled", () => {
    const result = getWriteAvailability(status({ raft: { ...status().raft, enabled: false, state: "disabled", is_leader: false } }));

    expect(result).toEqual({ canWrite: true, reason: undefined });
  });

  test("disables writes on follower and includes leader hint", () => {
    const result = getWriteAvailability(
      status({ raft: { ...status().raft, state: "follower", is_leader: false, leader_address: "10.0.0.11:7001" } }),
    );

    expect(result.canWrite).toBe(false);
    expect(result.reason).toContain("leader");
    expect(result.leaderAddress).toBe("10.0.0.11:7001");
  });

  test("disables writes when no leader is available", () => {
    const result = getWriteAvailability(
      status({ raft: { ...status().raft, state: "candidate", is_leader: false, has_leader: false, quorum_status: "unavailable" } }),
    );

    expect(result.canWrite).toBe(false);
    expect(result.reason).toContain("No cluster leader");
  });

  test("disables writes when quorum is unhealthy", () => {
    const result = getWriteAvailability(status({ raft: { ...status().raft, quorum_status: "unhealthy" } }));

    expect(result.canWrite).toBe(false);
    expect(result.reason).toContain("quorum");
  });

  test("disables writes when projection reports unconfigured cluster", () => {
    const result = getWriteAvailability(
      status({ node: { ...status().node, projection: { status: "error", last_error: "cluster_not_configured" } } }),
    );

    expect(result.canWrite).toBe(false);
    expect(result.setupRequired).toBe(true);
  });
});
