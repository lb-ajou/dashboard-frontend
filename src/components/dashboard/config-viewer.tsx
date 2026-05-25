import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Config } from "@/lib/types"

interface ConfigViewerProps {
  config: Config | undefined
  isLoading: boolean
  namespace: string
}

export function ConfigViewer({ config, isLoading, namespace }: ConfigViewerProps) {
  const configJson = config ? JSON.stringify(config, null, 2) : ""

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Desired Configuration</CardTitle>
        <CardDescription>
          Read-only desired state for the {namespace} namespace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border bg-muted/30">
          <pre className="p-4 text-sm font-mono">
            {isLoading ? (
              <span className="text-muted-foreground">Loading configuration...</span>
            ) : configJson ? (
              <code className="text-foreground">{configJson}</code>
            ) : (
              <span className="text-muted-foreground">No configuration loaded</span>
            )}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
