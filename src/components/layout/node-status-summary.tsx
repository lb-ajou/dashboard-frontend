import { Server } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { HeaderStatusDisplay } from "@/lib/header-status"

interface NodeStatusSummaryProps {
  display: HeaderStatusDisplay
}

export function NodeStatusSummary({ display }: NodeStatusSummaryProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="max-w-36 truncate font-mono font-medium sm:max-w-48">{display.nodeLabel}</span>
      </div>
      <Badge variant={display.roleTone}>{display.roleLabel}</Badge>
      <Badge variant={display.quorumTone} className="hidden sm:inline-flex">
        {display.quorumLabel}
      </Badge>
    </div>
  )
}
