import { describe, expect, test } from "bun:test";
import type { NamespaceConfigView, RouteConfig, UpstreamPoolConfig } from "@/lib/api-types";
import {
  addRouteToConfig,
  deletePoolFromConfig,
  deleteRouteFromConfig,
  renamePoolInConfig,
  toPutRequest,
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

function multiRouteConfig(): NamespaceConfigView {
  return {
    ...baseConfig(),
    routes: [
      ...baseConfig().routes,
      {
        id: "r-web",
        enabled: true,
        match: { hosts: ["www.example.com"], path: { type: "prefix", value: "/" } },
        upstream_pool: "pool-web",
      },
    ],
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

  test("deletes a route without aliasing retained routes from the original config", () => {
    const config = multiRouteConfig();

    const next = deleteRouteFromConfig(config, "r-api");
    config.routes[1]?.match.hosts.push("mutated.example.com");

    expect(next.routes.map((route) => route.id)).toEqual(["r-web"]);
    expect(next.routes[0]?.match.hosts).toEqual(["www.example.com"]);
  });

  test("does not alias caller-owned route inputs", () => {
    const addRoute: RouteConfig = {
      id: "r-web",
      enabled: true,
      match: { hosts: ["www.example.com"], path: { type: "prefix", value: "/" } },
      upstream_pool: "pool-web",
    };
    const upsertRoute: RouteConfig = {
      id: "r-api",
      enabled: false,
      match: { hosts: ["api-v2.example.com"], path: { type: "exact", value: "/v2" } },
      upstream_pool: "pool-api",
    };

    const added = addRouteToConfig(baseConfig(), addRoute);
    const updated = upsertRouteInConfig(baseConfig(), "r-api", upsertRoute);
    addRoute.match.hosts.push("mutated.example.com");
    upsertRoute.match.hosts.push("mutated.example.com");
    if (addRoute.match.path) addRoute.match.path.value = "/mutated";
    if (upsertRoute.match.path) upsertRoute.match.path.value = "/mutated";

    expect(added.routes[1]?.match.hosts).toEqual(["www.example.com"]);
    expect(added.routes[1]?.match.path?.value).toBe("/");
    expect(updated.routes[0]?.match.hosts).toEqual(["api-v2.example.com"]);
    expect(updated.routes[0]?.match.path?.value).toBe("/v2");
  });

  test("adds or updates an upstream pool", () => {
    const pool: UpstreamPoolConfig = {
      upstreams: ["10.0.0.20:8080"],
      health_check: { path: "/health", interval: "30s", timeout: "3s", expect_status: 200 },
    };
    const config = baseConfig();

    const updated = upsertPoolInConfig(config, "pool-api", pool);
    const added = upsertPoolInConfig(config, "pool-new", pool);

    expect(updated.upstream_pools["pool-api"]).toEqual(pool);
    expect(added.upstream_pools["pool-new"]).toEqual(pool);
    expect(Object.keys(config.upstream_pools)).toEqual(["pool-api", "pool-web"]);
  });

  test("does not alias caller-owned pool inputs", () => {
    const pool: UpstreamPoolConfig = {
      upstreams: ["10.0.0.20:8080"],
      health_check: { path: "/health", interval: "30s", timeout: "3s", expect_status: 200 },
    };

    const upserted = upsertPoolInConfig(baseConfig(), "pool-new", pool);
    const renamed = renamePoolInConfig(baseConfig(), "pool-web", "pool-web-v2", pool);
    pool.upstreams.push("mutated:8080");
    if (pool.health_check) pool.health_check.path = "/mutated";

    expect(upserted.upstream_pools["pool-new"]?.upstreams).toEqual(["10.0.0.20:8080"]);
    expect(upserted.upstream_pools["pool-new"]?.health_check?.path).toBe("/health");
    expect(renamed.upstream_pools["pool-web-v2"]?.upstreams).toEqual(["10.0.0.20:8080"]);
    expect(renamed.upstream_pools["pool-web-v2"]?.health_check?.path).toBe("/health");
  });

  test("renames an upstream pool and rewrites route references", () => {
    const pool: UpstreamPoolConfig = {
      upstreams: ["10.0.0.12:8080"],
    };

    const next = renamePoolInConfig(multiRouteConfig(), "pool-web", "pool-web-v2", pool);

    expect(next.upstream_pools["pool-web"]).toBeUndefined();
    expect(next.upstream_pools["pool-web-v2"]).toEqual(pool);
    expect(next.routes.find((route) => route.id === "r-web")?.upstream_pool).toBe("pool-web-v2");
    expect(next.routes.find((route) => route.id === "r-api")?.upstream_pool).toBe("pool-api");
  });

  test("rejects renaming an upstream pool to an existing id", () => {
    expect(() =>
      renamePoolInConfig(baseConfig(), "pool-web", "pool-api", {
        upstreams: ["10.0.0.12:8080"],
      }),
    ).toThrow("Upstream pool id already exists: pool-api");
  });

  test("rejects renaming a missing upstream pool", () => {
    expect(() =>
      renamePoolInConfig(baseConfig(), "pool-missing", "pool-new", {
        upstreams: ["10.0.0.20:8080"],
      }),
    ).toThrow("Upstream pool id does not exist: pool-missing");
  });

  test("converts to put request without aliasing config structures", () => {
    const config = baseConfig();

    const request = toPutRequest(config);
    request.routes[0]?.match.hosts.push("mutated.example.com");
    request.upstream_pools["pool-api"]?.upstreams.push("mutated:8080");

    expect(config.routes[0]?.match.hosts).toEqual(["api.example.com"]);
    expect(config.upstream_pools["pool-api"]?.upstreams).toEqual(["10.0.0.11:8080"]);
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
