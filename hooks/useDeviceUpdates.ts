"use client"

import { useEffect, useState } from "react"
import type { DeviceStats } from "@/lib/types"

// Dữ liệu mặc định khi có lỗi
const DEFAULT_STATS: DeviceStats = {
  total: 0,
  active: 0,
  authRequired: 0,
  offline: 0,
}

export function useDeviceUpdates() {
  const [stats, setStats] = useState<DeviceStats>(DEFAULT_STATS)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<"live" | "fallback" | "error">("fallback")

  useEffect(() => {
    let eventSource: EventSource | null = null
    let retryCount = 0
    const maxRetries = 2 // Giảm số lần retry
    let pollInterval: NodeJS.Timeout | null = null

    // Fetch initial stats với polling fallback
    const fetchStats = async () => {
      try {
        console.log("Fetching stats...")
        const response = await fetch("/api/device_stats")

        if (!response.ok) {
          const errorText = await response.text()
          console.warn(`Stats API returned ${response.status}: ${errorText}`)
          setError(`Could not load stats (HTTP ${response.status})`)
          return false
        }

        const data = await response.json()
        console.log("Stats data received:", data)

        // Sử dụng dữ liệu ngay cả khi là fallback
        setStats({
          total: data.total || 0,
          active: data.active || 0,
          authRequired: data.authRequired || 0,
          offline: data.offline || 0,
        })

        setDataSource(data._status || "live")

        if (data._status === "error") {
          setError(`Database error: ${data._error || "Unknown error"}`)
        } else {
          setError(null)
        }
        return true
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setError("Could not connect to stats API")
        return false
      }
    }

    // Polling fallback function
    const startPolling = () => {
      console.log("Starting polling fallback...")
      setDataSource("fallback")
      setIsConnected(false)

      // Fetch immediately
      fetchStats()

      // Then poll every 30 seconds
      pollInterval = setInterval(() => {
        fetchStats()
      }, 30000)
    }

    // Setup SSE with limited retries
    const setupEventSource = () => {
      if (retryCount >= maxRetries) {
        console.log("Max SSE retries reached, switching to polling")
        setError("Real-time updates unavailable, using polling")
        startPolling()
        return
      }

      try {
        console.log(`Setting up SSE connection (attempt ${retryCount + 1})...`)
        eventSource = new EventSource("/api/device_updates_stream")

        const connectionTimeout = setTimeout(() => {
          console.log("SSE connection timeout")
          if (eventSource) {
            eventSource.close()
            eventSource = null
            retryCount++
            setupEventSource()
          }
        }, 10000) // 10 second timeout

        eventSource.onopen = () => {
          console.log("SSE connection established")
          clearTimeout(connectionTimeout)
          setIsConnected(true)
          setError(null)
          retryCount = 0 // Reset retry count on successful connection
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log("SSE data received:", data)
            setStats({
              total: Object.values(data.stats).reduce((a: number, b: number) => a + b, 0),
              active: data.stats.active || 0,
              authRequired: data.stats.auth_required || 0,
              offline: data.stats.offline || 0,
            })
            setDataSource("live")
            setError(null)
          } catch (error) {
            console.error("Error parsing SSE data:", error)
          }
        }

        eventSource.onerror = (event) => {
          console.warn("SSE connection error:", event)
          clearTimeout(connectionTimeout)
          setIsConnected(false)

          // Close and retry or fallback
          if (eventSource) {
            eventSource.close()
            eventSource = null
            retryCount++

            if (retryCount < maxRetries) {
              // Retry with exponential backoff
              setTimeout(
                () => {
                  setupEventSource()
                },
                Math.min(1000 * Math.pow(2, retryCount), 5000),
              )
            } else {
              // Switch to polling
              startPolling()
            }
          }
        }
      } catch (err) {
        console.error("Error setting up SSE:", err)
        setIsConnected(false)
        setError("Could not establish real-time connection")
        startPolling()
      }
    }

    // Start with initial stats fetch
    fetchStats().then((success) => {
      if (success) {
        // Try SSE if initial fetch works
        setupEventSource()
      } else {
        // If initial fetch fails, just use polling
        startPolling()
      }
    })

    // Cleanup
    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [])

  return { stats, isConnected, error, dataSource }
}
