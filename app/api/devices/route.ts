import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("devices")
      .select(`
        *,
        notifications:device_notifications(*)
      `)
      .order("last_seen", { ascending: false })

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`device_name.ilike.%${search}%,serial_number.ilike.%${search}%`)
    }

    // Get paginated results
    const { data: devices, error, count } = await query.range(from, to).limit(limit)

    if (error) {
      console.error("Error fetching devices:", error)
      return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase.from("devices").select("*", { count: "exact", head: true })

    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status)
    }

    if (search) {
      countQuery = countQuery.or(`device_name.ilike.%${search}%,serial_number.ilike.%${search}%`)
    }

    const { count: total } = await countQuery

    // Sort notifications by timestamp for each device
    const devicesWithSortedNotifications = devices?.map((device) => ({
      ...device,
      notifications:
        device.notifications
          ?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 1) || [],
    }))

    return NextResponse.json({
      devices: devicesWithSortedNotifications,
      pagination: {
        page,
        limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
