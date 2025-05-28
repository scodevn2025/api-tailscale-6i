import type { NextRequest } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  console.log("SSE endpoint called")

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let intervalId: NodeJS.Timeout | null = null

      const sendUpdate = async () => {
        try {
          console.log("Sending SSE update...")

          // Kiểm tra kết nối database với timeout
          let dbConnected = false
          try {
            await Promise.race([
              query("SELECT 1"),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 3000)),
            ])
            dbConnected = true
          } catch (dbError) {
            console.error("Database connection error in SSE:", dbError)
            // Gửi dữ liệu mặc định
            const fallbackData = {
              timestamp: new Date().toISOString(),
              stats: {
                active: 0,
                auth_required: 0,
                offline: 0,
              },
              _status: "fallback",
              _message: "Database unavailable",
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(fallbackData)}\n\n`))
            return
          }

          if (!dbConnected) {
            const fallbackData = {
              timestamp: new Date().toISOString(),
              stats: {
                active: 0,
                auth_required: 0,
                offline: 0,
              },
              _status: "fallback",
              _message: "Database connection failed",
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(fallbackData)}\n\n`))
            return
          }

          // Query stats
          const statsQuery = `
            SELECT 
              COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
              COUNT(CASE WHEN status = 'auth_required' THEN 1 END) as auth_required,
              COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline
            FROM devices
          `

          const result = await query(statsQuery)
          const stats = result.rows[0]

          const data = {
            timestamp: new Date().toISOString(),
            stats: {
              active: Number.parseInt(stats.active) || 0,
              auth_required: Number.parseInt(stats.auth_required) || 0,
              offline: Number.parseInt(stats.offline) || 0,
            },
            _status: "live",
          }

          console.log("Sending SSE data:", data)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error("Error sending SSE update:", error)

          // Gửi thông báo lỗi
          const errorData = {
            timestamp: new Date().toISOString(),
            stats: {
              active: 0,
              auth_required: 0,
              offline: 0,
            },
            _status: "error",
            _error: error instanceof Error ? error.message : "Unknown error",
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
        }
      }

      // Send initial data immediately
      sendUpdate()

      // Send updates every 30 seconds
      intervalId = setInterval(sendUpdate, 30000)

      // Cleanup on close
      const cleanup = () => {
        console.log("SSE connection closed")
        if (intervalId) {
          clearInterval(intervalId)
        }
        try {
          controller.close()
        } catch (e) {
          // Controller might already be closed
        }
      }

      // Handle client disconnect
      request.signal.addEventListener("abort", cleanup)

      // Handle stream errors
      controller.error = (error) => {
        console.error("SSE stream error:", error)
        cleanup()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
