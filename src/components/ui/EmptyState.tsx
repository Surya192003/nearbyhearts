export function EmptyState({
  emoji = '💞',
  title,
  hint,
}: {
  emoji?: string
  title: string
  hint?: string
}) {
  return (
    <div className="grid place-items-center rounded-card border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
      <div className="text-3xl">{emoji}</div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}