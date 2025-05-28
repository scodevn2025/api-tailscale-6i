import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Database performance metrics
    const dbMetrics = await query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(CASE WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 1 END) as recent_devices,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_devices,
        COUNT(CASE WHEN status = 'auth_required' THEN 1 END) as auth_required_devices,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_devices,
        AVG(EXTRACT(EPOCH FROM (NOW() - last_seen))) as avg_last_seen_seconds
      FROM devices
    `)

    // Notification metrics
    const notificationMetrics = await query(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_notifications,
        COUNT(CASE WHEN status_message = 'auth_required' THEN 1 END) as auth_notifications
      FROM device_notifications
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `)

    // System metrics
    const systemMetrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    }

    return NextResponse.json({
      database: dbMetrics.rows[0],
      notifications: notificationMetrics.rows[0],
      system: systemMetrics,
      _status: "live",
    })
  } catch (error) {
    console.error("Error fetching metrics:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        _status: "error",
      },
      { status: 500 },
    )
  }
}
