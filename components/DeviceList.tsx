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
import { Search, Trash2, ExternalLink, RefreshCcw, AlertCircle, Monitor, Cpu, Wifi, Video, Info } from "lucide-react"

interface Device {
  id: string
  serial_number: string
  device_name: string
  status: string
  cpuid?: string
  device_id?: string
  mac_address?: string
  video_device_name?: string
  video_device_secret?: string
  video_product_key?: string
  tailscale_url?: string
  last_seen: string
  created_at: string
  updated_at: string
  notifications: any[]
  hasVideoInfo: boolean
  hasHardwareInfo: boolean
  needsAuth: boolean
}

export function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [dataStatus, setDataStatus] = useState<"live" | "fallback" | "error">("live")
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)

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

      const response = await fetch(`/api/devices?${params}`)
      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError)
        setError(`Server returned invalid JSON`)
        setDataStatus("error")
        return
      }

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
      setDevices([])
      setTotalPages(1)
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

  const toggleDeviceDetails = (deviceId: string) => {
    setExpandedDevice(expandedDevice === deviceId ? null : deviceId)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Devices</CardTitle>
          <div className="flex items-center gap-2">
            {getDataStatusBadge()}
            <Button variant="outline" size="sm" onClick={fetchDevices} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
        </div>

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
              placeholder="Search devices, serial, or MAC..."
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
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No devices found</p>
            {search && <p className="text-sm">Try adjusting your search criteria</p>}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hardware</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <>
                    <TableRow key={device.id} className="cursor-pointer" onClick={() => toggleDeviceDetails(device.id)}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            {device.device_name}
                          </div>
                          <div className="text-sm text-muted-foreground">{device.serial_number}</div>
                          <div className="flex gap-1 mt-1">
                            {device.hasVideoInfo && (
                              <Badge variant="outline" className="text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                Video
                              </Badge>
                            )}
                            {device.hasHardwareInfo && (
                              <Badge variant="outline" className="text-xs">
                                <Cpu className="h-3 w-3 mr-1" />
                                HW
                              </Badge>
                            )}
                            {device.mac_address && (
                              <Badge variant="outline" className="text-xs">
                                <Wifi className="h-3 w-3 mr-1" />
                                MAC
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(device.status)}
                          {device.needsAuth && (
                            <Badge variant="outline" className="text-xs">
                              Auth URL
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {device.mac_address && <div>MAC: {device.mac_address}</div>}
                          {device.device_id && <div>ID: {device.device_id}</div>}
                          {device.cpuid && (
                            <div className="truncate max-w-[100px]" title={device.cpuid}>
                              CPU: {device.cpuid.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(device.last_seen).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleDeviceDetails(device.id)
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          {device.tailscale_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(device.tailscale_url, "_blank")
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
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
                    {expandedDevice === device.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50">
                          <div className="p-4 space-y-4">
                            <h4 className="font-medium">Device Details</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <strong>Serial Number:</strong>
                                <br />
                                {device.serial_number}
                              </div>
                              <div>
                                <strong>Device Name:</strong>
                                <br />
                                {device.device_name}
                              </div>
                              <div>
                                <strong>Status:</strong>
                                <br />
                                {device.status}
                              </div>
                              {device.cpuid && (
                                <div>
                                  <strong>CPU ID:</strong>
                                  <br />
                                  <span className="font-mono text-xs">{device.cpuid}</span>
                                </div>
                              )}
                              {device.device_id && (
                                <div>
                                  <strong>Device ID:</strong>
                                  <br />
                                  {device.device_id}
                                </div>
                              )}
                              {device.mac_address && (
                                <div>
                                  <strong>MAC Address:</strong>
                                  <br />
                                  <span className="font-mono">{device.mac_address}</span>
                                </div>
                              )}
                              {device.video_device_name && (
                                <div>
                                  <strong>Video Device:</strong>
                                  <br />
                                  {device.video_device_name}
                                </div>
                              )}
                              {device.video_product_key && (
                                <div>
                                  <strong>Video Product Key:</strong>
                                  <br />
                                  {device.video_product_key}
                                </div>
                              )}
                              {device.tailscale_url && (
                                <div>
                                  <strong>Tailscale URL:</strong>
                                  <br />
                                  <a
                                    href={device.tailscale_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {device.tailscale_url.substring(0, 50)}...
                                  </a>
                                </div>
                              )}
                            </div>

                            {device.notifications.length > 0 && (
                              <div>
                                <h5 className="font-medium mb-2">Recent Notifications</h5>
                                <div className="space-y-2">
                                  {device.notifications.slice(0, 3).map((notification) => (
                                    <div key={notification.id} className="text-xs bg-white p-2 rounded border">
                                      <div className="flex justify-between">
                                        <span className="font-medium">{notification.status_message}</span>
                                        <span className="text-gray-500">
                                          {new Date(notification.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      {notification.tailscale_url && (
                                        <div className="mt-1">
                                          <a
                                            href={notification.tailscale_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            Auth URL
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
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
