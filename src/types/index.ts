export type Couple = {
  id: string
  togetherSince: string | null
}

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
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  city: string
  state: string | null
  country: string | null
  timezone: string
  latitude: number | null
  longitude: number | null
  pairCode: string
  couple: Couple | null
  partner: Partner | null
}

export type SignInPayload = { email: string; password: string }

export type SignUpPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  city?: string
}

export type InviteCode = {
  code: string
  expiresAt: string
}



export type VisitStatus =
  | 'scheduled'
  | 'cancel_pending'
  | 'cancelled'
  | 'completed'

export type Visit = {
  id: string
  createdBy: string
  title: string
  scheduledAt: string
  status: VisitStatus
  cancelRequestedBy: string | null
  cancelReason: string | null
  createdAt: string
  updatedAt: string
}

export type PairRequest = {
  id: string
  fromUser: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  message: string | null
  createdAt: string
}

export type PairStatus = {
  incoming: PairRequest[]
  outgoing: PairRequest[]
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