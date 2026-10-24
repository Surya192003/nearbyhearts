import { apiGetOptional, apiPost, apiPostNoContent } from '@/lib/api'
import type { SignInPayload, SignUpPayload, User } from '@/types'

export const authService = {
  async signIn(payload: SignInPayload): Promise<User> {
    const { user } = await apiPost<{ user: User }>('/auth/signin', payload)
    return user
  },

  async signUp(payload: SignUpPayload): Promise<User> {
    const { user } = await apiPost<{ user: User }>('/auth/signup', payload)
    return user
  },

  async signOut(): Promise<void> {
    await apiPostNoContent('/auth/signout', {})
  },

  async getCurrentUser(): Promise<User | null> {
    const res = await apiGetOptional<{ user: User }>('/auth/me')
    return res?.user ?? null
  },
}