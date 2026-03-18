import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Route, Server, Activity, CheckCircle } from "lucide-react"
import type { Config } from "@/lib/types"

interface StatsCardsProps {
  config: Config | undefined
  isLoading: boolean
}

export function StatsCards({ config, isLoading }: StatsCardsProps) {
  const routes = config?.routes ?? []
  const pools = config?.upstream_pools ?? {}

  const totalRoutes = routes.length
  const activeRoutes = routes.filter(r => r.enabled).length
  const totalPools = Object.keys(pools).length

  // Count total upstreams across all pools
  const totalUpstreams = Object.values(pools).reduce(
    (acc, pool) => acc + pool.upstreams.length,
    0
  )

  // Count pools with health checks configured
  const poolsWithHealthChecks = Object.values(pools).filter(
    pool => pool.health_check
  ).length

  const stats = [
    {
      title: "Total Routes",
      value: isLoading ? "-" : totalRoutes,
      description: `${isLoading ? "-" : activeRoutes} active`,
      icon: Route,
    },
    {
      title: "Upstream Pools",
      value: isLoading ? "-" : totalPools,
      description: `${isLoading ? "-" : poolsWithHealthChecks} with health checks`,
      icon: Server,
    },
    {
      title: "Backend Servers",
      value: isLoading ? "-" : totalUpstreams,
      description: "Total upstreams",
      icon: Activity,
    },
    {
      title: "Active Routes",
      value: isLoading ? "-" : activeRoutes,
      description: `of ${isLoading ? "-" : totalRoutes} routes`,
      icon: CheckCircle,
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
