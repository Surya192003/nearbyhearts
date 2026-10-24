import { create } from 'zustand'
import { feedService } from '@/services/feedService'
import type { FeedItem } from '@/types'

type State = {
  items: FeedItem[]
  loading: boolean
  load: () => Promise<void>
  react: (id: string) => Promise<void>
  create: (input: {
    kind: FeedItem['kind']
    text: string
    mood: string | null
    authorId: string
    authorName: string
    authorAvatarUrl: string | null
  }) => Promise<void>
}

export const useFeedStore = create<State>((set) => ({
  items: [],
  loading: false,

  async load() {
    set({ loading: true })
    const items = await feedService.list()
    set({ items, loading: false })
  },

  async react(id) {
    const updated = await feedService.react(id)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },

  async create(input) {
    const created = await feedService.create(input)
    set((s) => ({ items: [created, ...s.items] }))
  },
}))