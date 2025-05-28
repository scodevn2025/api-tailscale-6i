import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    const result = await query("SELECT NOW() as current_time, version() as version")

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
