import { Pool } from "pg"

let pool: Pool | null = null
const MAX_RETRIES = 3

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Tăng timeout
    })

    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err)
    })
  }
  return pool
}

export async function query(text: string, params?: any[], retries = 0) {
  const pool = getPool()
  const client = await pool.connect().catch((err) => {
    console.error("Failed to get client from pool:", err)
    throw err
  })

  try {
    const result = await client.query(text, params)
    return result
  } catch (error) {
    console.error(`Database query error (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error)
    console.error("Query:", text)
    console.error("Params:", params)

    // Retry logic
    if (retries < MAX_RETRIES) {
      console.log(`Retrying query (attempt ${retries + 2}/${MAX_RETRIES + 1})...`)
      return query(text, params, retries + 1)
    }

    throw error
  } finally {
    client.release()
  }
}

export async function getClient() {
  const pool = getPool()
  return await pool.connect()
}

// Test connection function
export async function testConnection() {
  try {
    const result = await query("SELECT NOW() as current_time")
    console.log("Database connected successfully at:", result.rows[0].current_time)
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}
