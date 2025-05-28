"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Database, AlertCircle, CheckCircle } from "lucide-react"

export function DatabaseStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [details, setDetails] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  const checkHealth = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()

      if (data.status === "success") {
        setStatus("connected")
        setDetails(data)
      } else {
        setStatus("error")
        setDetails(data)
      }
    } catch (err) {
      setStatus("error")
      setDetails({
        error: err instanceof Error ? err.message : "Connection failed",
        message: "Failed to connect to database",
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Database className="h-4 w-4 text-muted-foreground" />

      {status === "loading" && <Badge variant="secondary">Checking...</Badge>}

      {status === "connected" && (
        <>
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          {details && (
            <span className="text-xs text-muted-foreground">
              {details.deviceCount} devices • {details.tables?.length || 0} tables
            </span>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
          {details && <span className="text-xs text-red-500">{details.message}</span>}
        </>
      )}

      <Button variant="ghost" size="sm" onClick={checkHealth} disabled={checking}>
        <RefreshCcw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
