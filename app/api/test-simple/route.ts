import { NextResponse } from "next/server"

export async function GET() {
  console.log("Simple test API called")

  try {
    return NextResponse.json({
      status: "success",
      message: "API is working",
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        devices: [
          {
            id: "test-1",
            serial_number: "TEST001",
            device_name: "Test Device 1",
            status: "active",
            last_seen: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notifications: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      },
    })
  } catch (error) {
    console.error("Error in simple test API:", error)
    return NextResponse.json(
      {
        error: "Test API failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
