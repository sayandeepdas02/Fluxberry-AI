
"use client"

import { useEffect, useState } from "react"
import { auditApi, AuditLog } from "@/lib/api/audit"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useDebounce } from "@/hooks/use-debounce"

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [entityType, setEntityType] = useState<string>("ALL")
    const [action, setAction] = useState<string>("ALL")

    const debouncedSearch = useDebounce(search, 500)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const data = await auditApi.list({
                page,
                limit: 20,
                userId: debouncedSearch || undefined, // Simple search by user ID for now
                entityType: entityType !== "ALL" ? entityType : undefined,
                action: action !== "ALL" ? action : undefined,
            })
            setLogs(data.logs)
            setTotal(data.total)
        } catch (error) {
            console.error("Failed to fetch audit logs", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [page, debouncedSearch, entityType, action])

    const totalPages = Math.ceil(total / 20)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track changes and security events within your organization.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activity Trail</CardTitle>
                    <CardDescription>
                        View a detailed history of actions performed by members.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by User ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={entityType} onValueChange={setEntityType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Entity Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Entities</SelectItem>
                                <SelectItem value="JOB">Job</SelectItem>
                                <SelectItem value="CANDIDATE">Candidate</SelectItem>
                                <SelectItem value="APPLICATION">Application</SelectItem>
                                <SelectItem value="INTERVIEW">Interview</SelectItem>
                                <SelectItem value="OFFER">Offer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={action} onValueChange={setAction}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Actions</SelectItem>
                                <SelectItem value="CREATED">Created</SelectItem>
                                <SelectItem value="UPDATED">Updated</SelectItem>
                                <SelectItem value="DELETED">Deleted</SelectItem>
                                <SelectItem value="MOVED">Moved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading audit logs...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="whitespace-nowrap font-medium">
                                                {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                                                        {log.performedBy.firstName[0]}
                                                        {log.performedBy.lastName[0]}
                                                    </div>
                                                    <span className="text-sm">
                                                        {log.performedBy.firstName} {log.performedBy.lastName}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.entityType}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                                        {log.entityId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs text-muted-foreground max-w-[300px] truncate">
                                                    {log.newValue ? JSON.stringify(log.newValue) : "-"}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Page {page} of {totalPages || 1}
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
