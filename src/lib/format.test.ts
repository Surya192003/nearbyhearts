import { describe, expect, it } from 'vitest'
import { formatCountdown, formatDistance, initials, timeAgo } from './format'

describe('initials', () => {
  it('takes first two words', () => expect(initials('Alex Rivera')).toBe('AR'))
  it('handles a single word', () => expect(initials('Sam')).toBe('S'))
  it('trims whitespace', () => expect(initials('  alex  rivera  ')).toBe('AR'))
})

describe('timeAgo', () => {
  const now = new Date('2026-01-01T12:00:00Z').getTime()
  it('just now', () => expect(timeAgo('2026-01-01T11:59:30Z', now)).toBe('just now'))
  it('minutes', () => expect(timeAgo('2026-01-01T11:45:00Z', now)).toBe('15m ago'))
  it('hours', () => expect(timeAgo('2026-01-01T09:00:00Z', now)).toBe('3h ago'))
  it('days', () => expect(timeAgo('2025-12-30T12:00:00Z', now)).toBe('2d ago'))
})

describe('formatCountdown', () => {
  const now = new Date('2026-01-01T00:00:00Z').getTime()
  it('breaks down a future target', () => {
    const c = formatCountdown('2026-01-03T05:06:07Z', now)
    expect(c).toEqual({ done: false, days: 2, hours: 5, minutes: 6, seconds: 7 })
  })
  it('marks past targets done', () => {
    expect(formatCountdown('2025-12-31T00:00:00Z', now).done).toBe(true)
  })
})

describe('formatDistance', () => {
  it('metres under 1 km', () => expect(formatDistance(0.42)).toBe('420 m'))
  it('km otherwise', () => expect(formatDistance(1234)).toBe('1,234 km'))
})