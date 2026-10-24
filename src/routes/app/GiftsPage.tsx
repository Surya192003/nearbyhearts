import { useEffect, useState } from 'react'
import { Gift as GiftIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useGiftStore } from '@/store/giftStore'

const eur = (cents: number) =>
  cents === 0 ? 'Free' : `${(cents / 100).toFixed(2)} EUR`



export function GiftsPage() {
  const user = useAuthStore((s) => s.user)
  const { catalog, sent, loading, sending, load, send } = useGiftStore()
  const [activeGiftId, setActiveGiftId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const isPaired = Boolean(user?.couple && user?.partner)

  useEffect(() => {
    if (isPaired) void load()
  }, [isPaired, load])

  const onSend = async () => {
    if (!activeGiftId || !user?.partner) return
    await send({
      giftId: activeGiftId,
      fromUserId: user.id,
      toUserId: user.partner.id,
      note: note.trim(),
    })
    setActiveGiftId(null)
    setNote('')
  }

  if (!isPaired) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Gifts</h2>
        <EmptyState
          emoji="💛"
          title="Pair first to send gifts"
          hint="Find your partner's code in /app/pair."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Gifts</h2>

      {loading && catalog.length === 0 && (
        <EmptyState emoji="⏳" title="Loading gifts…" />
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {catalog.map((g) => (
          <li key={g.id}>
            <Card className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{g.emoji}</span>
                <span className="text-xs font-bold text-muted">{eur(g.priceCents)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{g.name}</p>
                <p className="mt-1 text-xs text-muted">{g.blurb}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                icon={<GiftIcon className="h-4 w-4" />}
                onClick={() => setActiveGiftId(g.id === activeGiftId ? null : g.id)}
              >
                {activeGiftId === g.id ? 'Close' : 'Send'}
              </Button>
              {activeGiftId === g.id && (
                <div className="space-y-2 rounded-field bg-cream p-3">
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note…"
                    className="w-full resize-none rounded-field border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-accent"
                  />
                  <Button
                    className="w-full"
                    loading={sending}
                    onClick={() => void onSend()}
                  >
                    Confirm send
                  </Button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h3 className="label">Recently sent</h3>
        {sent.length === 0 ? (
          <EmptyState title="No gifts yet" hint="Pick something above to get started." />
        ) : (
          <ul className="space-y-2">
            {sent.map((s) => {
              const gift = catalog.find((g) => g.id === s.giftId)
              const direction = s.fromUserId === user?.id ? 'You sent' : 'They sent'
              return (
                <li key={s.id}>
                  <Card className="flex items-center gap-3 py-3.5">
                    <span className="text-2xl">{gift?.emoji ?? '🎁'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {gift?.name ?? 'Gift'}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {direction} · {timeAgo(s.createdAt)}
                        {s.note ? ` · "${s.note}"` : ''}
                      </p>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}