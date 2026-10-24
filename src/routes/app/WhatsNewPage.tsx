import { useEffect, useMemo, useState } from 'react'
import { Heart, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Pill'
import { Button } from '@/components/ui/Button'
import { formatCountdown, timeAgo } from '@/lib/format'
import { formatDistance, haversineKm } from '@/lib/distance'
import { useAuthStore } from '@/store/authStore'
import { useFeedStore } from '@/store/feedStore'
import { useVisitStore } from '@/store/visitStore'

export function WhatsNewPage() {
  const user = useAuthStore((s) => s.user)
  const { items, loading, load, react, create } = useFeedStore()
  const { visits, load: loadVisits } = useVisitStore()

  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaired = Boolean(user?.couple && user.partner)

  useEffect(() => {
    if (isPaired) {
      void load()
      void loadVisits()
    }
  }, [isPaired, load, loadVisits])

  const nextVisit = useMemo(() => {
    const now = Date.now()
    return visits
      .filter(
        (v) => v.status === 'scheduled' && new Date(v.scheduledAt).getTime() > now,
      )
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]
  }, [visits])

  const distanceKm = useMemo(() => {
    if (
      user?.latitude != null &&
      user.longitude != null &&
      user.partner?.latitude != null &&
      user.partner.longitude != null
    ) {
      return haversineKm(
        { lat: user.latitude, lng: user.longitude },
        { lat: user.partner.latitude, lng: user.partner.longitude },
      )
    }
    return null
  }, [user])

  const countdown = nextVisit ? formatCountdown(nextVisit.scheduledAt) : null

  const submit = async () => {
    if (!user || !draft.trim()) return
    setPosting(true)
    setError(null)
    try {
      await create({
        kind: 'note',
        text: draft.trim(),
        mood: null,
        authorId: user.id,
        authorName: user.firstName,
        authorAvatarUrl: user.avatarUrl,
      })
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post.')
    } finally {
      setPosting(false)
    }
  }

  if (!isPaired) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label">What's new</p>
          <h2 className="font-script text-3xl text-rose">Waiting for your person</h2>
        </div>
        <EmptyState
          emoji="💌"
          title="You're not paired yet"
          hint="Pair with your partner in /app/pair to unlock the shared feed."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {countdown && nextVisit && (
        <Card variant="forest" className="text-center">
          <p className="label text-accent">
            Next visit · {nextVisit.title}
          </p>
          <p className="mt-2 font-script text-4xl text-accent">
            {countdown.done ? 'Today!' : `${countdown.days} days`}
          </p>
          {!countdown.done && (
            <div className="mt-3 flex justify-center gap-5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-cream/80 tabular-nums">
              <span>{String(countdown.hours).padStart(2, '0')}h</span>
              <span>{String(countdown.minutes).padStart(2, '0')}m</span>
              <span>{String(countdown.seconds).padStart(2, '0')}s</span>
            </div>
          )}
          <p className="mt-3 text-xs italic text-cream/70">
            {distanceKm != null ? `${formatDistance(distanceKm)} apart` : ''}
            {distanceKm != null && user?.partner?.city ? ' · ' : ''}
            {user?.partner?.city ?? ''}
          </p>
        </Card>
      )}

      <div>
        <p className="label">What's new</p>
        <h2 className="font-script text-3xl text-rose">Daily log</h2>
      </div>

      <Card className="space-y-3">
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`What's on your mind today, ${user?.firstName}?`}
          className="w-full resize-none rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {error && <p className="text-xs text-rose-strong">{error}</p>}
        <div className="flex justify-end">
          <Button
            onClick={() => void submit()}
            loading={posting}
            disabled={!draft.trim()}
            icon={<Send className="h-4 w-4" />}
          >
            Post
          </Button>
        </div>
      </Card>

      {loading && items.length === 0 && (
        <EmptyState emoji="⏳" title="Loading your feed…" />
      )}
      {!loading && items.length === 0 && (
        <EmptyState title="Nothing here yet" hint="Write the first thing above." />
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card variant="ornate" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.authorName}</span>
                  {item.kind === 'milestone' && <Pill tone="rose">Milestone</Pill>}
                </div>
                <span className="label">{timeAgo(item.createdAt)}</span>
              </div>

              <p className="whitespace-pre-wrap text-[17px] leading-relaxed">
                {item.text}
              </p>

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
                <Heart
                  className={`h-3.5 w-3.5 ${item.reactedByMe ? 'fill-current' : ''}`}
                />
                {item.reactionCount}
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}