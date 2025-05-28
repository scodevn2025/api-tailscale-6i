import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
    },
    tests: {} as any,
  }

  try {
    // Test 1: Basic connection
    console.log("Testing basic connection...")
    const timeResult = await query("SELECT NOW() as current_time")
    debug.tests.basicConnection = {
      success: true,
      time: timeResult.rows[0].current_time,
    }
  } catch (error) {
    debug.tests.basicConnection = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  try {
    // Test 2: Check tables
    console.log("Checking tables...")
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('devices', 'device_notifications')
    `)
    debug.tests.tables = {
      success: true,
      tables: tablesResult.rows.map((row) => row.table_name),
    }
  } catch (error) {
    debug.tests.tables = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  try {
    // Test 3: Count devices
    console.log("Counting devices...")
    const countResult = await query("SELECT COUNT(*) as count FROM devices")
    debug.tests.deviceCount = {
      success: true,
      count: countResult.rows[0].count,
    }
  } catch (error) {
    debug.tests.deviceCount = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  return NextResponse.json(debug)
}
