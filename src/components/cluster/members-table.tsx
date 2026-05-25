import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ClusterMemberView } from "@/lib/api-types"

interface MembersTableProps {
  members: ClusterMemberView[]
  emptyMessage?: string
}

export function MembersTable({ members, emptyMessage = "No cluster members reported." }: MembersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Raft membership reported by the current node</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node ID</TableHead>
              <TableHead>Raft Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Leader</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono">{member.id}</TableCell>
                  <TableCell className="font-mono">{member.address}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{member.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {member.is_leader ? <Badge>Leader</Badge> : <Badge variant="outline">Member</Badge>}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
