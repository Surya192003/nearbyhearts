import { apiGet, apiPost } from '@/lib/api'
import type { Message } from '@/types'

export const chatService = {
  async list(_conversationId?: string): Promise<Message[]> {
    return apiGet<Message[]>('/messages')
  },

  async send(input: {
    conversationId: string
    senderId: string
    text: string
  }): Promise<Message> {
    return apiPost<Message>('/messages', { text: input.text })
  },
}