import type { User } from '@/types'

export const CURRENT_USER: User = {
  id: 'usr_01',
  firstName: 'Alex',
  lastName: 'Rivera',
  email: 'alex@nearbyhearts.app',
  avatarUrl: null,
  city: 'Dublin',
  partner: {
    id: 'usr_02',
    firstName: 'Sam',
    lastName: 'Okafor',
    avatarUrl: null,
    timezone: 'Europe/Lisbon',
    city: 'Lisbon',
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
}