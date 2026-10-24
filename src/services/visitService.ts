import { apiGet, apiPost } from '@/lib/api'
import type { Visit } from '@/types'

export const visitService = {
  async list(): Promise<Visit[]> {
    return apiGet<Visit[]>('/visits')
  },

  async create(input: { title?: string; scheduledAt: string }): Promise<Visit> {
    return apiPost<Visit>('/visits', input)
  },

  async requestCancel(id: string, reason?: string): Promise<Visit> {
    return apiPost<Visit>(`/visits/${id}/cancel-request`, { reason })
  },

  async approveCancel(id: string): Promise<Visit> {
    return apiPost<Visit>(`/visits/${id}/cancel-approve`, {})
  },

  async rejectCancel(id: string): Promise<Visit> {
    return apiPost<Visit>(`/visits/${id}/cancel-reject`, {})
  },

  async withdrawCancel(id: string): Promise<Visit> {
    return apiPost<Visit>(`/visits/${id}/cancel-withdraw`, {})
  },
}