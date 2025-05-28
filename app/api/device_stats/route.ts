import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get total count
    const { count: total } = await supabase.from("devices").select("*", { count: "exact", head: true })

    // Get counts by status
    const { data: statusCounts } = await supabase.from("devices").select("status")

    const active = statusCounts?.filter((d) => d.status === "active").length || 0
    const authRequired = statusCounts?.filter((d) => d.status === "auth_required").length || 0
    const offline = statusCounts?.filter((d) => d.status === "offline").length || 0

    return NextResponse.json({
      total: total || 0,
      active,
      authRequired,
      offline,
    })
  } catch (error) {
    console.error("Error fetching device stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
