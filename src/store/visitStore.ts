import { create } from 'zustand'
import { visitService } from '@/services/visitService'
import type { Visit } from '@/types'

type State = {
  visits: Visit[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  create: (input: { title?: string; scheduledAt: string }) => Promise<Visit>
  requestCancel: (id: string, reason?: string) => Promise<void>
  approveCancel: (id: string) => Promise<void>
  rejectCancel: (id: string) => Promise<void>
  withdrawCancel: (id: string) => Promise<void>
}

export const useVisitStore = create<State>((set, get) => ({
  visits: [],
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const visits = await visitService.list()
      set({ visits, loading: false })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Could not load visits',
      })
    }
  },

  async create(input) {
    const v = await visitService.create(input)
    set((s) => ({ visits: [...s.visits, v].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)) }))
    return v
  },

  async requestCancel(id, reason) {
    const v = await visitService.requestCancel(id, reason)
    set((s) => ({ visits: s.visits.map((x) => (x.id === id ? v : x)) }))
    void get()
  },

  async approveCancel(id) {
    const v = await visitService.approveCancel(id)
    set((s) => ({ visits: s.visits.map((x) => (x.id === id ? v : x)) }))
  },

  async rejectCancel(id) {
    const v = await visitService.rejectCancel(id)
    set((s) => ({ visits: s.visits.map((x) => (x.id === id ? v : x)) }))
  },

  async withdrawCancel(id) {
    const v = await visitService.withdrawCancel(id)
    set((s) => ({ visits: s.visits.map((x) => (x.id === id ? v : x)) }))
  },
}))