import { useEffect, useState } from 'react'
import { Check, Copy, Heart, X } from 'lucide-react'
import { AddressCard } from '@/components/pair/AddressCard'
import { DistanceCard } from '@/components/pair/DistanceCard'
import { VisitsCard } from '@/components/pair/VisitsCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { usePairStore } from '@/store/pairStore'

export function PairPage() {
  const user = useAuthStore((s) => s.user)
  const refreshUser = useAuthStore((s) => s.refresh)
  const { status, loading, error, load, sendRequest, accept, reject, cancel } =
    usePairStore()

  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isPaired = Boolean(user?.couple && user.partner)

  useEffect(() => {
    if (!isPaired) void load()
  }, [isPaired, load])

  const copyCode = async () => {
    if (!user) return
    try {
      await navigator.clipboard.writeText(user.pairCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked */
    }
  }

  const submit = async () => {
    setLocalError(null)
    if (!code.trim()) {
      setLocalError('Enter a partner code first.')
      return
    }
    setSubmitting(true)
    try {
      await sendRequest(code.trim(), message.trim() || undefined)
      setCode('')
      setMessage('')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not send request.')
    } finally {
      setSubmitting(false)
    }
  }

  const onAccept = async (id: string) => {
    setSubmitting(true)
    try {
      await accept(id)
      await refreshUser()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not accept.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  // ---------- PAIRED VIEW ----------
  if (isPaired && user.partner) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label">Pairing</p>
          <h2 className="font-script text-3xl text-rose">You two, locked in 💕</h2>
        </div>

        <Card className="space-y-3 text-center">
          <div className="mx-auto flex items-center justify-center gap-3">
            <Avatar
              name={`${user.firstName} ${user.lastName}`}
              src={user.avatarUrl}
              size="lg"
            />
            <Heart className="h-5 w-5 text-rose" />
            <Avatar
              name={`${user.partner.firstName} ${user.partner.lastName}`}
              src={user.partner.avatarUrl}
              size="lg"
            />
          </div>
          <p className="text-base font-semibold">
            {user.firstName} & {user.partner.firstName}
          </p>
          <p className="text-xs text-muted">
            Pairing is permanent. If something goes wrong, contact support.
          </p>
        </Card>

        <AddressCard />
        <DistanceCard />
        <VisitsCard />
      </div>
    )
  }

  // ---------- UNPAIRED VIEW ----------
  return (
    <div className="space-y-6">
      <div>
        <p className="label">Pairing</p>
        <h2 className="font-script text-3xl text-rose">Find your person</h2>
        <p className="mt-2 text-sm text-muted">
          Share your code. When they accept, you're paired forever.
        </p>
      </div>

      {(localError || error) && (
        <div className="rounded-card border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-strong">
          {localError ?? error}
        </div>
      )}

      <Card className="space-y-3">
        <p className="label">Your code</p>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="mx-auto flex w-full items-center justify-center gap-2 rounded-field border border-accent/40 bg-cream px-4 py-3 font-mono text-2xl font-bold tracking-[0.2em] text-rose hover:bg-accent-soft"
        >
          {user.pairCode}
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4 text-muted" />
          )}
        </button>
        <p className="text-center text-xs text-muted">
          Share this with your partner so they can send a request.
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="label">Enter their code</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          className="w-full rounded-field border border-line bg-canvas px-3 py-2.5 font-mono text-lg tracking-[0.14em] outline-none focus:border-accent"
          maxLength={8}
        />
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional note for them…"
          className="w-full resize-none rounded-field border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button onClick={() => void submit()} loading={submitting} className="w-full">
          Send request
        </Button>
      </Card>

      {status && status.incoming.length > 0 && (
        <Card className="space-y-3">
          <p className="label">Incoming requests</p>
          <ul className="space-y-2">
            {status.incoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-field border border-line bg-cream/40 p-3"
              >
                <Avatar
                  name={`${r.fromUser.firstName} ${r.fromUser.lastName}`}
                  src={r.fromUser.avatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {r.fromUser.firstName} {r.fromUser.lastName}
                  </p>
                  {r.message && (
                    <p className="truncate text-xs italic text-muted">
                      "{r.message}"
                    </p>
                  )}
                  <p className="text-[10px] text-muted">{timeAgo(r.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    onClick={() => void onAccept(r.id)}
                    loading={submitting}
                    className="!min-h-[36px] !px-3 !py-1.5 !text-[10px]"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void reject(r.id)}
                    className="!min-h-[36px] !px-2 !py-1.5"
                    aria-label="Reject"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {status && status.outgoing.length > 0 && (
        <Card className="space-y-3">
          <p className="label">Sent requests</p>
          <ul className="space-y-2">
            {status.outgoing.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-field border border-line bg-cream/40 p-3"
              >
                <Avatar
                  name={`${r.fromUser.firstName} ${r.fromUser.lastName}`}
                  src={r.fromUser.avatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {r.fromUser.firstName} {r.fromUser.lastName}
                  </p>
                  <p className="text-[10px] text-muted">
                    Waiting for them · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => void cancel(r.id)}
                  className="!min-h-[36px] !px-3 !py-1.5 !text-[10px]"
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {loading && !status && <EmptyState emoji="⏳" title="Loading…" />}
      {status && status.incoming.length === 0 && status.outgoing.length === 0 && (
        <p className="text-center text-xs text-muted">
          No requests yet. Share your code to get started.
        </p>
      )}
    </div>
  )
}