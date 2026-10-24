import { create } from 'zustand'
import { giftService } from '@/services/giftService'
import type { Gift, SentGift } from '@/types'

type State = {
  catalog: Gift[]
  sent: SentGift[]
  loading: boolean
  sending: boolean
  load: () => Promise<void>
  send: (input: {
    giftId: string
    fromUserId: string
    toUserId: string
    note: string
  }) => Promise<void>
}

export const useGiftStore = create<State>((set) => ({
  catalog: [],
  sent: [],
  loading: false,
  sending: false,

  async load() {
    set({ loading: true })
    const [catalog, sent] = await Promise.all([
      giftService.catalog(),
      giftService.listSent(),
    ])
    set({ catalog, sent, loading: false })
  },

  async send(input) {
    set({ sending: true })
    const created = await giftService.send(input)
    set((s) => ({ sent: [created, ...s.sent], sending: false }))
  },
}))