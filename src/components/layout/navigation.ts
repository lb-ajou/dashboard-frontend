import { Cpu, LayoutDashboard, Route, Server } from "lucide-react";

export const mainNavItems = [
  { title: "Overview", path: "/overview", icon: LayoutDashboard },
  { title: "Routes", path: "/routes", icon: Route },
  { title: "Upstreams", path: "/upstreams", icon: Server },
  { title: "Node", path: "/node", icon: Cpu },
];
