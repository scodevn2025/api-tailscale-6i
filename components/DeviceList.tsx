"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, Trash2, ExternalLink, RefreshCcw, AlertCircle, Bug } from "lucide-react"
import type { Device } from "@/lib/types"

export function DeviceList() {
  const [devices, setDevices] = useState<(Device & { notifications: any[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [dataStatus, setDataStatus] = useState<"live" | "fallback" | "error">("live")
  const [debugMode, setDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testSimpleAPI = async () => {
    try {
      console.log("Testing simple API...")
      const response = await fetch("/api/test-simple")
      const text = await response.text()
      console.log("Simple API response:", text)

      const data = JSON.parse(text)
      console.log("Simple API parsed:", data)

      if (data.status === "success") {
        setDevices(data.data.devices)
        setTotalPages(data.data.pagination.pages)
        setDataStatus("live")
        setError(null)
        return true
      }
    } catch (err) {
      console.error("Simple API test failed:", err)
      return false
    }
    return false
  }

  const testDebugAPI = async () => {
    try {
      console.log("Testing debug API...")
      const response = await fetch("/api/debug")
      const text = await response.text()
      console.log("Debug API response:", text)

      const data = JSON.parse(text)
      console.log("Debug API parsed:", data)
      setDebugInfo(data)
      return data
    } catch (err) {
      console.error("Debug API test failed:", err)
      return null
    }
  }

  const fetchDevices = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { search }),
      })

      console.log("Fetching devices with params:", params.toString())

      const response = await fetch(`/api/devices?${params}`)

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Get raw text first for debugging
      const responseText = await response.text()
      console.log("Raw response (first 500 chars):", responseText.substring(0, 500))

      // Check if response looks like HTML (error page)
      if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        console.error("Received HTML instead of JSON")
        setError("Server returned HTML error page instead of JSON. Check server logs.")
        setDataStatus("error")

        // Try simple API as fallback
        const simpleWorked = await testSimpleAPI()
        if (simpleWorked) {
          setError("Main API failed, using test data. Check database connection.")
          setDataStatus("fallback")
        }
        return
      }

      // Try to parse JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError)
        console.error("Response text:", responseText)

        setError(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`)
        setDataStatus("error")

        // Try simple API as fallback
        const simpleWorked = await testSimpleAPI()
        if (simpleWorked) {
          setError("Main API failed, using test data")
          setDataStatus("fallback")
        }
        return
      }

      // Handle parsed data
      console.log("Parsed data:", data)

      setDevices(data.devices || [])
      setTotalPages(data.pagination?.pages || 1)
      setDataStatus(data._status || "live")

      if (data._status === "fallback") {
        setError(`Database unavailable: ${data._message || "Using fallback data"}`)
      } else if (data._status === "error") {
        setError(`Error: ${data._message || "Failed to load devices"}`)
      } else if (!response.ok) {
        setError(`HTTP ${response.status}: ${data._message || "Server error"}`)
      }
    } catch (err) {
      console.error("Error fetching devices:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch devices")
      setDataStatus("error")

      // Try simple API as fallback
      const simpleWorked = await testSimpleAPI()
      if (simpleWorked) {
        setError("Main API failed, using test data")
        setDataStatus("fallback")
      } else {
        setDevices([])
        setTotalPages(1)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [page, statusFilter, search])

  const deleteDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" })
      if (response.ok) {
        fetchDevices()
      } else {
        const errorText = await response.text()
        console.error("Delete error:", errorText)
        setError(`Failed to delete device: ${errorText}`)
      }
    } catch (error) {
      console.error("Error deleting device:", error)
      setError("Failed to delete device")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "auth_required":
        return <Badge className="bg-yellow-100 text-yellow-800">Auth Required</Badge>
      case "offline":
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDataStatusBadge = () => {
    switch (dataStatus) {
      case "live":
        return <Badge variant="default">Live Data</Badge>
      case "fallback":
        return <Badge variant="outline">Test Data</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Devices</CardTitle>
          <div className="flex items-center gap-2">
            {getDataStatusBadge()}
            <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)}>
              <Bug className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={fetchDevices} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
        </div>

        {debugMode && (
          <div className="bg-gray-100 p-4 rounded text-xs">
            <div className="flex gap-2 mb-2">
              <Button size="sm" onClick={testSimpleAPI}>
                Test Simple API
              </Button>
              <Button size="sm" onClick={testDebugAPI}>
                Test Debug API
              </Button>
            </div>
            {debugInfo && <pre className="overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="auth_required">Auth Required</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {dataStatus === "error" ? (
              <div>
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Unable to load devices</p>
                <div className="flex gap-2 justify-center mt-2">
                  <Button variant="outline" onClick={fetchDevices}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={testSimpleAPI}>
                    Test Simple API
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p>No devices found</p>
                {search && <p className="text-sm">Try adjusting your search criteria</p>}
              </div>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.device_name}</TableCell>
                    <TableCell>{device.serial_number}</TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>{new Date(device.last_seen).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {device.notifications[0]?.tailscale_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(device.notifications[0].tailscale_url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Device</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {device.device_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteDevice(device.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
