import { initials } from '@/lib/format'

type AvatarProps = {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
} as const

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const base = `shrink-0 rounded-full ${SIZES[size]} ${className}`

  if (src) {
    return <img src={src} alt={name} className={`${base} object-cover`} />
  }

  return (
    <span
      aria-hidden="true"
      className={`${base} grid place-items-center bg-primary font-serif text-accent ring-1 ring-accent/50`}
    >
      {initials(name)}
    </span>
  )
}