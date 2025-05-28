import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const type = searchParams.get("type") // 'auth_required', 'offline', etc.

    let whereClause = ""
    const queryParams: any[] = []
    let paramIndex = 1

    if (type) {
      whereClause = "WHERE dn.status_message = $1"
      queryParams.push(type)
      paramIndex++
    }

    const notificationsQuery = `
      SELECT 
        dn.id,
        dn.status_message,
        dn.tailscale_url,
        dn.timestamp,
        d.device_name,
        d.serial_number
      FROM device_notifications dn
      JOIN devices d ON dn.device_id = d.id
      ${whereClause}
      ORDER BY dn.timestamp DESC
      LIMIT $${paramIndex}
    `

    queryParams.push(limit)

    const result = await query(notificationsQuery, queryParams)

    return NextResponse.json({
      notifications: result.rows,
      count: result.rows.length,
      _status: "live",
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        _status: "error",
      },
      { status: 500 },
    )
  }
}

// Mark notification as read
export async function PATCH(request: Request) {
  try {
    const { notificationId, read } = await request.json()

    // In a real app, you'd update a 'read' status in the database
    // For now, just return success

    return NextResponse.json({
      success: true,
      notificationId,
      read,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update notification",
      },
      { status: 500 },
    )
  }
}
