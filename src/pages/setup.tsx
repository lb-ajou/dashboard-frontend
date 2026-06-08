import * as React from "react";
import { useNavigate } from "react-router";

import { useBootstrapCluster, useJoinCluster, useNodeClusterStatus } from "@/hooks/use-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  buildClusterBootstrapRequest,
  buildNodeJoinClusterRequest,
  requiresVipInterface,
} from "@/lib/cluster-requests";

const setupModes = ["bootstrap", "join"] as const;

type SetupMode = (typeof setupModes)[number];

const setupModeLabels: Record<SetupMode, string> = {
  bootstrap: "Bootstrap",
  join: "Join",
};

const setupUnavailableTitles: Record<string, string> = {
  clustered: "Node already configured",
  existing_state: "Existing raft state detected",
  check_error: "Unable to inspect raft state",
};

const setupStateMessages: Record<string, string> = {
  unconfigured: "This clean node can bootstrap a new cluster or join an existing one.",
  existing_state: "Existing raft state was found. Restart or recover this node instead of running setup.",
  clustered: "This node is already clustered. Use the operations console to inspect it.",
  check_error: "Raft data directory inspection failed. Resolve the error before setup.",
};

function displayValue(value: string | undefined) {
  return value || "unknown";
}

export function SetupPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useNodeClusterStatus();
  const bootstrap = useBootstrapCluster();
  const join = useJoinCluster();
  const [nodeId, setNodeId] = React.useState("");
  const [advertiseAddr, setAdvertiseAddr] = React.useState("");
  const [bindAddr, setBindAddr] = React.useState("");
  const [vipInterface, setVipInterface] = React.useState("");
  const [heartbeatTimeout, setHeartbeatTimeout] = React.useState("2500ms");
  const [electionTimeout, setElectionTimeout] = React.useState("4s");
  const [leaderLeaseTimeout, setLeaderLeaseTimeout] = React.useState("2s");
  const [commitTimeout, setCommitTimeout] = React.useState("250ms");
  const [vipAddress, setVipAddress] = React.useState("");
  const [garpCount, setGarpCount] = React.useState("");
  const [garpInterval, setGarpInterval] = React.useState("");
  const [acquireDelay, setAcquireDelay] = React.useState("");
  const [releaseOnShutdown, setReleaseOnShutdown] = React.useState(false);
  const [peers, setPeers] = React.useState("");
  const [selectedMode, setSelectedMode] = React.useState<SetupMode>("bootstrap");
  const trimmedNodeId = nodeId.trim();
  const trimmedAdvertiseAddr = advertiseAddr.trim();
  const bootstrapVipInterfaceMissing = requiresVipInterface(vipAddress, vipInterface);
  const peerList = peers
    .split("\n")
    .map((peer) => peer.trim())
    .filter(Boolean);
  const canBootstrap = Boolean(
    data?.state === "unconfigured" &&
    !bootstrap.isPending &&
    trimmedNodeId &&
    trimmedAdvertiseAddr &&
    !bootstrapVipInterfaceMissing,
  );
  const canJoin = Boolean(
    data?.state === "unconfigured" && !join.isPending && trimmedNodeId && trimmedAdvertiseAddr && peerList.length > 0,
  );
  const setupFormsAvailable = data?.state === "unconfigured";
  const stateMessage = setupStateMessages[data?.state ?? ""] ?? "This node is not available for setup in its current state.";
  const setupUnavailableTitle = setupUnavailableTitles[data?.state ?? ""] ?? "Setup unavailable";

  const handleBootstrap = () => {
    if (!canBootstrap) {
      return;
    }

    bootstrap.mutate(
      buildClusterBootstrapRequest({
        nodeId,
        raftAdvertiseAddr: advertiseAddr,
        raftBindAddr: bindAddr,
        heartbeatTimeout,
        electionTimeout,
        leaderLeaseTimeout,
        commitTimeout,
        vipInterface,
        vipAddress,
        garpCount,
        garpInterval,
        acquireDelay,
        releaseOnShutdown,
      }),
      {
        onSuccess: async () => {
          await refetch();
          navigate("/overview", { replace: true });
        },
      },
    );
  };

  const handleJoin = () => {
    if (!canJoin) {
      return;
    }

    join.mutate(
      buildNodeJoinClusterRequest({
        nodeId,
        raftAdvertiseAddr: advertiseAddr,
        raftBindAddr: bindAddr,
        vipInterface,
        peers: peerList,
      }),
      {
        onSuccess: async () => {
          await refetch();
          navigate("/overview", { replace: true });
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-1">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Node Setup</h1>
            <p className="text-muted-foreground">Start this node as a new cluster or join it to an existing one.</p>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
          <div className="border-b bg-muted/30 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">Node Status</h2>
                  <Badge variant={error ? "destructive" : "default"}>
                    {isLoading ? "Loading" : displayValue(data?.state)}
                  </Badge>
                </div>
                {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
                {data ? <p className="max-w-3xl text-sm text-muted-foreground">{stateMessage}</p> : null}
                {data?.state === "check_error" && data.last_error ? (
                  <p className="max-w-3xl rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {data.last_error}
                  </p>
                ) : null}
              </div>

              <div className="rounded-md border bg-background px-3 py-2 text-sm lg:min-w-72">
                <div className="text-xs font-medium uppercase text-muted-foreground">Data dir</div>
                <div className="mt-1 break-all font-medium">{displayValue(data?.raft_data_dir)}</div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-8 p-5 sm:p-6">
            {!setupFormsAvailable ? (
              <section className="flex min-h-96 items-center justify-center">
                <div className="mx-auto max-w-xl space-y-4 text-center">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">{setupUnavailableTitle}</h2>
                    <p className="text-muted-foreground">{stateMessage}</p>
                    {data?.state === "check_error" && data.last_error ? (
                      <p className="text-sm text-destructive">{data.last_error}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col justify-center gap-2 sm:flex-row">
                    {data?.state === "clustered" ? (
                      <>
                        <Button type="button" onClick={() => navigate("/overview")}>
                          Open Overview
                        </Button>
                        <Button type="button" variant="outline" onClick={() => navigate("/node")}>
                          Inspect Node
                        </Button>
                      </>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => void refetch()}>
                        Refresh Status
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <>
                <section className="space-y-4 border-b pb-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Node Identity</h2>
                    <p className="text-sm text-muted-foreground">Shared node and raft addresses used by both setup paths.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="node-id">Node ID</Label>
                      <Input
                        id="node-id"
                        value={nodeId}
                        onChange={(event) => setNodeId(event.target.value)}
                        placeholder="node-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="advertise">Raft Advertise Address</Label>
                      <Input
                        id="advertise"
                        value={advertiseAddr}
                        onChange={(event) => setAdvertiseAddr(event.target.value)}
                        placeholder="10.0.0.11:7001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bind">Raft Bind Address</Label>
                      <Input
                        id="bind"
                        value={bindAddr}
                        onChange={(event) => setBindAddr(event.target.value)}
                        placeholder="0.0.0.0:7001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vip-interface">VIP Interface</Label>
                      <Input
                        id="vip-interface"
                        value={vipInterface}
                        onChange={(event) => setVipInterface(event.target.value)}
                        placeholder="eth0"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">
                        {selectedMode === "bootstrap" ? "Bootstrap New Cluster" : "Join Existing Cluster"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedMode === "bootstrap"
                          ? "Configure this clean node as the first member of a new raft cluster."
                          : "Connect this node to an existing raft cluster through peer dashboard URLs."}
                      </p>
                    </div>
                    <div className="grid w-full gap-1 rounded-md border bg-muted/40 p-1 sm:w-64 sm:grid-cols-2">
                      {setupModes.map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={selectedMode === mode ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedMode(mode)}
                          className="justify-center"
                        >
                          {setupModeLabels[mode]}
                        </Button>
                      ))}
                    </div>
                  </div>

                {selectedMode === "bootstrap" ? (
                  <section className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Raft Timing</h3>
                        <p className="text-sm text-muted-foreground">Optional timing values for the new cluster.</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="heartbeat-timeout">Heartbeat Timeout</Label>
                          <Input
                            id="heartbeat-timeout"
                            value={heartbeatTimeout}
                            onChange={(event) => setHeartbeatTimeout(event.target.value)}
                            placeholder="2500ms"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="election-timeout">Election Timeout</Label>
                          <Input
                            id="election-timeout"
                            value={electionTimeout}
                            onChange={(event) => setElectionTimeout(event.target.value)}
                            placeholder="4s"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leader-lease-timeout">Leader Lease Timeout</Label>
                          <Input
                            id="leader-lease-timeout"
                            value={leaderLeaseTimeout}
                            onChange={(event) => setLeaderLeaseTimeout(event.target.value)}
                            placeholder="2s"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commit-timeout">Commit Timeout</Label>
                          <Input
                            id="commit-timeout"
                            value={commitTimeout}
                            onChange={(event) => setCommitTimeout(event.target.value)}
                            placeholder="250ms"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">VIP Settings</h3>
                        <p className="text-sm text-muted-foreground">
                          Optional virtual IP ownership settings for the new cluster.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="space-y-2 xl:col-span-2">
                          <Label htmlFor="vip-address">VIP Address</Label>
                          <Input
                            id="vip-address"
                            value={vipAddress}
                            onChange={(event) => setVipAddress(event.target.value)}
                            placeholder="10.0.0.100"
                            aria-invalid={bootstrapVipInterfaceMissing}
                          />
                          {bootstrapVipInterfaceMissing ? (
                            <p className="text-sm text-destructive">VIP interface is required for VIP address.</p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="garp-count">GARP Count</Label>
                          <Input
                            id="garp-count"
                            value={garpCount}
                            onChange={(event) => setGarpCount(event.target.value)}
                            placeholder="3"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="garp-interval">GARP Interval</Label>
                          <Input
                            id="garp-interval"
                            value={garpInterval}
                            onChange={(event) => setGarpInterval(event.target.value)}
                            placeholder="100ms"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="acquire-delay">Acquire Delay</Label>
                          <Input
                            id="acquire-delay"
                            value={acquireDelay}
                            onChange={(event) => setAcquireDelay(event.target.value)}
                            placeholder="2s"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="release-on-shutdown"
                          checked={releaseOnShutdown}
                          onCheckedChange={setReleaseOnShutdown}
                        />
                        <Label htmlFor="release-on-shutdown">Release VIP on shutdown</Label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-h-5 text-sm">
                        {bootstrapVipInterfaceMissing ? (
                          <p className="text-destructive">Set VIP Interface before bootstrapping with a VIP address.</p>
                        ) : bootstrap.error ? (
                          <p className="text-destructive">{bootstrap.error.message}</p>
                        ) : null}
                      </div>
                      <Button onClick={handleBootstrap} disabled={!canBootstrap} className="sm:min-w-40">
                        {bootstrap.isPending ? "Bootstrapping..." : "Bootstrap Cluster"}
                      </Button>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Peer URLs</h3>
                        <p className="text-sm text-muted-foreground">Enter one dashboard/admin HTTP URL per line.</p>
                      </div>
                      <textarea
                        className="min-h-36 w-full rounded-md border bg-background p-3 text-sm"
                        value={peers}
                        onChange={(event) => setPeers(event.target.value)}
                        placeholder={"http://10.0.0.11:9090\nhttp://10.0.0.12:9090"}
                      />
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-h-5 text-sm">
                        {join.error ? <p className="text-destructive">{join.error.message}</p> : null}
                      </div>
                      <Button onClick={handleJoin} disabled={!canJoin} className="sm:min-w-40">
                        {join.isPending ? "Joining..." : "Join Cluster"}
                      </Button>
                    </div>
                  </section>
                )}
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
