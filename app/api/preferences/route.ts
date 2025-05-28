import { NextResponse } from "next/server"

// In-memory storage for demo (in production, use database)
let preferences = {
  refreshInterval: 30000,
  enableNotifications: true,
  enableSounds: false,
  theme: "light",
  autoRefresh: true,
  showOfflineDevices: true,
  notificationTypes: ["auth_required", "offline"],
}

export async function GET() {
  return NextResponse.json(preferences)
}

export async function POST(request: Request) {
  try {
    const newPreferences = await request.json()

    // Validate preferences
    if (newPreferences.refreshInterval && newPreferences.refreshInterval < 5000) {
      return NextResponse.json(
        {
          error: "Refresh interval must be at least 5 seconds",
        },
        { status: 400 },
      )
    }

    preferences = { ...preferences, ...newPreferences }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid preferences data",
      },
      { status: 400 },
    )
  }
}
