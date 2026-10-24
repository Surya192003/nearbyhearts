import type { Gift, SentGift } from '@/types'

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString()

export const GIFT_CATALOG: Gift[] = [
  { id: 'g_coffee', name: 'Coffee on me', emoji: '☕', priceCents: 450,
    blurb: 'A warm cup, sent across the distance.' },
  { id: 'g_flowers', name: 'Flowers', emoji: '💐', priceCents: 2500,
    blurb: 'Delivered to their door with a handwritten note.' },
  { id: 'g_chocolate', name: 'Chocolate box', emoji: '🍫', priceCents: 1800,
    blurb: 'Sixteen pieces, none of them shared.' },
  { id: 'g_playlist', name: 'Custom playlist', emoji: '🎧', priceCents: 0,
    blurb: 'Ten songs that sound like us.' },
  { id: 'g_star', name: 'Name a star', emoji: '⭐', priceCents: 4900,
    blurb: 'A tiny light with your names on it.' },
  { id: 'g_plant', name: 'Potted plant', emoji: '🪴', priceCents: 3200,
    blurb: 'Something to keep alive together.' },
]

export const SENT_GIFT_SEED: SentGift[] = [
  { id: 'sg_1', giftId: 'g_playlist', fromUserId: 'usr_01', toUserId: 'usr_02',
    note: 'Track 4 is the one from the airport.', createdAt: ago(2880) },
  { id: 'sg_2', giftId: 'g_coffee', fromUserId: 'usr_02', toUserId: 'usr_01',
    note: 'Because you were up late again.', createdAt: ago(300) },
]