"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ApiTester() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [sseConnected, setSseConnected] = useState(false)
  const [sseMessages, setSseMessages] = useState<any[]>([])

  const testEndpoint = async (endpoint: string, name: string) => {
    setLoading((prev) => ({ ...prev, [name]: true }))
    try {
      const response = await fetch(endpoint)
      const text = await response.text()

      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = { error: "Invalid JSON", rawResponse: text.substring(0, 500) }
      }

      setResults((prev) => ({
        ...prev,
        [name]: {
          status: response.status,
          ok: response.ok,
          data,
          headers: Object.fromEntries(response.headers.entries()),
        },
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [name]: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }))
    }
  }

  const testSSE = () => {
    if (sseConnected) {
      return
    }

    setSseMessages([])
    setSseConnected(true)

    const eventSource = new EventSource("/api/test-sse")

    eventSource.onopen = () => {
      console.log("Test SSE connected")
      setSseMessages((prev) => [...prev, { type: "connection", message: "Connected", timestamp: new Date() }])
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setSseMessages((prev) => [...prev, { type: "data", data, timestamp: new Date() }])
      } catch (error) {
        setSseMessages((prev) => [...prev, { type: "error", message: "Parse error", timestamp: new Date() }])
      }
    }

    eventSource.onerror = () => {
      console.log("Test SSE error")
      setSseMessages((prev) => [...prev, { type: "error", message: "Connection error", timestamp: new Date() }])
      setSseConnected(false)
      eventSource.close()
    }

    // Auto close after 30 seconds
    setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close()
        setSseConnected(false)
        setSseMessages((prev) => [...prev, { type: "info", message: "Auto-closed after 30s", timestamp: new Date() }])
      }
    }, 30000)
  }

  const endpoints = [
    { name: "Health Check", url: "/api/health" },
    { name: "Test DB", url: "/api/test-db" },
    { name: "Device Stats", url: "/api/device_stats" },
    { name: "Simple Devices", url: "/api/devices-simple" },
    { name: "Debug", url: "/api/debug" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Endpoint Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {endpoints.map((endpoint) => (
            <div key={endpoint.name} className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testEndpoint(endpoint.url, endpoint.name)}
                disabled={loading[endpoint.name]}
              >
                {loading[endpoint.name] ? "Testing..." : `Test ${endpoint.name}`}
              </Button>
              {results[endpoint.name] && (
                <Badge variant={results[endpoint.name].ok ? "default" : "destructive"}>
                  {results[endpoint.name].status || "Error"}
                </Badge>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={testSSE} disabled={sseConnected}>
              {sseConnected ? "SSE Running..." : "Test SSE"}
            </Button>
            {sseConnected && <Badge variant="default">Connected</Badge>}
          </div>
        </div>

        {sseMessages.length > 0 && (
          <div className="border rounded p-3">
            <h4 className="font-medium mb-2">SSE Messages ({sseMessages.length})</h4>
            <div className="max-h-40 overflow-auto space-y-1">
              {sseMessages.slice(-10).map((msg, idx) => (
                <div key={idx} className="text-xs">
                  <span className="text-gray-500">{msg.timestamp.toLocaleTimeString()}</span>
                  <span className={`ml-2 ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                    {msg.type}:
                  </span>
                  <span className="ml-1">{msg.message || JSON.stringify(msg.data)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.entries(results).map(([name, result]) => (
          <div key={name} className="border rounded p-3">
            <h4 className="font-medium mb-2">{name}</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
