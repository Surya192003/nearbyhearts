import { apiGet, apiPost } from '@/lib/api'
import type { Message } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

async function apiDelete(path: string): Promise<{ ok: boolean; deleted?: number }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      /* ignore */
    }
    throw new Error(`DELETE ${path}: ${detail}`)
  }
  return res.json() as Promise<{ ok: boolean; deleted?: number }>
}

export const chatService = {
  async list(_conversationId?: string): Promise<Message[]> {
    return apiGet<Message[]>('/messages')
  },

  async send(input: {
    conversationId: string
    senderId: string
    text: string
    isIncognito?: boolean
  }): Promise<Message> {
    return apiPost<Message>('/messages', {
      text: input.text,
      isIncognito: input.isIncognito === true,
    })
  },

  async delete(id: string): Promise<void> {
    await apiDelete(`/messages/${id}`)
  },

  async clearAll(): Promise<number> {
    const res = await apiDelete('/messages')
    return res.deleted ?? 0
  },
}