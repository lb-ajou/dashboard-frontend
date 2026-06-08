import { describe, expect, test } from "bun:test";
import * as v from "valibot";

import { routeFormSchema, upstreamPoolFormSchema } from "./validation";

describe("routeFormSchema", () => {
  test("accepts a valid route form", () => {
    const result = v.safeParse(routeFormSchema, {
      id: "r-api",
      enabled: true,
      hosts: ["api.example.com"],
      pathType: "prefix",
      pathValue: "/api/",
      algorithm: "round_robin",
      upstream_pool: "pool-api",
    });

    expect(result.success).toBe(true);
  });

  test("rejects wildcard hosts", () => {
    const result = v.safeParse(routeFormSchema, {
      id: "r-api",
      enabled: true,
      hosts: ["*.example.com"],
      pathType: "",
      pathValue: "",
      algorithm: "round_robin",
      upstream_pool: "pool-api",
    });

    expect(result.success).toBe(false);
    expect(result.issues?.[0]?.message).toBe("Wildcard hosts are not supported");
  });

  test("requires path value when path type is selected", () => {
    const result = v.safeParse(routeFormSchema, {
      id: "r-api",
      enabled: true,
      hosts: ["api.example.com"],
      pathType: "exact",
      pathValue: "",
      algorithm: "round_robin",
      upstream_pool: "pool-api",
    });

    expect(result.success).toBe(false);
    expect(result.issues?.some((issue) => issue.message === "Path value is required when path type is selected")).toBe(
      true,
    );
  });

  test("rejects invalid prefix path format", () => {
    const result = v.safeParse(routeFormSchema, {
      id: "r-api",
      enabled: true,
      hosts: ["api.example.com"],
      pathType: "prefix",
      pathValue: "/api",
      algorithm: "round_robin",
      upstream_pool: "pool-api",
    });

    expect(result.success).toBe(false);
    expect(result.issues?.some((issue) => issue.message === "Invalid path format for the selected type")).toBe(true);
  });
});

describe("upstreamPoolFormSchema", () => {
  test("accepts a valid upstream pool form", () => {
    const result = v.safeParse(upstreamPoolFormSchema, {
      id: "pool-api",
      upstreams: ["10.0.0.11:8080"],
      health_check_enabled: true,
      health_check_path: "/health",
      health_check_interval: "30s",
      health_check_timeout: "3s",
      health_check_expect_status: 200,
    });

    expect(result.success).toBe(true);
  });

  test("rejects invalid upstream address format", () => {
    const result = v.safeParse(upstreamPoolFormSchema, {
      id: "pool-api",
      upstreams: ["10.0.0.11"],
      health_check_enabled: false,
      health_check_path: "/health",
      health_check_interval: "30s",
      health_check_timeout: "3s",
      health_check_expect_status: 200,
    });

    expect(result.success).toBe(false);
    expect(result.issues?.[0]?.message).toBe("Must be in host:port or [ipv6]:port format");
  });

  test("requires valid health check fields when health checks are enabled", () => {
    const result = v.safeParse(upstreamPoolFormSchema, {
      id: "pool-api",
      upstreams: ["10.0.0.11:8080"],
      health_check_enabled: true,
      health_check_path: "health",
      health_check_interval: "30s",
      health_check_timeout: "3s",
      health_check_expect_status: 200,
    });

    expect(result.success).toBe(false);
    expect(result.issues?.some((issue) => issue.message === "Health check path must start with /")).toBe(true);
  });

  test("requires health check fields when health checks are enabled", () => {
    const result = v.safeParse(upstreamPoolFormSchema, {
      id: "pool-api",
      upstreams: ["10.0.0.11:8080"],
      health_check_enabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.issues?.map((issue) => issue.message)).toEqual([
      "Health check path must start with /",
      "Health check interval must be a Go-style duration such as 30s, 1m, or 500ms",
      "Health check timeout must be a Go-style duration such as 3s or 500ms",
      "Health check expected status must be between 100 and 599",
    ]);
  });

  test("requires expected status to be in the HTTP status range", () => {
    const result = v.safeParse(upstreamPoolFormSchema, {
      id: "pool-api",
      upstreams: ["10.0.0.11:8080"],
      health_check_enabled: true,
      health_check_path: "/health",
      health_check_interval: "30s",
      health_check_timeout: "3s",
      health_check_expect_status: 99,
    });

    expect(result.success).toBe(false);
    expect(
      result.issues?.some((issue) => issue.message === "Health check expected status must be between 100 and 599"),
    ).toBe(true);
  });
});
