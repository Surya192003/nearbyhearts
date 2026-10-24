export type LatLng = { lat: number; lng: number }

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km).toLocaleString()} km`
}

/** Local wall-clock time in the given IANA timezone, `HH:MM` (24h). */
export function formatLocalTime(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: timezone,
    }).format(d)
  } catch {
    return '—'
  }
}

function getOffsetMinutes(tz: string, at: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const parts = dtf.formatToParts(at)
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
    const asUTC = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    )
    return (asUTC - at.getTime()) / 60000
  } catch {
    return 0
  }
}

/** How many hours partner is ahead of you (positive = they are ahead). */
export function timezoneOffsetHours(
  myTz: string,
  partnerTz: string,
  at: Date = new Date(),
): number {
  return (getOffsetMinutes(partnerTz, at) - getOffsetMinutes(myTz, at)) / 60
}

export function formatHourDiff(hours: number): string {
  if (Math.abs(hours) < 1 / 60) return 'Same time'
  const sign = hours > 0 ? '+' : '−'
  const abs = Math.abs(hours)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  return m === 0 ? `${sign}${h}h` : `${sign}${h}h ${m}m`
}

export function supportedTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return [
      'UTC',
      'Europe/London',
      'Europe/Dublin',
      'Europe/Lisbon',
      'Europe/Paris',
      'Europe/Berlin',
      'America/New_York',
      'America/Chicago',
      'America/Los_Angeles',
      'America/Sao_Paulo',
      'Asia/Kolkata',
      'Asia/Dubai',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
    ]
  }
}