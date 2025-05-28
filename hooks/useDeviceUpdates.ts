"use client"

import { useEffect, useState } from "react"
import type { DeviceStats } from "@/lib/types"

export function useDeviceUpdates() {
  const [stats, setStats] = useState<DeviceStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource("/api/device_updates_stream")

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setStats({
          total: Object.values(data.stats).reduce((a: number, b: number) => a + b, 0),
          active: data.stats.active || 0,
          authRequired: data.stats.auth_required || 0,
          offline: data.stats.offline || 0,
        })
      } catch (error) {
        console.error("Error parsing SSE data:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return { stats, isConnected }
}
