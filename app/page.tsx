import { DeviceStats } from "@/components/DeviceStats"
import { DeviceList } from "@/components/DeviceList"
import { DatabaseStatus } from "@/components/DatabaseStatus"
import { ApiTester } from "@/components/ApiTester"

export default function Dashboard() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tailscale Device Monitor</h1>
        <DatabaseStatus />
      </div>

      <DeviceStats />
      <DeviceList />

      {/* API Tester - chỉ hiển thị trong development */}
      {process.env.NODE_ENV === "development" && <ApiTester />}
    </div>
  )
}
