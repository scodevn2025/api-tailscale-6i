import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST() {
  try {
    // Test database connection with retry logic
    let retries = 3
    let connected = false

    while (retries > 0 && !connected) {
      try {
        await query("SELECT 1")
        connected = true
      } catch (error) {
        retries--
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    if (!connected) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed after retries",
        },
        { status: 503 },
      )
    }

    // Check for devices that haven't been seen recently
    const staleDevicesQuery = `
      SELECT id, device_name, serial_number, last_seen, status
      FROM devices 
      WHERE last_seen < NOW() - INTERVAL '10 minutes'
      AND status != 'offline'
    `

    const staleDevices = await query(staleDevicesQuery)

    // Update stale devices to offline
    if (staleDevices.rows.length > 0) {
      await query(`
        UPDATE devices 
        SET status = 'offline', updated_at = NOW()
        WHERE last_seen < NOW() - INTERVAL '10 minutes'
        AND status != 'offline'
      `)
    }

    return NextResponse.json({
      success: true,
      recoveredConnection: true,
      staleDevicesFound: staleDevices.rows.length,
      staleDevices: staleDevices.rows.map((d) => ({
        name: d.device_name,
        serial: d.serial_number,
        lastSeen: d.last_seen,
      })),
    })
  } catch (error) {
    console.error("Connection recovery failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
