import { create } from 'zustand'
import { authService } from '@/services/authService'
import type { SignInPayload, SignUpPayload, User } from '@/types'

type Status = 'idle' | 'loading' | 'authenticated' | 'anonymous'

type State = {
  user: User | null
  status: Status
  error: string | null
  hydrate: () => Promise<void>
  refresh: () => Promise<void>
  signIn: (payload: SignInPayload) => Promise<void>
  signUp: (payload: SignUpPayload) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<State>((set, get) => ({
  user: null,
  status: 'idle',
  error: null,

  async hydrate() {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    try {
      const user = await authService.getCurrentUser()
      set({ user, status: user ? 'authenticated' : 'anonymous' })
    } catch {
      set({ user: null, status: 'anonymous' })
    }
  },

  async refresh() {
    try {
      const user = await authService.getCurrentUser()
      set({ user, status: user ? 'authenticated' : 'anonymous' })
    } catch {
      // keep current state on failure
    }
  },

  async signIn(payload) {
    set({ status: 'loading', error: null })
    try {
      const user = await authService.signIn(payload)
      set({ user, status: 'authenticated' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not sign you in.'
      set({ status: 'anonymous', error: message })
      throw err
    }
  },

  async signUp(payload) {
    set({ status: 'loading', error: null })
    try {
      const user = await authService.signUp(payload)
      set({ user, status: 'authenticated' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not create your account.'
      set({ status: 'anonymous', error: message })
      throw err
    }
  },

  async signOut() {
    try {
      await authService.signOut()
    } finally {
      set({ user: null, status: 'anonymous', error: null })
    }
  },
}))