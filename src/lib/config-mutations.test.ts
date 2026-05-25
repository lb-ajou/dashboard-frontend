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
