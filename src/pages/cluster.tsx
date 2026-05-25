import { ClusterSummary } from "@/components/cluster/cluster-summary"
import { JoinNodeForm } from "@/components/cluster/join-node-form"
import { MembersTable } from "@/components/cluster/members-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCluster } from "@/hooks/use-config"
import { formatApiError } from "@/lib/api-client"
import { getClusterDisplayState } from "@/lib/cluster-display"

export function ClusterPage() {
  const { data: cluster, isLoading, isError, error } = useCluster()
  const displayState = getClusterDisplayState({ cluster, isLoading, isError })
  const errorMessage = isError ? formatApiError(error) : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cluster</h1>
        <p className="text-muted-foreground">Raft leader, local node, and membership state</p>
      </div>

      <ClusterSummary displayState={displayState} />

      {errorMessage ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cluster API unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MembersTable members={cluster?.members ?? []} emptyMessage={displayState.membersMessage} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Node</CardTitle>
              <CardDescription>Indexes are Raft log positions from this node</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {displayState.localMessage ? (
                <p className="text-muted-foreground">{displayState.localMessage}</p>
              ) : (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Address</span>
                    <span className="truncate font-mono">{cluster?.local.address ?? "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">State</span>
                    <span>{cluster?.local.state ?? "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Term</span>
                    <span>{cluster?.local.term ?? "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Last Log</span>
                    <span>{cluster?.local.last_log_index ?? "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Commit</span>
                    <span>{cluster?.local.commit_index ?? "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Applied</span>
                    <span>{cluster?.local.applied_index ?? "-"}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <JoinNodeForm disabled={!displayState.canJoin} disabledReason={displayState.joinDisabledReason} />
        </div>
      </div>
    </div>
  )
}
