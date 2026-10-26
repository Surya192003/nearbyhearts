import { useEffect, useState } from 'react'
import { Heart, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Pill'
import { Button } from '@/components/ui/Button'
import { formatCountdown, formatDistance, timeAgo } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useCountdownStore } from '@/store/countdownStore'
import { useFeedStore } from '@/store/feedStore'

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function WhatsNewPage() {
  const user = useAuthStore((s) => s.user)
  const { items, loading, load: loadFeed, react } = useFeedStore()
  const {
    nextVisitIso,
    distanceKm,
    loading: cdLoading,
    saving,
    load: loadCountdown,
    save: saveCountdown,
  } = useCountdownStore()

  const [editing, setEditing] = useState(false)
  const [dateInput, setDateInput] = useState('')
  const [distanceInput, setDistanceInput] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    void loadFeed()
    void loadCountdown()
  }, [loadFeed, loadCountdown])

  useEffect(() => {
    setDateInput(toDateInputValue(nextVisitIso))
    setDistanceInput(distanceKm != null ? String(distanceKm) : '')
  }, [nextVisitIso, distanceKm])

  const countdown = nextVisitIso ? formatCountdown(nextVisitIso) : null

  const onSave = async () => {
    setSaveError(null)
    const nextVisitAt = dateInput ? `${dateInput}T12:00:00.000Z` : null
    const km = distanceInput.trim() === '' ? null : Number(distanceInput)
    if (km != null && (!Number.isFinite(km) || km < 0)) {
      setSaveError('Distance must be a number ≥ 0')
      return
    }
    try {
      await saveCountdown({ nextVisitAt, distanceKm: km })
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="forest" className="text-center">
        <div className="flex items-center justify-between">
          <p className="label text-accent">Next visit</p>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full p-1.5 text-accent transition hover:bg-white/10"
              aria-label="Edit next visit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-3 space-y-3 text-left">
            <label className="block">
              <span className="label text-accent">Next visit date</span>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="mt-1 w-full rounded-field border border-accent/40 bg-primary-strong/40 px-3 py-2 text-sm text-cream outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label text-accent">Distance (km)</span>
              <input
                type="number"
                min={0}
                value={distanceInput}
                onChange={(e) => setDistanceInput(e.target.value)}
                placeholder="e.g. 1810"
                className="mt-1 w-full rounded-field border border-accent/40 bg-primary-strong/40 px-3 py-2 text-sm text-cream outline-none focus:border-accent"
              />
            </label>
            {saveError && (
              <p className="text-xs text-rose-strong">{saveError}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={() => void onSave()} loading={saving} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : cdLoading ? (
          <p className="mt-2 font-script text-4xl text-accent">…</p>
        ) : countdown && !countdown.done ? (
          <>
            <p className="mt-2 font-script text-4xl text-accent">
              {countdown.days} days
            </p>
            <div className="mt-3 flex justify-center gap-5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-cream/80 tabular-nums">
              <span>{String(countdown.hours).padStart(2, '0')}h</span>
              <span>{String(countdown.minutes).padStart(2, '0')}m</span>
              <span>{String(countdown.seconds).padStart(2, '0')}s</span>
            </div>
          </>
        ) : countdown?.done ? (
          <p className="mt-2 font-script text-4xl text-accent">Today 🎉</p>
        ) : (
          <p className="mt-2 text-sm text-cream/70">Tap edit to set your next visit</p>
        )}

        <p className="mt-3 text-xs italic text-cream/70">
          {distanceKm != null
            ? `${formatDistance(distanceKm)} apart`
            : 'Distance not set'}{' '}
          · {user?.partner?.city ?? 'their city'}
        </p>
      </Card>

      <div>
        <p className="label">What's new</p>
        <h2 className="font-script text-3xl text-rose">From your person</h2>
      </div>

      {loading && items.length === 0 && (
        <EmptyState emoji="⏳" title="Loading your feed…" />
      )}
      {!loading && items.length === 0 && (
        <EmptyState title="Nothing here yet" hint="Share a note, a photo, or a mood." />
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card variant="ornate" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.authorName}</span>
                  {item.kind === 'milestone' && <Pill tone="rose">Milestone</Pill>}
                  {item.kind === 'mood' && item.mood && <Pill tone="gold">{item.mood}</Pill>}
                </div>
                <span className="label">{timeAgo(item.createdAt)}</span>
              </div>
              <p className="text-[17px] leading-relaxed">{item.text}</p>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-52 w-full rounded-field object-cover"
                  loading="lazy"
                />
              )}
              <button
                type="button"
                onClick={() => void react(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-sans text-[0.68rem] font-bold uppercase tracking-[0.14em] transition ${
                  item.reactedByMe
                    ? 'border-rose/40 bg-rose-soft text-rose-strong'
                    : 'border-line text-muted hover:border-rose/40 hover:text-rose'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${item.reactedByMe ? 'fill-current' : ''}`} />
                {item.reactionCount}
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}