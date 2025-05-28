import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Test basic connection
    const timeResult = await query("SELECT NOW() as current_time")

    // Test if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('devices', 'device_notifications')
    `)

    const existingTables = tablesResult.rows.map((row) => row.table_name)

    // Test device count
    let deviceCount = 0
    if (existingTables.includes("devices")) {
      const countResult = await query("SELECT COUNT(*) as count FROM devices")
      deviceCount = Number.parseInt(countResult.rows[0].count)
    }

    return NextResponse.json({
      status: "success",
      timestamp: timeResult.rows[0].current_time,
      tables: existingTables,
      deviceCount,
      message: "Database connection successful",
    })
  } catch (error) {
    console.error("Database test failed:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Database connection failed",
      },
      { status: 500 },
    )
  }
}
