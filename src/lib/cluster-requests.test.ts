import { describe, expect, test } from "bun:test";

import { buildClusterBootstrapRequest, buildNodeJoinClusterRequest, requiresVipInterface } from "./cluster-requests";

describe("cluster request helpers", () => {
  test("builds bootstrap payload with optional raft timing and vip blocks only when provided", () => {
    expect(
      buildClusterBootstrapRequest({
        nodeId: " node-1 ",
        raftAdvertiseAddr: " 10.0.0.11:7001 ",
        raftBindAddr: "",
        heartbeatTimeout: "500ms",
        electionTimeout: "",
        leaderLeaseTimeout: "1s",
        commitTimeout: "",
        vipInterface: " eth0 ",
        vipAddress: " 10.0.0.100 ",
        garpCount: "3",
        garpInterval: "",
        acquireDelay: "2s",
        releaseOnShutdown: true,
      }),
    ).toEqual({
      node_id: "node-1",
      raft_advertise_addr: "10.0.0.11:7001",
      raft_timing: {
        heartbeat_timeout: "500ms",
        leader_lease_timeout: "1s",
      },
      vip_interface: "eth0",
      vip: {
        address: "10.0.0.100",
        garp_count: 3,
        acquire_delay: "2s",
        release_on_shutdown: true,
      },
    });
  });

  test("omits optional nested bootstrap blocks when values are blank", () => {
    expect(
      buildClusterBootstrapRequest({
        nodeId: "node-1",
        raftAdvertiseAddr: "10.0.0.11:7001",
        raftBindAddr: "",
        heartbeatTimeout: "",
        electionTimeout: "",
        leaderLeaseTimeout: "",
        commitTimeout: "",
        vipInterface: "",
        vipAddress: "",
        garpCount: "",
        garpInterval: "",
        acquireDelay: "",
        releaseOnShutdown: false,
      }),
    ).toEqual({
      node_id: "node-1",
      raft_advertise_addr: "10.0.0.11:7001",
    });
  });

  test("builds join payload with optional vip interface", () => {
    expect(
      buildNodeJoinClusterRequest({
        nodeId: "node-2",
        raftAdvertiseAddr: "10.0.0.12:7001",
        raftBindAddr: "",
        vipInterface: "eth0",
        peers: ["http://10.0.0.11:9090"],
      }),
    ).toEqual({
      node_id: "node-2",
      raft_advertise_addr: "10.0.0.12:7001",
      vip_interface: "eth0",
      peers: ["http://10.0.0.11:9090"],
    });
  });

  test("requires vip interface when vip address is provided", () => {
    expect(requiresVipInterface("10.0.0.100", "")).toBe(true);
    expect(requiresVipInterface("10.0.0.100", "eth0")).toBe(false);
    expect(requiresVipInterface("", "")).toBe(false);
  });
});
