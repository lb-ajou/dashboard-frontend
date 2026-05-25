# Dashboard Cluster Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the standalone Cluster tab and surface only operationally useful HA cluster state on the Dashboard.

**Architecture:** Keep cluster fetching in the existing `useCluster` hook, but move consumption into `DashboardPage`. Replace the full cluster page with a compact Dashboard card that shows quorum, leader, local node, member count, and member roles while omitting join actions and Raft log indexes.

**Tech Stack:** React, React Router, TanStack Query, Bun test, TypeScript, existing shadcn-style UI primitives.

---

### Task 1: Dashboard Cluster Display Model

**Files:**
- Modify: `src/lib/cluster-display.ts`
- Modify: `src/lib/cluster-display.test.ts`

- [ ] Add tests for a compact Dashboard display model that reports loading, unavailable, file mode, and raft mode states.
- [ ] Implement the compact model with fields for status label, quorum, leader, local node, member count, member list, and empty message.
- [ ] Keep join-node eligibility out of the Dashboard model.

### Task 2: Dashboard HA Cluster Card

**Files:**
- Create: `src/components/dashboard/cluster-health-card.tsx`
- Modify: `src/pages/dashboard.tsx`

- [ ] Fetch cluster data from Dashboard with `useCluster`.
- [ ] Render a compact `HA Cluster` card beside the existing config/runtime panels.
- [ ] Show quorum, leader, local node, member count, and a compact member list.
- [ ] Show clear loading/unavailable/file-mode messages.

### Task 3: Remove Standalone Cluster Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/pages/dashboard.tsx`
- Delete: `src/pages/cluster.tsx`
- Delete: `src/components/cluster/cluster-summary.tsx`
- Delete: `src/components/cluster/join-node-form.tsx`
- Delete: `src/components/cluster/join-node-form.test.ts`
- Delete: `src/components/cluster/members-table.tsx`

- [ ] Remove `/namespaces/:namespace/cluster`.
- [ ] Remove the sidebar Cluster item.
- [ ] Remove Dashboard's `Cluster Status` quick action.
- [ ] Remove join-node UI and tests because cluster membership mutation is no longer exposed.

### Task 4: Verification

- [ ] Run `bun test`.
- [ ] Run `bunx tsc --noEmit`.
- [ ] Run `bun run build`.
- [ ] Open the Dashboard in the browser and verify the HA card appears and the Cluster tab/link is gone.
