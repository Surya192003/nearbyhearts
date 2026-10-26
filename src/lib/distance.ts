export { formatDistance } from './format'

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function getTimezoneOffsetHours(timezone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  })
  const parts = dtf.formatToParts(at)
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10)
  const asUTC = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return (asUTC - at.getTime()) / 3_600_000
}

/** tz2 minus tz1, in hours. Positive = partner's clock is ahead. */
export function timezoneOffsetHours(
  tz1: string,
  tz2: string,
  at: Date = new Date(),
): number {
  return getTimezoneOffsetHours(tz2, at) - getTimezoneOffsetHours(tz1, at)
}

export function formatLocalTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(date)
}

export function formatHourDiff(hours: number): string {
  if (Math.abs(hours) < 0.01) return 'Same time'
  const abs = Math.abs(hours)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  const str = m === 0 ? `${h}h` : `${h}h ${m}m`
  return hours > 0 ? `+${str}` : `−${str}`
}

export function supportedTimezones(): string[] {
  const anyIntl = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[]
  }
  if (typeof anyIntl.supportedValuesOf === 'function') {
    try {
      return anyIntl.supportedValuesOf('timeZone')
    } catch {
      // fall through
    }
  }
  return [
    'UTC',
    'Europe/Dublin',
    'Europe/London',
    'Europe/Lisbon',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'America/Mexico_City',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
  ]
}