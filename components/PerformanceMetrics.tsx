"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Database, Bell, Clock, RefreshCcw } from "lucide-react"

interface Metrics {
  database: {
    total_devices: number
    recent_devices: number
    active_devices: number
    auth_required_devices: number
    offline_devices: number
    avg_last_seen_seconds: number
  }
  notifications: {
    total_notifications: number
    recent_notifications: number
    auth_notifications: number
  }
  system: {
    timestamp: string
    uptime: number
    memory: {
      rss: number
      heapUsed: number
      heapTotal: number
    }
    nodeVersion: string
  }
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/metrics")
      const data = await response.json()

      if (response.ok) {
        setMetrics(data)
        setError(null)
      } else {
        setError(data.error || "Failed to fetch metrics")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatMemory = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`
  }

  const formatLastSeen = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  if (loading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading metrics...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Metrics</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4">{error}</div>}

        {metrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Database</span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  Recent devices: <Badge variant="outline">{metrics.database.recent_devices}</Badge>
                </div>
                <div>
                  Avg last seen:{" "}
                  <Badge variant="outline">{formatLastSeen(metrics.database.avg_last_seen_seconds)}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Notifications</span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  Last 24h: <Badge variant="outline">{metrics.notifications.total_notifications}</Badge>
                </div>
                <div>
                  Last hour: <Badge variant="outline">{metrics.notifications.recent_notifications}</Badge>
                </div>
                <div>
                  Auth required: <Badge variant="outline">{metrics.notifications.auth_notifications}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="font-medium">System</span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  Uptime: <Badge variant="outline">{formatUptime(metrics.system.uptime)}</Badge>
                </div>
                <div>
                  Memory: <Badge variant="outline">{formatMemory(metrics.system.memory.heapUsed)}</Badge>
                </div>
                <div>
                  Node: <Badge variant="outline">{metrics.system.nodeVersion}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Status</span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  Updated: <Badge variant="outline">{new Date(metrics.system.timestamp).toLocaleTimeString()}</Badge>
                </div>
                <div>
                  Health: <Badge className="bg-green-100 text-green-800">Good</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
