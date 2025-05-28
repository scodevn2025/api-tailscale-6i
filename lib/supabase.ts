import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client (sử dụng anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (sử dụng service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          serial_number: string
          device_name: string
          last_seen: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          serial_number: string
          device_name: string
          last_seen?: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          serial_number?: string
          device_name?: string
          last_seen?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      device_notifications: {
        Row: {
          id: string
          device_id: string
          status_message: string
          tailscale_url: string | null
          original_log_message: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          device_id: string
          status_message: string
          tailscale_url?: string | null
          original_log_message?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          device_id?: string
          status_message?: string
          tailscale_url?: string | null
          original_log_message?: string | null
          timestamp?: string
        }
      }
    }
  }
}
