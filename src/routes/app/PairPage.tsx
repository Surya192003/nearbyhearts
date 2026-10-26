import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Heart } from 'lucide-react'
import { AddressCard } from '@/components/pair/AddressCard'
import { DistanceCard } from '@/components/pair/DistanceCard'
import { VisitsCard } from '@/components/pair/VisitsCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { coupleService } from '@/services/coupleService'
import type { Couple, InviteCode } from '@/types'

export function PairPage() {
  const user = useAuthStore((s) => s.user)
  const refreshUser = useAuthStore((s) => s.refresh)

  const [couple, setCouple] = useState<Couple | null>(null)
  const [invite, setInvite] = useState<InviteCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPaired = Boolean(couple && user?.partner)

  const load = useCallback(async () => {
    setError(null)
    try {
      const c = await coupleService.get()
      setCouple(c)
    } catch {
      // 404 → not paired yet. Fetch (or create) an invite code so we can share it.
      setCouple(null)
      try {
        const inv = await coupleService.createInvite()
        setInvite(inv)
      } catch (invErr) {
        setError(invErr instanceof Error ? invErr.message : 'Could not load invite code.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    void load()
  }, [user, load])

  const copyCode = async () => {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked */
    }
  }

  const submit = async () => {
    setError(null)
    if (!code.trim()) {
      setError('Enter your partner’s code first.')
      return
    }
    setSubmitting(true)
    try {
      await coupleService.joinWithCode(code.trim())
      await refreshUser()
      await load()
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null
  if (loading) {
    return <p className="text-center text-sm text-muted">Loading…</p>
  }

  // ---------- PAIRED ----------
  if (isPaired && couple && user.partner) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label">Pairing</p>
          <h2 className="font-script text-3xl text-rose">You two, locked in 💕</h2>
        </div>

        <Card className="space-y-3 text-center">
          <div className="mx-auto flex items-center justify-center gap-3">
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="lg" />
            <Heart className="h-5 w-5 text-rose" />
            <Avatar name={`${user.partner.firstName} ${user.partner.lastName}`} src={user.partner.avatarUrl} size="lg" />
          </div>
          <p className="text-base font-semibold">
            {user.firstName} &amp; {user.partner.firstName}
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

  // ---------- UNPAIRED ----------
  return (
    <div className="space-y-6">
      <div>
        <p className="label">Pairing</p>
        <h2 className="font-script text-3xl text-rose">Find your person</h2>
        <p className="mt-2 text-sm text-muted">
          Share your invite code. When they join, you’re paired forever.
        </p>
      </div>

      {error && (
        <div className="rounded-card border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-strong">
          {error}
        </div>
      )}

      {invite && (
        <Card className="space-y-3">
          <p className="label">Your invite code</p>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="mx-auto flex w-full items-center justify-center gap-2 rounded-field border border-accent/40 bg-cream px-4 py-3 font-mono text-2xl font-bold tracking-[0.2em] text-rose hover:bg-accent-soft"
          >
            {invite.code}
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted" />}
          </button>
          <p className="text-center text-xs text-muted">
            Expires {new Date(invite.expiresAt).toLocaleString()}. Share this with your partner.
          </p>
        </Card>
      )}

      <Card className="space-y-3">
        <p className="label">Enter their code</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="NH-ABCD23"
          className="w-full rounded-field border border-line bg-canvas px-3 py-2.5 font-mono text-lg tracking-[0.14em] outline-none focus:border-accent"
          maxLength={9}
        />
        <Button onClick={() => void submit()} loading={submitting} className="w-full">
          Join
        </Button>
      </Card>
    </div>
  )
}