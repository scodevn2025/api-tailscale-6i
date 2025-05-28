import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface DeviceNotificationPayload {
  serialNumber: string
  deviceName: string
  statusMessage: string
  cpuid?: string
  deviceId?: string
  macAddress?: string
  videoDeviceName?: string
  videoDeviceSecret?: string
  videoProductKey?: string
  tailscaleURL?: string
  originalLogMessage?: string
}

export async function POST(request: Request) {
  try {
    // Verify API key
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      console.log("Unauthorized access attempt with key:", apiKey?.substring(0, 10) + "...")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload: DeviceNotificationPayload = await request.json()
    console.log("Received payload:", {
      serialNumber: payload.serialNumber,
      deviceName: payload.deviceName,
      statusMessage: payload.statusMessage,
      hasAuthUrl: !!payload.tailscaleURL,
      hasCpuid: !!payload.cpuid,
      hasVideoInfo: !!payload.videoDeviceName,
    })

    // Validate required fields
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
      // Create new device with all fields
      const createResult = await query(
        `INSERT INTO devices (
          serial_number, device_name, status, cpuid, device_id, mac_address,
          video_device_name, video_device_secret, video_product_key, 
          tailscale_url, last_seen
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
        RETURNING *`,
        [
          payload.serialNumber,
          payload.deviceName,
          payload.statusMessage,
          payload.cpuid || null,
          payload.deviceId || null,
          payload.macAddress || null,
          payload.videoDeviceName || null,
          payload.videoDeviceSecret || null,
          payload.videoProductKey || null,
          payload.tailscaleURL || null,
        ],
      )
      device = createResult.rows[0]
      console.log("Created new device:", device.id)
    } else {
      // Update existing device with all fields
      const updateResult = await query(
        `UPDATE devices SET 
          device_name = $1, 
          status = $2, 
          cpuid = $3,
          device_id = $4,
          mac_address = $5,
          video_device_name = $6,
          video_device_secret = $7,
          video_product_key = $8,
          tailscale_url = $9,
          last_seen = NOW(), 
          updated_at = NOW()
        WHERE serial_number = $10 
        RETURNING *`,
        [
          payload.deviceName,
          payload.statusMessage,
          payload.cpuid || null,
          payload.deviceId || null,
          payload.macAddress || null,
          payload.videoDeviceName || null,
          payload.videoDeviceSecret || null,
          payload.videoProductKey || null,
          payload.tailscaleURL || null,
          payload.serialNumber,
        ],
      )
      device = updateResult.rows[0]
      console.log("Updated existing device:", device.id)
    }

    // Create notification record with all fields
    const notificationResult = await query(
      `INSERT INTO device_notifications (
        device_id, serial_number, device_name, status_message, 
        cpuid, device_id_value, mac_address,
        video_device_name, video_device_secret, video_product_key,
        tailscale_url, original_log_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        device.id,
        payload.serialNumber,
        payload.deviceName,
        payload.statusMessage,
        payload.cpuid || null,
        payload.deviceId || null,
        payload.macAddress || null,
        payload.videoDeviceName || null,
        payload.videoDeviceSecret || null,
        payload.videoProductKey || null,
        payload.tailscaleURL || null,
        payload.originalLogMessage || null,
      ],
    )

    const notification = notificationResult.rows[0]

    console.log(`[${new Date().toISOString()}] Device notification processed:`, {
      deviceId: device.id,
      notificationId: notification.id,
      serialNumber: payload.serialNumber,
      deviceName: payload.deviceName,
      statusMessage: payload.statusMessage,
      hasAuthUrl: !!payload.tailscaleURL,
    })

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      notificationId: notification.id,
      message: `Device ${payload.deviceName} (${payload.serialNumber}) status updated to ${payload.statusMessage}`,
      timestamp: new Date().toISOString(),
      data: {
        serialNumber: payload.serialNumber,
        deviceName: payload.deviceName,
        status: payload.statusMessage,
        hasVideoInfo: !!(payload.videoDeviceName || payload.videoDeviceSecret || payload.videoProductKey),
        hasHardwareInfo: !!(payload.cpuid || payload.deviceId || payload.macAddress),
        tailscaleAuthRequired: payload.statusMessage === "auth_required" && !!payload.tailscaleURL,
      },
    })
  } catch (error) {
    console.error("Error processing device notification:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
