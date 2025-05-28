import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Kiểm tra kết nối database trước
    try {
      await query("SELECT 1")
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      // Trả về dữ liệu mặc định nếu không kết nối được database
      return NextResponse.json({
        total: 0,
        active: 0,
        authRequired: 0,
        offline: 0,
        _status: "fallback",
      })
    }

    // Đơn giản hóa query để giảm khả năng lỗi
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'auth_required' THEN 1 END) as auth_required,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline
      FROM devices
    `

    const result = await query(statsQuery)
    const stats = result.rows[0]

    return NextResponse.json({
      total: Number.parseInt(stats.total) || 0,
      active: Number.parseInt(stats.active) || 0,
      authRequired: Number.parseInt(stats.auth_required) || 0,
      offline: Number.parseInt(stats.offline) || 0,
      _status: "live",
    })
  } catch (error) {
    console.error("Error fetching device stats:", error)

    // Trả về dữ liệu mặc định khi có lỗi
    return NextResponse.json(
      {
        total: 0,
        active: 0,
        authRequired: 0,
        offline: 0,
        _status: "error",
        _error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    ) // Trả về status 200 với dữ liệu fallback
  }
}
