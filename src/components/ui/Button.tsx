import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'border border-primary bg-primary text-cream hover:bg-primary-strong',
  outline:
    'border border-accent/60 bg-surface text-ink hover:border-accent hover:bg-accent-soft',
  ghost: 'border border-transparent text-muted hover:bg-cream hover:text-ink',
}

export function Button({
  variant = 'primary',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-5 py-2.5',
        'font-sans text-[0.72rem] font-bold uppercase tracking-[0.16em] transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}