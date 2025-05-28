import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
