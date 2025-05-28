import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
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

  try {
    let device = await prisma.device.findUnique({
      where: {
        serialNumber: payload.serialNumber,
      },
    })

    if (!device) {
      device = await prisma.device.create({
        data: {
          serialNumber: payload.serialNumber,
          deviceName: payload.deviceName,
        },
      })
    }

    const notification = await prisma.deviceNotification.create({
      data: {
        deviceId: device.id,
        deviceName: payload.deviceName,
        statusMessage: payload.statusMessage,
        tailscaleURL: payload.tailscaleURL,
      },
    })

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
    console.error(e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
