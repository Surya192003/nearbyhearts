import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import {
  formatDistance,
  formatHourDiff,
  formatLocalTime,
  haversineKm,
  timezoneOffsetHours,
} from '@/lib/distance'
import { useAuthStore } from '@/store/authStore'

export function DistanceCard() {
  const user = useAuthStore((s) => s.user)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!user || !user.partner) return null

  const meLocated =
    user.latitude !== null && user.longitude !== null
  const partnerLocated =
    user.partner.latitude !== null && user.partner.longitude !== null

  if (!meLocated || !partnerLocated) {
    return (
      <Card className="space-y-2">
        <p className="label">Distance & time</p>
        <p className="text-sm text-muted">
          {!meLocated
            ? 'Add your address above to calculate the distance.'
            : `${user.partner.firstName} needs to add their address to calculate the distance.`}
        </p>
      </Card>
    )
  }

  const km = haversineKm(
    { lat: user.latitude!, lng: user.longitude! },
    { lat: user.partner.latitude!, lng: user.partner.longitude! },
  )
  const myTime = formatLocalTime(now, user.timezone)
  const partnerTime = formatLocalTime(now, user.partner.timezone)
  const diff = timezoneOffsetHours(user.timezone, user.partner.timezone, now)

  return (
    <Card className="space-y-3">
      <p className="label">Distance & time</p>

      <div className="grid grid-cols-3 items-center gap-2 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
            You · {user.city || '—'}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{myTime}</p>
          <p className="text-[10px] text-muted">{user.timezone}</p>
        </div>

        <div>
          <p className="font-script text-xl text-rose">{formatDistance(km)}</p>
          <p className="text-[11px] text-muted">{formatHourDiff(diff)}</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
            {user.partner.firstName} · {user.partner.city || '—'}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{partnerTime}</p>
          <p className="text-[10px] text-muted">{user.partner.timezone}</p>
        </div>
      </div>
    </Card>
  )
}