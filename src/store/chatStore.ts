import { create } from 'zustand'
import { chatService } from '@/services/chatService'
import { CONVERSATION_ID } from '@/data/messages'
import type { Message } from '@/types'

type State = {
  messages: Message[]
  loading: boolean
  sending: boolean
  load: () => Promise<void>
  send: (senderId: string, text: string) => Promise<void>
}

export const useChatStore = create<State>((set) => ({
  messages: [],
  loading: false,
  sending: false,

  async load() {
    set({ loading: true })
    const messages = await chatService.list(CONVERSATION_ID)
    set({ messages, loading: false })
  },

  async send(senderId, text) {
    set({ sending: true })
    const msg = await chatService.send({
      conversationId: CONVERSATION_ID,
      senderId,
      text,
    })
    set((s) => ({ messages: [...s.messages, msg], sending: false }))
  },
}))