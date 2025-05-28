import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Verify API key
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()

    // Validate required fields with better error messages
    const requiredFields = ["serialNumber", "deviceName", "statusMessage"]
    const missingFields = requiredFields.filter((field) => !payload[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields,
          received: Object.keys(payload),
        },
        { status: 400 },
      )
    }

    // Validate status message values
    const validStatuses = ["active", "auth_required", "offline"]
    if (!validStatuses.includes(payload.statusMessage)) {
      return NextResponse.json(
        {
          error: "Invalid status message",
          received: payload.statusMessage,
          validValues: validStatuses,
        },
        { status: 400 },
      )
    }

    // Find existing device
    const existingDeviceResult = await query("SELECT * FROM devices WHERE serial_number = $1", [payload.serialNumber])

    let device
    if (existingDeviceResult.rows.length === 0) {
      // Create new device
      const createResult = await query(
        `INSERT INTO devices (serial_number, device_name, status, last_seen) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING *`,
        [payload.serialNumber, payload.deviceName, payload.statusMessage],
      )
      device = createResult.rows[0]
    } else {
      // Update existing device
      const updateResult = await query(
        `UPDATE devices 
         SET device_name = $1, status = $2, last_seen = NOW(), updated_at = NOW()
         WHERE serial_number = $3 
         RETURNING *`,
        [payload.deviceName, payload.statusMessage, payload.serialNumber],
      )
      device = updateResult.rows[0]
    }

    // Create notification record
    const notificationResult = await query(
      `INSERT INTO device_notifications (device_id, device_name, status_message, tailscale_url, original_log_message) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [device.id, payload.deviceName, payload.statusMessage, payload.tailscaleURL, payload.originalLogMessage],
    )

    const notification = notificationResult.rows[0]

    console.log(`[${new Date().toISOString()}] Device notification received:`, {
      serialNumber: payload.serialNumber,
      deviceName: payload.deviceName,
      statusMessage: payload.statusMessage,
      hasAuthUrl: !!payload.tailscaleURL,
    })

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      notificationId: notification.id,
      message: `Device ${payload.deviceName} status updated to ${payload.statusMessage}`,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error("Error processing device notification:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
