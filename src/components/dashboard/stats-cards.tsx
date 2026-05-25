import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle, GitBranch, RadioTower, Route, Server } from "lucide-react"
import type { StatusView } from "@/lib/api-types"

interface StatsCardsProps {
  status: StatusView | undefined
  isLoading: boolean
}

export function StatsCards({ status, isLoading }: StatsCardsProps) {
  const runtime = status?.runtime
  const raft = status?.raft
  const vip = status?.vip
  const projection = status?.node.projection

  const stats = [
    {
      title: "Routes",
      value: isLoading ? "-" : runtime?.route_count ?? 0,
      description: `${isLoading ? "-" : runtime?.upstream_pool_count ?? 0} upstream pools`,
      icon: Route,
    },
    {
      title: "Targets",
      value: isLoading ? "-" : runtime?.target_count ?? 0,
      description: `${isLoading ? "-" : runtime?.healthy_target_count ?? 0} healthy / ${isLoading ? "-" : runtime?.unhealthy_target_count ?? 0} unhealthy`,
      icon: Activity,
    },
    {
      title: "Raft",
      value: isLoading ? "-" : raft?.state ?? "unknown",
      description: raft?.enabled ? raft.quorum_status : "disabled",
      icon: GitBranch,
    },
    {
      title: "VIP",
      value: isLoading ? "-" : vip?.enabled ? (vip.owned ? "owned" : "standby") : "disabled",
      description: vip?.last_error || vip?.address || projection?.status || "no VIP configured",
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
