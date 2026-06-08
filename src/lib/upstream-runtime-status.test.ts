import { describe, expect, test } from "bun:test";
import type { RuntimeUpstreamView } from "./api-types";
import { getUpstreamTargetRuntimeStatuses } from "./upstream-runtime-status";

const runtimeUpstreams: RuntimeUpstreamView[] = [
  {
    global_id: "default:dashboard",
    local_id: "dashboard",
    source: "default",
    targets: [
      {
        address: "localhost:3000",
        healthy: false,
        last_error: "unexpected status: 500",
        active_connections: 0,
      },
      {
        address: "localhost:3001",
        healthy: true,
        active_connections: 3,
      },
    ],
    health_check: {
      path: "/",
      interval: "10s",
      timeout: "3s",
      expect_status: 200,
    },
  },
];

describe("getUpstreamTargetRuntimeStatuses", () => {
  test("matches desired targets to runtime target health by pool local id and address", () => {
    expect(
      getUpstreamTargetRuntimeStatuses({
        poolId: "dashboard",
        upstreams: ["localhost:3000", "localhost:3001"],
        runtimeUpstreams,
        showActiveConnections: true,
      }),
    ).toEqual([
      {
        address: "localhost:3000",
        state: "unhealthy",
        label: "Unhealthy",
        activeConnections: 0,
        lastError: "unexpected status: 500",
      },
      {
        address: "localhost:3001",
        state: "healthy",
        label: "Healthy",
        activeConnections: 3,
      },
    ]);
  });

  test("marks desired targets as not applied when the runtime pool is missing", () => {
    expect(
      getUpstreamTargetRuntimeStatuses({
        poolId: "api",
        upstreams: ["localhost:4000"],
        runtimeUpstreams,
      }),
    ).toEqual([
      {
        address: "localhost:4000",
        state: "not_applied",
        label: "Not applied",
      },
    ]);
  });

  test("marks desired targets as not applied when a runtime target is missing", () => {
    expect(
      getUpstreamTargetRuntimeStatuses({
        poolId: "dashboard",
        upstreams: ["localhost:3000", "localhost:3002"],
        runtimeUpstreams,
        showActiveConnections: true,
      }),
    ).toEqual([
      {
        address: "localhost:3000",
        state: "unhealthy",
        label: "Unhealthy",
        activeConnections: 0,
        lastError: "unexpected status: 500",
      },
      {
        address: "localhost:3002",
        state: "not_applied",
        label: "Not applied",
      },
    ]);
  });

  test("uses loading and unknown states for unavailable runtime data", () => {
    expect(
      getUpstreamTargetRuntimeStatuses({
        poolId: "dashboard",
        upstreams: ["localhost:3000"],
        runtimeUpstreams: undefined,
        runtimeLoading: true,
      }),
    ).toEqual([{ address: "localhost:3000", state: "loading", label: "Checking" }]);

    expect(
      getUpstreamTargetRuntimeStatuses({
        poolId: "dashboard",
        upstreams: ["localhost:3000"],
        runtimeUpstreams: undefined,
        runtimeUnavailable: true,
      }),
    ).toEqual([{ address: "localhost:3000", state: "unknown", label: "Unknown" }]);
  });

  test("omits active connections unless explicitly requested", () => {
    expect(
      getUpstreamTargetRuntimeStatuses({
        poolId: "dashboard",
        upstreams: ["localhost:3000"],
        runtimeUpstreams,
      }),
    ).toEqual([
      {
        address: "localhost:3000",
        state: "unhealthy",
        label: "Unhealthy",
        lastError: "unexpected status: 500",
      },
    ]);
  });
});
