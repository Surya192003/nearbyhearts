import { apiGet, apiPatch, apiPost } from '@/lib/api'
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
    return apiPatch<Couple>('/couple', patch)
  },
  async createInvite(): Promise<InviteCode> {
    return apiPost<InviteCode>('/couple/invite', {})
  },
  async joinWithCode(code: string): Promise<Partner> {
    const { partner } = await apiPost<{ partner: Partner }>('/couple/join', { code })
    return partner
  },
}