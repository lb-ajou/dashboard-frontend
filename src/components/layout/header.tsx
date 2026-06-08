import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useStatus } from "@/hooks/use-config";
import { Server } from "lucide-react";

export function Header() {
  const { data: status } = useStatus();
  const nodeName = status?.node.id || "unknown";
  const roleLabel = !status
    ? "Status loading"
    : status.raft.enabled
      ? status.raft.is_leader
        ? "Leader"
        : "Follower"
      : "Standalone";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">LB Dashboard</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Server className="size-3" aria-label="Server" />
            <span>{nodeName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status?.raft.is_leader ? "default" : "secondary"}>{roleLabel}</Badge>
          {status?.raft.enabled ? <Badge variant="outline">Quorum {status.raft.quorum_status || "unknown"}</Badge> : null}
        </div>
      </div>
    </header>
  );
}
