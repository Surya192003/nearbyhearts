// import { create } from 'zustand'
// import { pairService } from '@/services/pairService'
// import type { PairStatus } from '@/types'

// type State = {
//   status: PairStatus | null
//   loading: boolean
//   error: string | null
//   load: () => Promise<void>
//   sendRequest: (code: string, message?: string) => Promise<void>
//   accept: (id: string) => Promise<void>
//   reject: (id: string) => Promise<void>
//   cancel: (id: string) => Promise<void>
// }

// const EMPTY: PairStatus = { incoming: [], outgoing: [] }

// export const usePairStore = create<State>((set, get) => ({
//   status: null,
//   loading: false,
//   error: null,

//   async load() {
//     set({ loading: true, error: null })
//     try {
//       const status = await pairService.status()
//       set({ status, loading: false })
//     } catch (err) {
//       set({
//         status: EMPTY,
//         loading: false,
//         error: err instanceof Error ? err.message : 'Could not load pair status',
//       })
//     }
//   },

//   async sendRequest(code, message) {
//     set({ error: null })
//     await pairService.request(code, message)
//     await get().load()
//   },

//   async accept(id) {
//     set({ error: null })
//     await pairService.accept(id)
//     await get().load()
//   },

//   async reject(id) {
//     set({ error: null })
//     await pairService.reject(id)
//     await get().load()
//   },

//   async cancel(id) {
//     set({ error: null })
//     await pairService.cancel(id)
//     await get().load()
//   },
// }))