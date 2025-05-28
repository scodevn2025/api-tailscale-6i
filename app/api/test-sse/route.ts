import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  console.log("Test SSE endpoint called")

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let counter = 0

      const sendUpdate = () => {
        counter++
        const data = {
          timestamp: new Date().toISOString(),
          counter,
          message: "Test SSE message",
          stats: {
            active: Math.floor(Math.random() * 10),
            auth_required: Math.floor(Math.random() * 5),
            offline: Math.floor(Math.random() * 3),
          },
          _status: "test",
        }

        console.log("Sending test SSE data:", data)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send initial data
      sendUpdate()

      // Send updates every 5 seconds for testing
      const interval = setInterval(sendUpdate, 5000)

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        console.log("Test SSE connection closed")
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
