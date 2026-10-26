import { create } from 'zustand'
import { coupleService } from '@/services/coupleService'

type State = {
  nextVisitIso: string | null
  distanceKm: number | null
  togetherSince: string | null
  loading: boolean
  saving: boolean
  load: () => Promise<void>
  save: (patch: {
    nextVisitAt?: string | null
    distanceKm?: number | null
    togetherSince?: string | null
  }) => Promise<void>
}

export const useCountdownStore = create<State>((set) => ({
  nextVisitIso: null,
  distanceKm: null,
  togetherSince: null,
  loading: false,
  saving: false,

  async load() {
    set({ loading: true })
    try {
      const c = await coupleService.get()
      set({
        nextVisitIso: c.nextVisitAt,
        distanceKm: c.distanceKm,
        togetherSince: c.togetherSince,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  async save(patch) {
    set({ saving: true })
    try {
      const c = await coupleService.update(patch)
      set({
        nextVisitIso: c.nextVisitAt,
        distanceKm: c.distanceKm,
        togetherSince: c.togetherSince,
        saving: false,
      })
    } catch (err) {
      set({ saving: false })
      throw err
    }
  },
}))