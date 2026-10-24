import { apiGet } from '@/lib/api'
import type { Couple } from '@/types'

export const coupleService = {
  async get(): Promise<Couple> {
    return apiGet<Couple>('/couple')
  },

  async update(patch: {
    togetherSince?: string | null
    nextVisitAt?: string | null
    distanceKm?: number | null
  }): Promise<Couple> {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/couple`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      },
    )
    if (!res.ok) throw new Error(`Update failed: ${res.status}`)
    return res.json() as Promise<Couple>
  },
}