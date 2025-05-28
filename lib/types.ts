export interface Device {
  id: string
  serial_number: string
  device_name: string
  last_seen: string
  status: "active" | "auth_required" | "offline"
  created_at: string
  updated_at: string
}

export interface DeviceNotification {
  id: string
  device_id: string
  status_message: string
  tailscale_url?: string | null
  original_log_message?: string | null
  timestamp: string
}

export interface DeviceWithNotifications extends Device {
  notifications: DeviceNotification[]
}

export interface DeviceStats {
  total: number
  active: number
  authRequired: number
  offline: number
}

export interface NotificationPayload {
  serialNumber: string
  deviceName: string
  statusMessage: string
  tailscaleURL?: string
  originalLogMessage?: string
}
