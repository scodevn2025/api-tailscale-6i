import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Trả về dữ liệu mẫu đơn giản
    const sampleDevices = [
      {
        id: "1",
        serial_number: "TEST001",
        device_name: "Test Device 1",
        status: "active",
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notifications: [],
      },
      {
        id: "2",
        serial_number: "TEST002",
        device_name: "Test Device 2",
        status: "auth_required",
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notifications: [
          {
            id: "1",
            device_id: "2",
            status_message: "auth_required",
            tailscale_url: "https://login.tailscale.com/",
            original_log_message: null,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    ]

    return NextResponse.json({
      devices: sampleDevices,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      },
      _status: "sample",
    })
  } catch (error) {
    console.error("Error in simple devices API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
