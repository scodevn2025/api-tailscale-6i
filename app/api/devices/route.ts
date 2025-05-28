import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  console.log("=== DEVICES API CALLED ===")

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    console.log("Query params:", { page, limit, status, search })

    // Test database connection first
    console.log("Testing database connection...")
    try {
      const testResult = await query("SELECT 1 as test")
      console.log("Database connection successful:", testResult.rows[0])
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json({
        devices: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        _status: "fallback",
        _message: `Database connection failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
      })
    }

    const offset = (page - 1) * limit

    // Build WHERE clause
    let whereClause = ""
    const queryParams: any[] = []
    let paramIndex = 1

    if (status && status !== "all") {
      whereClause += whereClause ? " AND " : " WHERE "
      whereClause += `status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    if (search) {
      whereClause += whereClause ? " AND " : " WHERE "
      whereClause += `(device_name ILIKE $${paramIndex} OR serial_number ILIKE $${paramIndex} OR mac_address ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Enhanced query to get devices with all new fields
    const devicesQuery = `
      SELECT 
        id, 
        serial_number, 
        device_name, 
        status, 
        cpuid,
        device_id,
        mac_address,
        video_device_name,
        video_device_secret,
        video_product_key,
        tailscale_url,
        last_seen, 
        created_at, 
        updated_at
      FROM devices
      ${whereClause}
      ORDER BY last_seen DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    console.log("Executing devices query:", devicesQuery)
    console.log("Query params:", queryParams)

    const devicesResult = await query(devicesQuery, queryParams)
    console.log("Devices query successful, rows:", devicesResult.rows.length)

    // Get recent notifications for each device
    const devicesWithNotifications = []
    for (const device of devicesResult.rows) {
      try {
        const notificationQuery = `
          SELECT 
            id, 
            device_id, 
            status_message, 
            tailscale_url, 
            original_log_message, 
            timestamp
          FROM device_notifications 
          WHERE device_id = $1 
          ORDER BY timestamp DESC 
          LIMIT 3
        `
        const notificationResult = await query(notificationQuery, [device.id])

        devicesWithNotifications.push({
          ...device,
          notifications: notificationResult.rows,
          // Add computed fields for easier frontend handling
          hasVideoInfo: !!(device.video_device_name || device.video_device_secret || device.video_product_key),
          hasHardwareInfo: !!(device.cpuid || device.device_id || device.mac_address),
          needsAuth: device.status === "auth_required" && !!device.tailscale_url,
        })
      } catch (notificationError) {
        console.error("Error fetching notifications for device:", device.id, notificationError)
        devicesWithNotifications.push({
          ...device,
          notifications: [],
          hasVideoInfo: false,
          hasHardwareInfo: false,
          needsAuth: false,
        })
      }
    }

    // Get total count
    let total = 0
    try {
      const countQuery = `SELECT COUNT(*) as total FROM devices ${whereClause}`
      const countParams = queryParams.slice(0, -2) // Remove limit and offset
      const countResult = await query(countQuery, countParams)
      total = Number.parseInt(countResult.rows[0].total)
      console.log("Total devices:", total)
    } catch (countError) {
      console.error("Error getting device count:", countError)
      total = devicesWithNotifications.length
    }

    const result = {
      devices: devicesWithNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      _status: "live",
    }

    console.log("Returning successful result:", {
      deviceCount: result.devices.length,
      pagination: result.pagination,
      status: result._status,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Unexpected error in devices API:", error)
    return NextResponse.json({
      devices: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      _status: "error",
      _message: error instanceof Error ? error.message : "Unexpected server error",
    })
  }
}
