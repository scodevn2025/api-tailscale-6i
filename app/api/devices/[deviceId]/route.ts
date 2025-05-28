import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { deviceId } = params

    await query("DELETE FROM devices WHERE id = $1", [deviceId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
