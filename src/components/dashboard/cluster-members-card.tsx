import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClusterView } from "@/lib/api-types";

interface ClusterMembersCardProps {
  cluster: ClusterView | undefined;
  isLoading: boolean;
  error?: Error | null;
}

function displayValue(value?: string) {
  return value || "unknown";
}

export function ClusterMembersCard({ cluster, isLoading, error }: ClusterMembersCardProps) {
  const members = cluster?.members ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cluster Members</CardTitle>
        <CardDescription>Raft membership and leadership across the active cluster.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Raft Address</TableHead>
              <TableHead>Leader</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Loading cluster members...
                </TableCell>
              </TableRow>
            ) : members.length ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.id}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{member.role}</Badge>
                  </TableCell>
                  <TableCell>{member.address}</TableCell>
                  <TableCell>{member.is_leader ? <Badge>Leader</Badge> : <Badge variant="outline">Follower</Badge>}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No cluster members reported.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
