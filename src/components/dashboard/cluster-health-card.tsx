import { GitBranch } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardClusterDisplayState } from "@/lib/cluster-display"

interface ClusterHealthCardProps {
  displayState: DashboardClusterDisplayState
  errorMessage?: string
}

function statusVariant(tone: DashboardClusterDisplayState["status"]["tone"]) {
  if (tone === "destructive") {
    return "destructive"
  }

  if (tone === "secondary") {
    return "secondary"
  }

  return "outline"
}

export function ClusterHealthCard({ displayState, errorMessage }: ClusterHealthCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>HA Cluster</CardTitle>
            <CardDescription>Raft quorum and membership from this node</CardDescription>
          </div>
          <Badge variant={statusVariant(displayState.status.tone)}>{displayState.status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Quorum</div>
            <div className="truncate font-medium">{displayState.quorum}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Members</div>
            <div className="truncate font-medium">{displayState.memberCountLabel}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Leader</div>
            <div className="truncate font-mono text-sm">{displayState.leader}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Local Node</div>
            <div className="truncate font-mono text-sm">{displayState.localNode}</div>
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-muted-foreground">{errorMessage}</p> : null}
        {displayState.message && !errorMessage ? (
          <p className="text-sm text-muted-foreground">{displayState.message}</p>
        ) : null}

        {displayState.members.length ? (
          <div className="space-y-2">
            {displayState.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate font-mono font-medium">{member.id}</span>
                  </div>
                  <div className="truncate font-mono text-xs text-muted-foreground">{member.address}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{member.role}</Badge>
                  {member.isLeader ? <Badge>Leader</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
