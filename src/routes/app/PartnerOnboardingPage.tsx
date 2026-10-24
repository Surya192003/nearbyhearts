import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { coupleService } from '@/services/coupleService'
import { useAuthStore } from '@/store/authStore'
import type { InviteCode } from '@/types'

type Mode = 'pick' | 'invite' | 'join'

export function PartnerOnboardingPage() {
  const navigate = useNavigate()
  const refresh = useAuthStore((s) => s.refresh)
  const user = useAuthStore((s) => s.user)

  const [mode, setMode] = useState<Mode>('pick')
  const [invite, setInvite] = useState<InviteCode | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Poll while showing an invite code. Refresh pulls fresh user data from
  // /auth/me — no new service method needed.
  useEffect(() => {
    if (!invite) return
    const tick = async () => {
      await refresh()
      const partner = useAuthStore.getState().user?.partner
      if (partner) {
        navigate('/app/whats-new', { replace: true })
      }
    }
    const id = setInterval(() => void tick(), 5000)
    return () => clearInterval(id)
  }, [invite, refresh, navigate])

  const createInvite = async () => {
    setBusy(true)
    setError(null)
    try {
      const code = await coupleService.createInvite()
      setInvite(code)
      setMode('invite')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite')
    } finally {
      setBusy(false)
    }
  }

  const join = async () => {
    if (!joinCode.trim()) {
      setError('Enter your partner’s code first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await coupleService.joinWithCode(joinCode.trim().toUpperCase())
      await refresh()
      navigate('/app/whats-new', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join that code')
    } finally {
      setBusy(false)
    }
  }

  const copyCode = async () => {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  if (mode === 'pick') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="label">One last step</p>
          <h2 className="mt-1 font-script text-3xl text-rose">
            Connect with your person
          </h2>
          <p className="mt-2 text-sm text-muted">
            Hi {user?.firstName ?? 'there'} — NearbyHearts is shared with one
            partner. Choose how to connect.
          </p>
        </div>

        {error && (
          <div className="rounded-field border border-rose/40 bg-rose-soft px-3 py-2 text-xs text-rose-strong">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="flex flex-col justify-between gap-3">
            <div>
              <Users className="h-5 w-5 text-accent" />
              <h3 className="mt-2 font-semibold">Create an invite</h3>
              <p className="mt-1 text-xs text-muted">
                You'll get a 6-character code. Share it with your partner —
                they enter it on their account.
              </p>
            </div>
            <Button onClick={() => void createInvite()} loading={busy}>
              Generate code
            </Button>
          </Card>

          <Card className="flex flex-col justify-between gap-3">
            <div>
              <Check className="h-5 w-5 text-accent" />
              <h3 className="mt-2 font-semibold">I have a code</h3>
              <p className="mt-1 text-xs text-muted">
                Your partner sent you a code. Enter it to connect.
              </p>
            </div>
            <Button variant="outline" onClick={() => setMode('join')}>
              Enter code
            </Button>
          </Card>
        </div>

        <p className="text-center text-xs text-muted">
          Your partner needs to sign up first, then enter your code.
        </p>
      </div>
    )
  }

  if (mode === 'invite' && invite) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="label">Share this code</p>
          <h2 className="mt-1 font-script text-3xl text-rose">
            Waiting for your partner
          </h2>
          <p className="mt-2 text-sm text-muted">
            Send this code to your partner. Once they enter it on their
            account, you'll both be connected.
          </p>
        </div>

        <Card className="space-y-4 text-center">
          <p className="font-mono text-3xl font-bold tracking-[0.2em] text-rose">
            {invite.code}
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              icon={<Copy className="h-4 w-4" />}
              onClick={() => void copyCode()}
            >
              {copied ? 'Copied' : 'Copy code'}
            </Button>
          </div>
          <p className="text-xs text-muted">
            Expires {new Date(invite.expiresAt).toLocaleString()}
          </p>
          <p className="text-xs text-muted">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />{' '}
            Checking every few seconds…
          </p>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => setMode('pick')}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="label">Enter code</p>
        <h2 className="mt-1 font-script text-3xl text-rose">
          Join your partner
        </h2>
        <p className="mt-2 text-sm text-muted">
          Paste the code they shared with you. It looks like NH-ABC123.
        </p>
      </div>

      {error && (
        <div className="rounded-field border border-rose/40 bg-rose-soft px-3 py-2 text-xs text-rose-strong">
          {error}
        </div>
      )}

      <Card className="space-y-3">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="NH-ABC123"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-field border border-line bg-canvas px-3 py-3 text-center font-mono text-lg tracking-[0.2em] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <Button className="w-full" onClick={() => void join()} loading={busy}>
          Connect
        </Button>
      </Card>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => setMode('pick')}>
          Back
        </Button>
      </div>
    </div>
  )
}