const { Pool } = require("pg")

const pool = new Pool({
  connectionString: "postgresql://postgres:postgres@159.69.15.251:54322/postgres",
  ssl: false,
})

async function setupDatabase() {
  const client = await pool.connect()

  try {
    console.log("🔍 Testing database connection...")

    // Test connection
    const timeResult = await client.query("SELECT NOW() as current_time")
    console.log("✅ Database connected at:", timeResult.rows[0].current_time)

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('devices', 'device_notifications')
    `)

    const existingTables = tablesResult.rows.map((row) => row.table_name)
    console.log("📋 Existing tables:", existingTables)

    if (!existingTables.includes("devices")) {
      console.log("🔨 Creating devices table...")
      await client.query(`
        CREATE TABLE devices (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          serial_number TEXT UNIQUE NOT NULL,
          device_name TEXT NOT NULL,
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT NOT NULL CHECK (status IN ('active', 'auth_required', 'offline')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log("✅ Devices table created")
    }

    if (!existingTables.includes("device_notifications")) {
      console.log("🔨 Creating device_notifications table...")
      await client.query(`
        CREATE TABLE device_notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
          status_message TEXT NOT NULL,
          tailscale_url TEXT,
          original_log_message TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log("✅ Device notifications table created")
    }

    // Create indexes
    console.log("🔨 Creating indexes...")
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
      CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
      CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen DESC);
      CREATE INDEX IF NOT EXISTS idx_device_notifications_device_id ON device_notifications(device_id);
      CREATE INDEX IF NOT EXISTS idx_device_notifications_timestamp ON device_notifications(timestamp DESC);
    `)
    console.log("✅ Indexes created")

    // Insert sample data
    console.log("🧪 Inserting sample data...")
    await client.query(`
      INSERT INTO devices (serial_number, device_name, status) 
      VALUES 
        ('SAMPLE001', 'Sample Device 1', 'active'),
        ('SAMPLE002', 'Sample Device 2', 'auth_required'),
        ('SAMPLE003', 'Sample Device 3', 'offline')
      ON CONFLICT (serial_number) DO UPDATE SET
        device_name = EXCLUDED.device_name,
        status = EXCLUDED.status,
        last_seen = NOW()
    `)

    // Get device IDs for notifications
    const devicesResult = await client.query("SELECT id, serial_number FROM devices WHERE serial_number LIKE 'SAMPLE%'")

    for (const device of devicesResult.rows) {
      await client.query(
        `
        INSERT INTO device_notifications (device_id, status_message, tailscale_url) 
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `,
        [device.id, device.serial_number.includes("002") ? "auth_required" : "active", "https://login.tailscale.com/"],
      )
    }

    const testResult = await client.query("SELECT COUNT(*) as count FROM devices")
    console.log("📊 Total devices:", testResult.rows[0].count)

    const notificationResult = await client.query("SELECT COUNT(*) as count FROM device_notifications")
    console.log("📊 Total notifications:", notificationResult.rows[0].count)

    console.log("🎉 Database setup completed successfully!")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
  } finally {
    client.release()
    await pool.end()
  }
}

setupDatabase()
