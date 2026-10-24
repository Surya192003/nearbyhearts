export const DAILY_FREE_LIMIT = 3
export const BONUS_PER_DONATION = 10
export const MIN_DONATION_CENTS = 1000

const KEY = 'nearbyhearts.photobooth.quota'

type QuotaRecord = {
  date: string
  freeUsedToday: number
  bonusPool: number
}

export type QuotaInfo = {
  remaining: number
  freeRemaining: number
  bonusPool: number
  freeUsedToday: number
  dailyLimit: number
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function read(): QuotaRecord {
  const t = today()
  const raw = localStorage.getItem(KEY)
  if (!raw) return { date: t, freeUsedToday: 0, bonusPool: 0 }
  try {
    const parsed = JSON.parse(raw) as QuotaRecord
    if (parsed.date !== t) {
      return { date: t, freeUsedToday: 0, bonusPool: parsed.bonusPool }
    }
    return parsed
  } catch {
    return { date: t, freeUsedToday: 0, bonusPool: 0 }
  }
}

function write(q: QuotaRecord): void {
  localStorage.setItem(KEY, JSON.stringify(q))
}

export function getQuota(): QuotaInfo {
  const q = read()
  const freeRemaining = Math.max(0, DAILY_FREE_LIMIT - q.freeUsedToday)
  return {
    remaining: freeRemaining + q.bonusPool,
    freeRemaining,
    bonusPool: q.bonusPool,
    freeUsedToday: q.freeUsedToday,
    dailyLimit: DAILY_FREE_LIMIT,
  }
}

/** All-or-nothing. Returns true on success. */
export function consumePhotos(n: number): boolean {
  if (n <= 0) return true
  const q = read()
  const freeRemaining = Math.max(0, DAILY_FREE_LIMIT - q.freeUsedToday)
  let remaining = n
  let freeUsed = q.freeUsedToday
  let bonus = q.bonusPool

  const useFree = Math.min(remaining, freeRemaining)
  freeUsed += useFree
  remaining -= useFree

  if (remaining > bonus) return false
  bonus -= remaining

  write({ ...q, freeUsedToday: freeUsed, bonusPool: bonus })
  return true
}

export function grantBonusPhotos(n = BONUS_PER_DONATION): void {
  if (n <= 0) return
  const q = read()
  write({ ...q, bonusPool: q.bonusPool + n })
}