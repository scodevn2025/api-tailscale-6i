"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save } from "lucide-react"

interface Preferences {
  refreshInterval: number
  enableNotifications: boolean
  enableSounds: boolean
  theme: string
  autoRefresh: boolean
  showOfflineDevices: boolean
  notificationTypes: string[]
}

export function UserPreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/preferences")
      const data = await response.json()
      setPreferences(data)
    } catch (err) {
      console.error("Failed to fetch preferences:", err)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      const data = await response.json()
      if (data.success) {
        setMessage("Preferences saved successfully!")
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (err) {
      setMessage("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading preferences...</div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>User Preferences</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <div
            className={`px-3 py-2 rounded text-sm ${
              message.includes("Error")
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="refresh-interval">Refresh Interval</Label>
              <Select
                value={preferences.refreshInterval.toString()}
                onValueChange={(value) => setPreferences({ ...preferences, refreshInterval: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="10000">10 seconds</SelectItem>
                  <SelectItem value="30000">30 seconds</SelectItem>
                  <SelectItem value="60000">1 minute</SelectItem>
                  <SelectItem value="300000">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={preferences.autoRefresh}
                onCheckedChange={(checked) => setPreferences({ ...preferences, autoRefresh: checked })}
              />
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-notifications"
                checked={preferences.enableNotifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, enableNotifications: checked })}
              />
              <Label htmlFor="enable-notifications">Enable Notifications</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-sounds"
                checked={preferences.enableSounds}
                onCheckedChange={(checked) => setPreferences({ ...preferences, enableSounds: checked })}
              />
              <Label htmlFor="enable-sounds">Enable Sounds</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-offline"
                checked={preferences.showOfflineDevices}
                onCheckedChange={(checked) => setPreferences({ ...preferences, showOfflineDevices: checked })}
              />
              <Label htmlFor="show-offline">Show Offline Devices</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={savePreferences} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
