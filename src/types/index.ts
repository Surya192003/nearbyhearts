export type Partner = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  city: string
  state: string | null
  country: string | null
  timezone: string
  latitude: number | null
  longitude: number | null
  lastSeenAt: string
}

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  city: string
  state: string | null
  country: string | null
  timezone: string
  latitude: number | null
  longitude: number | null
  lastSeenAt: string
  couple: { id: string; togetherSince: string | null } | null
  partner: Partner | null
}

export type Couple = {
  id: string
  userId: string
  partnerId: string
  togetherSince: string | null
  nextVisitAt: string | null
  distanceKm: number | null
}

export type InviteCode = {
  code: string
  expiresAt: string
}

export type SignInPayload = { email: string; password: string }
export type SignUpPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  city?: string
}

export type FeedKind = 'note' | 'photo' | 'milestone' | 'mood'
export type FeedItem = {
  id: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  kind: FeedKind
  text: string
  imageUrl: string | null
  mood: string | null
  createdAt: string
  reactionCount: number
  reactedByMe: boolean
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  text: string
  createdAt: string
  status: 'sending' | 'sent' | 'read'
  isIncognito: boolean
  expiresAt: string
}

export type Gift = {
  id: string
  name: string
  emoji: string
  priceCents: number
  blurb: string
}

export type SentGift = {
  id: string
  giftId: string
  fromUserId: string
  toUserId: string
  note: string
  createdAt: string
}

export type CallSession = {
  id: string
  roomUrl: string
  partnerOnline: boolean
  startedAt: string | null
}

export type DonationPayload = {
  code: string
  amountCents: number
  donorName: string
  message: string
}

export type DonationReceipt = {
  id: string
  amountCents: number
  donorName: string
  message: string
  createdAt: string
}