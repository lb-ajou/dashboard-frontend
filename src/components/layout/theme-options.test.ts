import { describe, expect, test } from "bun:test";

import { themeMenuLabel, themeOptions } from "./theme-options";

describe("theme options", () => {
  test("offers system, light, and dark modes in sidebar order", () => {
    expect(themeOptions.map((option) => ({ value: option.value, label: option.label }))).toEqual([
      { value: "system", label: "System" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ]);
  });

  test("uses a stable appearance menu label", () => {
    expect(themeMenuLabel).toBe("Appearance");
  });
});
