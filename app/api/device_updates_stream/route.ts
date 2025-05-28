import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = async () => {
        try {
          const { data: devices } = await supabase.from("devices").select("status")

          const stats =
            devices?.reduce(
              (acc, device) => {
                acc[device.status] = (acc[device.status] || 0) + 1
                return acc
              },
              {} as Record<string, number>,
            ) || {}

          const data = {
            timestamp: new Date().toISOString(),
            stats: {
              active: stats.active || 0,
              auth_required: stats.auth_required || 0,
              offline: stats.offline || 0,
            },
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error("Error sending update:", error)
        }
      }

      // Send initial data
      sendUpdate()

      // Send updates every 30 seconds
      const interval = setInterval(sendUpdate, 30000)

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
