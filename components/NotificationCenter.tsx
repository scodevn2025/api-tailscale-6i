"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, ExternalLink, RefreshCcw, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface Notification {
  id: string
  status_message: string
  tailscale_url?: string
  timestamp: string
  device_name: string
  serial_number: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== "all") params.append("type", filter)

      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()

      if (response.ok) {
        setNotifications(data.notifications)
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "auth_required":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "offline":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Recent Notifications</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="auth_required">Auth Required</option>
              <option value="offline">Offline</option>
              <option value="active">Active</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No notifications found</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-auto">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(notification.status_message)}
                  <div>
                    <div className="font-medium">{notification.device_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {notification.serial_number} • {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(notification.status_message)}
                  {notification.tailscale_url && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(notification.tailscale_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Auth URL
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
