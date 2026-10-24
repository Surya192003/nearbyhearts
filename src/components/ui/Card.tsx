import type { HTMLAttributes } from 'react'

type Variant = 'default' | 'ornate' | 'forest'

const VARIANTS: Record<Variant, string> = {
  default: 'border border-line bg-surface',
  ornate: 'border border-accent/35 bg-surface shadow-soft',
  forest: 'border border-accent/20 bg-primary text-cream',
}

export function Card({
  variant = 'default',
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div
      {...rest}
      className={`rounded-card p-5 ${VARIANTS[variant]} ${className}`}
    />
  )
}