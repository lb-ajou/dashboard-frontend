import { useCluster, useStatus } from "@/hooks/use-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getWriteAvailability } from "@/lib/write-availability";
import type { StatusView } from "@/lib/api-types";

function displayValue(value?: string | boolean | number) {
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value || "Unknown";
}

function displayVipAddress(status: StatusView | undefined) {
  if (!status) {
    return "Unknown";
  }

  if (!status.vip.enabled) {
    return "Disabled";
  }

  return displayValue(status.vip.address);
}

function timingValue(value?: string) {
  return value || "-";
}

function titleCase(value?: string) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function numericValue(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function indexDelta(from?: string, to?: string) {
  const fromValue = numericValue(from);
  const toValue = numericValue(to);

  if (fromValue === undefined || toValue === undefined) {
    return "-";
  }

  return Math.max(fromValue - toValue, 0);
}

function LocalNodeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["node", "role", "vip", "writes"].map((item) => (
          <Card key={item}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
}

function SummaryCard({ title, value, description }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="truncate text-2xl font-semibold text-foreground">{value}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface DetailRowProps {
  label: string;
  value: string | number;
  muted?: boolean;
}

function DetailRow({ label, value, muted = false }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={muted ? "break-all text-right text-muted-foreground" : "break-all text-right font-medium"}>
        {value}
      </span>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: string | number;
  description: string;
}

function MetricTile({ label, value, description }: MetricTileProps) {
  return (
    <div className="flex min-h-28 flex-col justify-between gap-3 rounded-md border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function NodePage() {
  const { data: cluster, isLoading: clusterLoading, error: clusterError } = useCluster();
  const { data: status, isLoading: statusLoading, error: statusError } = useStatus();
  const writeAvailability = getWriteAvailability(status);
  const localNodeId = cluster?.local.id ?? status?.node.id;
  const localState = cluster?.local.state ?? status?.raft.state;
  const leaderId = cluster?.leader.id ?? status?.raft.leader_id;
  const isLoading = clusterLoading && statusLoading;
  const clusterStatus = status?.raft.enabled ? status.raft.quorum_status : "standalone";

  if (isLoading) {
    return <LocalNodeSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Local Node</h1>
          <p className="max-w-3xl text-muted-foreground">
            Inspect this node's identity, Raft leadership, VIP ownership, projection state, and log progress.
          </p>
        </div>
        {clusterError ? <p className="text-sm text-destructive">{clusterError.message}</p> : null}
        {statusError ? <p className="text-sm text-destructive">{statusError.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Node ID" value={displayValue(localNodeId)} description="Local node identifier" />
        <SummaryCard
          title="Leadership"
          value={displayValue(leaderId)}
          description={
            status?.raft.enabled ? `Quorum ${displayValue(clusterStatus).toLowerCase()}` : "Raft is disabled"
          }
        />
        <SummaryCard
          title="VIP"
          value={displayVipAddress(status)}
          description={
            status?.vip.enabled
              ? `Interface ${displayValue(status.vip.interface).toLowerCase()}`
              : "No virtual IP takeover"
          }
        />
        <SummaryCard
          title="Writes"
          value={writeAvailability.canWrite ? "Available" : "Unavailable"}
          description={writeAvailability.reason ?? "This node can accept configuration changes."}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>Node Details</CardTitle>
            <CardDescription>Local identity, listeners, and desired-config projection state.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <DetailRow label="Raft address" value={displayValue(cluster?.local.address)} />
              <DetailRow label="Proxy listener" value={displayValue(status?.node.proxy_listen_addr)} />
              <DetailRow label="Dashboard listener" value={displayValue(status?.node.dashboard_listen_addr)} />
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <DetailRow label="Applied at" value={displayValue(status?.node.applied_at)} muted />
              <DetailRow label="Projection" value={titleCase(status?.node.projection.status)} />
              {status?.node.projection.last_error ? (
                <DetailRow label="Projection error" value={status.node.projection.last_error} />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>Raft Health</CardTitle>
            <CardDescription>Leadership, quorum, and local Raft runtime metadata.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <DetailRow label="Raft enabled" value={displayValue(status?.raft.enabled)} />
              <DetailRow label="Local state" value={titleCase(localState)} />
              <DetailRow label="Term" value={displayValue(cluster?.local.term)} />
              <DetailRow
                label="Leader address"
                value={displayValue(cluster?.leader.address ?? status?.raft.leader_address)}
              />
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Heartbeat" value={timingValue(cluster?.raft_timing?.heartbeat_timeout)} />
              <DetailRow label="Election" value={timingValue(cluster?.raft_timing?.election_timeout)} />
              <DetailRow label="Leader lease" value={timingValue(cluster?.raft_timing?.leader_lease_timeout)} />
              <DetailRow label="Commit" value={timingValue(cluster?.raft_timing?.commit_timeout)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>Log Progress</CardTitle>
          <CardDescription>
            Local Raft index positions and the gaps that usually explain delayed application.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <MetricTile
            label="Last log index"
            value={displayValue(cluster?.local.last_log_index)}
            description="Newest entry stored locally"
          />
          <MetricTile
            label="Commit index"
            value={displayValue(cluster?.local.commit_index)}
            description="Latest quorum-committed entry"
          />
          <MetricTile
            label="Applied index"
            value={displayValue(cluster?.local.applied_index)}
            description="Latest entry applied to runtime"
          />
          <MetricTile
            label="Commit gap"
            value={indexDelta(cluster?.local.last_log_index, cluster?.local.commit_index)}
            description="Stored entries not yet committed"
          />
          <MetricTile
            label="Apply gap"
            value={indexDelta(cluster?.local.commit_index, cluster?.local.applied_index)}
            description="Committed entries not yet applied"
          />
        </CardContent>
      </Card>
    </div>
  );
}
