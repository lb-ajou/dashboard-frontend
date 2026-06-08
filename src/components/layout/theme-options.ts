import { Monitor, Moon, Sun } from "lucide-react";

export const themeOptions = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export type ThemeOptionValue = (typeof themeOptions)[number]["value"];

export const themeMenuLabel = "Appearance";
