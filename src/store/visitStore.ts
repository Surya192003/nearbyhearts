import { create } from 'zustand'
import { visitService, type Visit } from '@/services/visitService'

type State = {
  visits: Visit[]
  loading: boolean
  saving: boolean
  error: string | null
  load: () => Promise<void>
  create: (input: { title?: string; scheduledAt: string }) => Promise<void>
  requestCancel: (id: string, reason?: string) => Promise<void>
  approveCancel: (id: string) => Promise<void>
  rejectCancel: (id: string) => Promise<void>
  withdrawCancel: (id: string) => Promise<void>
}

export const useVisitStore = create<State>((set) => ({
  visits: [],
  loading: false,
  saving: false,
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
    set({ saving: true, error: null })
    try {
      const v = await visitService.create(input)
      set((s) => ({
        visits: [...s.visits, v].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
        saving: false,
      }))
    } catch (err) {
      set({ saving: false, error: err instanceof Error ? err.message : 'Create failed' })
    }
  },

  async requestCancel(id, reason) {
    const v = await visitService.requestCancel(id, reason)
    set((s) => ({ visits: s.visits.map((x) => (x.id === id ? v : x)) }))
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