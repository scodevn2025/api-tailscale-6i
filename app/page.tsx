import { DatabaseStatus } from "@/components/DatabaseStatus"
import { DeviceList } from "@/components/DeviceList"
import { DeviceStats } from "@/components/DeviceStats"
import { ApiTester } from "@/components/ApiTester"
import { PerformanceMetrics } from "@/components/PerformanceMetrics"
import { UserPreferences } from "@/components/UserPreferences"
import { NotificationCenter } from "@/components/NotificationCenter"

export default function Home() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tailscale Device Monitor</h1>
        <DatabaseStatus />
      </div>

      <DeviceStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <NotificationCenter />
        <PerformanceMetrics />
      </div>

      <DeviceList />

      <UserPreferences />

      {/* API Tester - chỉ hiển thị trong development */}
      {process.env.NODE_ENV === "development" && <ApiTester />}
    </div>
  )
}
