import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ClusterDisplayState } from "@/lib/cluster-display"

interface ClusterSummaryProps {
  displayState: ClusterDisplayState
}

export function ClusterSummary({ displayState }: ClusterSummaryProps) {
  const items = [
    { title: "Mode", value: displayState.summary.mode },
    { title: "Quorum", value: displayState.summary.quorum },
    { title: "Leader", value: displayState.summary.leader },
    { title: "Local Node", value: displayState.summary.localNode },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{item.value}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
