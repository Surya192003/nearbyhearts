import { apiGet, apiPost } from '@/lib/api'
import type { Gift, SentGift } from '@/types'

export const giftService = {
  async catalog(): Promise<Gift[]> {
    return apiGet<Gift[]>('/gifts')
  },

  async listSent(): Promise<SentGift[]> {
    return apiGet<SentGift[]>('/gifts/sent')
  },

  async send(input: {
    giftId: string
    fromUserId: string
    toUserId: string
    note: string
  }): Promise<SentGift> {
    return apiPost<SentGift>('/gifts/send', {
      giftId: input.giftId,
      note: input.note,
    })
  },
}