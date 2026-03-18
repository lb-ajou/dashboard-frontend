import { StatsCards } from "@/components/dashboard/stats-cards"
import { ConfigViewer } from "@/components/dashboard/config-viewer"
import { useConfig } from "@/hooks/use-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Plus, Route, Server } from "lucide-react"

export function DashboardPage() {
  const { data: config, isLoading } = useConfig()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your reverse proxy configuration
          </p>
        </div>
      </div>

      <StatsCards config={config} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <ConfigViewer config={config} isLoading={isLoading} />

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common operations for managing your proxy
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex flex-col gap-3">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/routes">
                  <Plus className="mr-2 h-4 w-4" />
                  <Route className="mr-2 h-4 w-4" />
                  Create New Route
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/upstreams">
                  <Plus className="mr-2 h-4 w-4" />
                  <Server className="mr-2 h-4 w-4" />
                  Create Upstream Pool
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
