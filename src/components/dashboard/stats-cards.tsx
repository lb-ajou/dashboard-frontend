import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle, GitBranch, RadioTower, Route } from "lucide-react"
import type { StatusView } from "@/lib/api-types"

interface StatsCardsProps {
  status: StatusView | undefined
  isLoading: boolean
  isError?: boolean
}

export function StatsCards({ status, isLoading, isError = false }: StatsCardsProps) {
  const hasStatus = Boolean(status)
  const fallbackDescription = isLoading ? "Loading status..." : isError || !hasStatus ? "Status unavailable" : undefined
  const runtime = status?.runtime
  const raft = status?.raft
  const vip = status?.vip
  const projection = status?.node.projection

  const stats = [
    {
      title: "Routes",
      value: fallbackDescription ? "-" : runtime?.route_count ?? 0,
      description: fallbackDescription ?? `${runtime?.upstream_pool_count ?? 0} upstream pools`,
      icon: Route,
    },
    {
      title: "Targets",
      value: fallbackDescription ? "-" : runtime?.target_count ?? 0,
      description: fallbackDescription ?? `${runtime?.healthy_target_count ?? 0} healthy / ${runtime?.unhealthy_target_count ?? 0} unhealthy`,
      icon: Activity,
    },
    {
      title: "Raft",
      value: fallbackDescription ? "-" : raft?.state ?? "unknown",
      description: fallbackDescription ?? (raft?.enabled ? raft.quorum_status : "disabled"),
      icon: GitBranch,
    },
    {
      title: "VIP",
      value: fallbackDescription ? "-" : vip?.enabled ? (vip.owned ? "owned" : "standby") : "disabled",
      description: fallbackDescription ?? (vip?.last_error || vip?.address || projection?.status || "no VIP configured"),
      icon: vip?.owned ? CheckCircle : RadioTower,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
