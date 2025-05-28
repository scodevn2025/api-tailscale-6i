const { Pool } = require("pg")

const pool = new Pool({
  connectionString: "postgresql://postgres:postgres@159.69.15.251:54322/postgres",
  ssl: false,
})

async function testConnection() {
  try {
    const client = await pool.connect()
    console.log("✅ Database connection successful!")

    // Test query
    const result = await client.query("SELECT NOW() as current_time")
    console.log("Current time:", result.rows[0].current_time)

    client.release()
    await pool.end()
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
  }
}

testConnection()
