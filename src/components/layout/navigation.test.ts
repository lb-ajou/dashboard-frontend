import { describe, expect, test } from "bun:test";

import { mainNavItems } from "./navigation";

describe("main navigation", () => {
  test("uses Node for the local node diagnostics tab", () => {
    expect(mainNavItems.map((item) => ({ title: item.title, path: item.path }))).toEqual([
      { title: "Overview", path: "/overview" },
      { title: "Routes", path: "/routes" },
      { title: "Upstreams", path: "/upstreams" },
      { title: "Node", path: "/node" },
    ]);
  });
});
