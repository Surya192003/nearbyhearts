import { Camera, Heart, MessageCircle, Sparkles, UserPlus, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app/whats-new', label: "What's new", icon: Sparkles },
  { to: '/app/chat', label: 'Chat', icon: MessageCircle },
  { to: '/app/video', label: 'Video call', icon: Video },
  { to: '/app/gifts', label: 'Gifts', icon: Heart },
  { to: '/app/photobooth', label: 'Photos', icon: Camera },
  { to: '/app/pair', label: 'Pair', icon: UserPlus },
]