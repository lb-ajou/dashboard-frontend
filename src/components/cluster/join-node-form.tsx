import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatApiError } from "@/lib/api-client"
import { useJoinCluster } from "@/hooks/use-config"

interface JoinNodeFormProps {
  disabled?: boolean
  disabledReason?: string
}

export function JoinNodeForm({ disabled = false, disabledReason }: JoinNodeFormProps) {
  const joinCluster = useJoinCluster()
  const [nodeId, setNodeId] = React.useState("")
  const [raftAddress, setRaftAddress] = React.useState("")
  const isDisabled = disabled || joinCluster.isPending

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (disabled) {
      return
    }

    joinCluster.mutate(
      { node_id: nodeId.trim(), raft_address: raftAddress.trim() },
      {
        onSuccess: () => {
          setNodeId("")
          setRaftAddress("")
        },
        onError: (error) => {
          window.alert(formatApiError(error))
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Node</CardTitle>
        <CardDescription>Add a Raft node by node ID and Raft advertise address</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="node-id">Node ID</Label>
            <Input
              id="node-id"
              value={nodeId}
              onChange={(event) => setNodeId(event.target.value)}
              placeholder="node-2"
              disabled={isDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raft-address">Raft Address</Label>
            <Input
              id="raft-address"
              value={raftAddress}
              onChange={(event) => setRaftAddress(event.target.value)}
              placeholder="127.0.0.1:7002"
              disabled={isDisabled}
            />
          </div>
          {disabledReason ? <p className="text-sm text-muted-foreground">{disabledReason}</p> : null}
          <Button type="submit" disabled={isDisabled || !nodeId.trim() || !raftAddress.trim()}>
            {joinCluster.isPending ? "Joining..." : "Join Cluster"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
