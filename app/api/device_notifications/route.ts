import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { NotificationPayload } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload: NotificationPayload = await request.json()

    // Validate required fields
    if (!payload.serialNumber || !payload.deviceName || !payload.statusMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find existing device
    const { data: existingDevice } = await supabase
      .from("devices")
      .select("*")
      .eq("serial_number", payload.serialNumber)
      .single()

    let device
    if (!existingDevice) {
      // Create new device
      const { data: newDevice, error: createError } = await supabase
        .from("devices")
        .insert({
          serial_number: payload.serialNumber,
          device_name: payload.deviceName,
          status: payload.statusMessage,
          last_seen: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating device:", createError)
        return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
      }
      device = newDevice
    } else {
      // Update existing device
      const { data: updatedDevice, error: updateError } = await supabase
        .from("devices")
        .update({
          device_name: payload.deviceName,
          status: payload.statusMessage,
          last_seen: new Date().toISOString(),
        })
        .eq("id", existingDevice.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating device:", updateError)
        return NextResponse.json({ error: "Failed to update device" }, { status: 500 })
      }
      device = updatedDevice
    }

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from("device_notifications")
      .insert({
        device_id: device.id,
        status_message: payload.statusMessage,
        tailscale_url: payload.tailscaleURL,
        original_log_message: payload.originalLogMessage,
      })
      .select()
      .single()

    if (notificationError) {
      console.error("Error creating notification:", notificationError)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      notificationId: notification.id,
    })
  } catch (error) {
    console.error("Error processing device notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
