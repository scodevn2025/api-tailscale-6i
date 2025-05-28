import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { deviceId } = params

    const { error } = await supabase.from("devices").delete().eq("id", deviceId)

    if (error) {
      console.error("Error deleting device:", error)
      return NextResponse.json({ error: "Failed to delete device" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
