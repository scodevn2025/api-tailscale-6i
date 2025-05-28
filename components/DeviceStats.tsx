"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDeviceUpdates } from "@/hooks/useDeviceUpdates"
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCcw, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function DeviceStats() {
  const { stats, isConnected, error, dataSource } = useDeviceUpdates()
  const [refreshing, setRefreshing] = useState(false)

  // Hàm refresh thủ công
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/device_stats")
      if (response.ok) {
        const data = await response.json()
        console.log("Manual refresh successful:", data)
      }
    } catch (err) {
      console.error("Manual refresh failed:", err)
    } finally {
      setRefreshing(false)
    }
  }

  // Hiển thị badge trạng thái
  const getStatusBadge = () => {
    if (error && dataSource === "error") {
      return (
        <Badge variant="destructive">
          <WifiOff className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )
    }
    if (isConnected && dataSource === "live") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Wifi className="h-3 w-3 mr-1" />
          Live
        </Badge>
      )
    }
    if (dataSource === "fallback") {
      return (
        <Badge variant="outline">
          <RefreshCcw className="h-3 w-3 mr-1" />
          Polling
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <WifiOff className="h-3 w-3 mr-1" />
        Disconnected
      </Badge>
    )
  }

  const getConnectionStatus = () => {
    if (isConnected && dataSource === "live") {
      return "Real-time updates active"
    }
    if (dataSource === "fallback") {
      return "Using polling updates (30s interval)"
    }
    if (error) {
      return error
    }
    return "Connecting..."
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Device Overview</h2>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">{getConnectionStatus()}</div>

      {error && dataSource === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Connection Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.authRequired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
