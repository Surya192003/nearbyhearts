
import { AddressCard } from '@/components/pair/AddressCard'
import { DistanceCard } from '@/components/pair/DistanceCard'
import { VisitsCard } from '@/components/pair/VisitsCard'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>

        <p className="text-sm text-muted">
          Set your address so we can show your distance and clocks.
          Add upcoming visits to start a countdown.
        </p>
      </div>

      <AddressCard />

      <DistanceCard />

      <VisitsCard />
    </div>
  )
}
