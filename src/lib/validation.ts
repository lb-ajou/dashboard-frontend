import * as v from "valibot";

// Duration regex for Go-style duration strings (e.g., "30s", "1m", "500ms")
const durationRegex = /^\d+(ms|s|m|h)$/;

// Host:port regex for upstream addresses
const hostPortRegex = /^(\[([0-9a-fA-F:]+)\]|([^:[\]]+)):(\d+)$/;

const routeFormBaseSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("Route ID is required")),
  enabled: v.boolean(),
  hosts: v.pipe(
    v.array(
      v.pipe(
        v.string(),
        v.nonEmpty("Host cannot be empty"),
        v.check((host) => !host.includes("*"), "Wildcard hosts are not supported"),
      ),
    ),
    v.minLength(1, "At least one host is required"),
  ),
  pathType: v.picklist(["", "exact", "prefix", "regex"]),
  pathValue: v.optional(v.string(), ""),
  algorithm: v.picklist(["round_robin", "sticky_cookie", "5_tuple_hash", "least_connection"]),
  upstream_pool: v.pipe(v.string(), v.nonEmpty("Upstream pool is required")),
});

export const routeFormSchema = v.pipe(
  routeFormBaseSchema,
  v.forward(
    v.partialCheck(
      [["pathType"], ["pathValue"]],
      ({ pathType, pathValue }) => !pathType || pathValue.length > 0,
      "Path value is required when path type is selected",
    ),
    ["pathValue"],
  ),
  v.forward(
    v.partialCheck(
      [["pathType"], ["pathValue"]],
      ({ pathType, pathValue }) => {
        if (!pathType || !pathValue) return true;
        if (!pathValue.startsWith("/")) return false;
        return pathType !== "prefix" || pathValue === "/" || pathValue.endsWith("/");
      },
      "Invalid path format for the selected type",
    ),
    ["pathValue"],
  ),
);

const upstreamPoolBaseSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("Pool ID is required")),
  upstreams: v.pipe(
    v.array(
      v.pipe(
        v.string(),
        v.nonEmpty("Upstream address cannot be empty"),
        v.regex(hostPortRegex, "Must be in host:port or [ipv6]:port format"),
      ),
    ),
    v.minLength(1, "At least one upstream is required"),
  ),
  health_check_enabled: v.boolean(),
  health_check_path: v.optional(v.string()),
  health_check_interval: v.optional(v.string()),
  health_check_timeout: v.optional(v.string()),
  health_check_expect_status: v.optional(v.number()),
});

export const upstreamPoolFormSchema = v.pipe(
  upstreamPoolBaseSchema,
  v.forward(
    v.partialCheck(
      [["health_check_enabled"], ["health_check_path"]],
      ({ health_check_enabled, health_check_path }) =>
        !health_check_enabled || (!!health_check_path && health_check_path.startsWith("/")),
      "Health check path must start with /",
    ),
    ["health_check_path"],
  ),
  v.forward(
    v.partialCheck(
      [["health_check_enabled"], ["health_check_interval"]],
      ({ health_check_enabled, health_check_interval }) =>
        !health_check_enabled || (!!health_check_interval && durationRegex.test(health_check_interval)),
      "Health check interval must be a Go-style duration such as 30s, 1m, or 500ms",
    ),
    ["health_check_interval"],
  ),
  v.forward(
    v.partialCheck(
      [["health_check_enabled"], ["health_check_timeout"]],
      ({ health_check_enabled, health_check_timeout }) =>
        !health_check_enabled || (!!health_check_timeout && durationRegex.test(health_check_timeout)),
      "Health check timeout must be a Go-style duration such as 3s or 500ms",
    ),
    ["health_check_timeout"],
  ),
  v.forward(
    v.partialCheck(
      [["health_check_enabled"], ["health_check_expect_status"]],
      ({ health_check_enabled, health_check_expect_status }) =>
        !health_check_enabled ||
        (typeof health_check_expect_status === "number" &&
          health_check_expect_status >= 100 &&
          health_check_expect_status <= 599),
      "Health check expected status must be between 100 and 599",
    ),
    ["health_check_expect_status"],
  ),
);

export type RouteFormValues = v.InferOutput<typeof routeFormSchema>;
export type UpstreamPoolFormValues = v.InferOutput<typeof upstreamPoolFormSchema>;
