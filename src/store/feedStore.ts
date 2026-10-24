import { create } from 'zustand'
import { feedService } from '@/services/feedService'
import type { FeedItem } from '@/types'

type State = {
  items: FeedItem[]
  loading: boolean
  error: string | null
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
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const items = await feedService.list()
      set({ items, loading: false })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Could not load feed',
      })
    }
  },

  async react(id) {
    try {
      const updated = await feedService.react(id)
      set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Could not react' })
    }
  },

  async create(input) {
    const created = await feedService.create(input)
    set((s) => ({ items: [created, ...s.items] }))
  },
}))