// import { apiGet, apiPostNoContent } from '@/lib/api'
// import type { PairStatus } from '@/types'

// export const pairService = {
//   async status(): Promise<PairStatus> {
//     return apiGet<PairStatus>('/pair/status')
//   },

//   async request(code: string, message?: string): Promise<void> {
//     await apiPostNoContent('/pair/request', { code, message })
//   },

//   async accept(id: string): Promise<void> {
//     await apiPostNoContent(`/pair/requests/${id}/accept`, {})
//   },

//   async reject(id: string): Promise<void> {
//     await apiPostNoContent(`/pair/requests/${id}/reject`, {})
//   },

//   async cancel(id: string): Promise<void> {
//     const res = await fetch(
//       `${import.meta.env.VITE_API_URL}/pair/requests/${id}`,
//       { method: 'DELETE', credentials: 'include' },
//     )
//     if (!res.ok) throw new Error(`Cancel failed: ${res.status}`)
//   },
// }