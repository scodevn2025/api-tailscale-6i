import { DeviceStats } from "@/components/DeviceStats"
import { DeviceList } from "@/components/DeviceList"

export default function Dashboard() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tailscale Device Monitor</h1>
      </div>

      <DeviceStats />
      <DeviceList />
    </div>
  )
}
