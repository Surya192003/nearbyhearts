import { create } from 'zustand'
import { NEXT_VISIT_ISO } from '@/data/partner'

type State = {
  nextVisitIso: string
  setNextVisit: (iso: string) => void
}

export const useCountdownStore = create<State>((set) => ({
  nextVisitIso: NEXT_VISIT_ISO,
  setNextVisit: (nextVisitIso) => set({ nextVisitIso }),
}))