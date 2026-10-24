import { apiGet, apiPost } from '@/lib/api'
import type { FeedItem } from '@/types'

export const feedService = {
  async list(): Promise<FeedItem[]> {
    return apiGet<FeedItem[]>('/feed')
  },

  async react(id: string): Promise<FeedItem> {
    return apiPost<FeedItem>(`/feed/${id}/react`, {})
  },

  async create(input: {
    kind: FeedItem['kind']
    text: string
    mood: string | null
    authorId: string
    authorName: string
    authorAvatarUrl: string | null
  }): Promise<FeedItem> {
    // authorId/authorName/authorAvatarUrl are derived from the session on the
    // backend. Kept in the signature so store call sites don't change.
    return apiPost<FeedItem>('/feed', {
      kind: input.kind,
      text: input.text,
      mood: input.mood,
    })
  },
}