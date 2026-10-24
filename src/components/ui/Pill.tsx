import type { ReactNode } from 'react'

type Tone = 'neutral' | 'gold' | 'forest' | 'rose'

const TONES: Record<Tone, string> = {
  neutral: 'border-line bg-cream text-muted',
  gold: 'border-transparent bg-accent-soft text-accent-strong',
  forest: 'border-transparent bg-primary text-cream',
  rose: 'border-transparent bg-rose-soft text-rose-strong',
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: Tone
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border px-3 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-[0.14em] ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}