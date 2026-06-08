import { describe, expect, test } from "bun:test";
import type { NamespaceConfigView, RouteConfig, UpstreamPool } from "./api-types";
import {
  addRoute,
  addUpstreamPool,
  deleteRoute,
  deleteUpstreamPool,
  replaceRoute,
  replaceUpstreamPool,
  toReplaceConfigRequest,
} from "./config-mutations";

function config(): NamespaceConfigView {
  return {
    namespace: "default",
    exists: true,
    applied_at: "2026-06-08T00:00:00Z",
    routes: [
      {
        id: "r-api",
        enabled: true,
        match: { hosts: ["api.example.com"], path: { type: "prefix", value: "/api/" } },
        algorithm: "round_robin",
        upstream_pool: "pool-api",
      },
    ],
    upstream_pools: {
      "pool-api": { upstreams: ["10.0.0.11:8080"] },
    },
  };
}

const newRoute: RouteConfig = {
  id: "r-web",
  enabled: true,
  match: { hosts: ["web.example.com"] },
  algorithm: "least_connection",
  upstream_pool: "pool-api",
};

const newPool: UpstreamPool = {
  upstreams: ["10.0.0.12:8080"],
  health_check: { path: "/health", interval: "30s", timeout: "3s", expect_status: 200 },
};

describe("config-mutations", () => {
  test("converts to a replace request without sharing nested config references", () => {
    const original = config();
    original.upstream_pools["pool-api"] = newPool;

    const request = toReplaceConfigRequest(original);

    expect(request.routes).not.toBe(original.routes);
    expect(request.routes[0]).not.toBe(original.routes[0]);
    expect(request.routes[0]?.match).not.toBe(original.routes[0]?.match);
    expect(request.routes[0]?.match.hosts).not.toBe(original.routes[0]?.match.hosts);
    expect(request.routes[0]?.match.path).not.toBe(original.routes[0]?.match.path);
    expect(request.upstream_pools).not.toBe(original.upstream_pools);
    expect(request.upstream_pools["pool-api"]).not.toBe(original.upstream_pools["pool-api"]);
    expect(request.upstream_pools["pool-api"]?.upstreams).not.toBe(original.upstream_pools["pool-api"]?.upstreams);
    expect(request.upstream_pools["pool-api"]?.health_check).not.toBe(
      original.upstream_pools["pool-api"]?.health_check,
    );
  });

  test("adds a route without mutating the original config", () => {
    const original = config();
    const next = addRoute(original, newRoute);

    expect(original.routes).toHaveLength(1);
    expect(next.routes.map((route) => route.id)).toEqual(["r-api", "r-web"]);
  });

  test("rejects duplicate route ids", () => {
    expect(() => addRoute(config(), { ...newRoute, id: "r-api" })).toThrow("Route r-api already exists");
  });

  test("replaces an existing route", () => {
    const next = replaceRoute(config(), "r-api", { ...newRoute, id: "r-api", enabled: false });

    expect(next.routes).toHaveLength(1);
    expect(next.routes[0]?.enabled).toBe(false);
    expect(next.routes[0]?.algorithm).toBe("least_connection");
  });

  test("deletes a route", () => {
    expect(deleteRoute(config(), "r-api").routes).toEqual([]);
  });

  test("adds and replaces upstream pools", () => {
    const added = addUpstreamPool(config(), "pool-web", newPool);
    const replaced = replaceUpstreamPool(added, "pool-web", "pool-web-v2", { upstreams: ["10.0.0.13:8080"] });

    expect(Object.keys(replaced.upstream_pools).sort()).toEqual(["pool-api", "pool-web-v2"]);
    expect(replaced.routes).toHaveLength(1);
  });

  test("rejects duplicate upstream pool ids", () => {
    expect(() => addUpstreamPool(config(), "pool-api", newPool)).toThrow("Upstream pool pool-api already exists");
  });

  test("rejects upstream pool rename collisions", () => {
    const added = addUpstreamPool(config(), "pool-web", newPool);

    expect(() => replaceUpstreamPool(added, "pool-web", "pool-api", newPool)).toThrow(
      "Upstream pool pool-api already exists",
    );
  });

  test("renaming a referenced pool updates route references", () => {
    const next = replaceUpstreamPool(config(), "pool-api", "pool-api-v2", newPool);

    expect(next.routes[0]?.upstream_pool).toBe("pool-api-v2");
  });

  test("rejects deleting a referenced pool", () => {
    expect(() => deleteUpstreamPool(config(), "pool-api")).toThrow("Cannot delete pool-api because route r-api uses it");
  });
});
