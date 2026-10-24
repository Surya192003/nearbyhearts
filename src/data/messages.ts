import type { Message } from '@/types'

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString()

export const CONVERSATION_ID = 'conv_01'

export const MESSAGE_SEED: Message[] = [
  { id: 'm1', conversationId: CONVERSATION_ID, senderId: 'usr_02',
    text: 'Morning ☀️ how did you sleep?', createdAt: ago(210), status: 'read' },
  { id: 'm2', conversationId: CONVERSATION_ID, senderId: 'usr_01',
    text: 'Barely — stayed up watching that series you told me about.', createdAt: ago(205), status: 'read' },
  { id: 'm3', conversationId: CONVERSATION_ID, senderId: 'usr_02',
    text: 'I KNEW you would 😂', createdAt: ago(203), status: 'read' },
  { id: 'm4', conversationId: CONVERSATION_ID, senderId: 'usr_01',
    text: 'Free for a call after 7?', createdAt: ago(20), status: 'read' },
  { id: 'm5', conversationId: CONVERSATION_ID, senderId: 'usr_02',
    text: 'Yes! I will finish work by then 💕', createdAt: ago(6), status: 'sent' },
]