export interface Device {
  id: string
  serial_number: string
  device_name: string
  status: "active" | "auth_required" | "offline"

  // Hardware info
  cpuid?: string
  device_id?: string
  mac_address?: string

  // Video device info
  video_device_name?: string
  video_device_secret?: string
  video_product_key?: string

  // Tailscale info
  tailscale_url?: string

  // Timestamps
  last_seen: string
  created_at: string
  updated_at: string

  // Computed fields
  hasVideoInfo?: boolean
  hasHardwareInfo?: boolean
  needsAuth?: boolean
}

export interface DeviceNotification {
  id: string
  device_id: string
  serial_number: string
  device_name: string
  status_message: string

  // Hardware info snapshot
  cpuid?: string
  device_id_value?: string
  mac_address?: string

  // Video device info snapshot
  video_device_name?: string
  video_device_secret?: string
  video_product_key?: string

  // Tailscale info
  tailscale_url?: string
  original_log_message?: string

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
  cpuid?: string
  deviceId?: string
  macAddress?: string
  videoDeviceName?: string
  videoDeviceSecret?: string
  videoProductKey?: string
  tailscaleURL?: string
  originalLogMessage?: string
}
