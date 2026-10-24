import { apiGet } from '@/lib/api'
import type { Couple, InviteCode, Partner } from '@/types'

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

  /** NEW — generate a 6-char code, valid 7 days. Reuses an active code if one exists. */
  async createInvite(): Promise<InviteCode> {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/couple/invite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      },
    )
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err.error ?? `Could not create invite: ${res.status}`)
    }
    return res.json() as Promise<InviteCode>
  },

  /** NEW — join the creator's couple. Returns the new partner. */
  async joinWithCode(code: string): Promise<Partner> {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/couple/join`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      },
    )
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err.error ?? `Could not join: ${res.status}`)
    }
    const body = (await res.json()) as { partner: Partner }
    return body.partner
  },
}