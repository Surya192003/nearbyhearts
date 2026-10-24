import { create } from 'zustand'
import { chatService } from '@/services/chatService'
import { CONVERSATION_ID } from '@/data/messages'
import type { Message } from '@/types'

type State = {
  messages: Message[]
  loading: boolean
  sending: boolean
  clearing: boolean
  incognito: boolean
  error: string | null
  load: () => Promise<void>
  send: (senderId: string, text: string) => Promise<void>
  deleteOne: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  setIncognito: (on: boolean) => void
}

export const useChatStore = create<State>((set, get) => ({
  messages: [],
  loading: false,
  sending: false,
  clearing: false,
  incognito: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const messages = await chatService.list(CONVERSATION_ID)
      set({ messages, loading: false })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Could not load messages',
      })
    }
  },

  async send(senderId, text) {
    set({ sending: true, error: null })
    try {
      const msg = await chatService.send({
        conversationId: CONVERSATION_ID,
        senderId,
        text,
        isIncognito: get().incognito,
      })
      set((s) => ({ messages: [...s.messages, msg], sending: false }))
    } catch (err) {
      set({
        sending: false,
        error: err instanceof Error ? err.message : 'Could not send message',
      })
      throw err
    }
  },

  async deleteOne(id) {
    const prev = get().messages
    // Optimistic remove
    set({ messages: prev.filter((m) => m.id !== id), error: null })
    try {
      await chatService.delete(id)
    } catch (err) {
      // Roll back on failure
      set({
        messages: prev,
        error: err instanceof Error ? err.message : 'Could not delete message',
      })
    }
  },

  async clearAll() {
    const prev = get().messages
    set({ clearing: true, messages: [], error: null })
    try {
      await chatService.clearAll()
      set({ clearing: false })
    } catch (err) {
      set({
        clearing: false,
        messages: prev,
        error: err instanceof Error ? err.message : 'Could not clear chat',
      })
    }
  },

  setIncognito(on) {
    set({ incognito: on })
  },
}))