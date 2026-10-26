import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { CameraStage } from '@/components/photobooth/CameraStage'
import { DuoStage } from '@/components/photobooth/DuoStage'
import { LiveStage } from '@/components/photobooth/LiveStage'
import { PartnerSetup } from '@/components/photobooth/PartnerSetup'
import { PhotoGallery } from '@/components/photobooth/PhotoGallery'
import { PhotoStrip } from '@/components/photobooth/PhotoStrip'
import { StripUploader } from '@/components/photobooth/StripUploader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Capture, StoredPhoto } from '@/lib/photoDb'
import { consumePhotos, getQuota, type QuotaInfo } from '@/lib/photoQuota'
import type { StripCount } from '@/lib/stripFormat'
import { photoboothService } from '@/services/photoboothService'
import { useAuthStore } from '@/store/authStore'

type Variant = 'public' | 'app'
type Mode = 'solo' | 'duo' | 'live'
type Phase = 'idle' | 'camera' | 'review'

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'solo', label: 'Solo', hint: 'Just you' },
  { id: 'duo', label: 'Duo', hint: 'You + their photo' },
  { id: 'live', label: 'Live', hint: 'You + them, live' },
]

const DEV = import.meta.env.DEV

export function Photobooth({ variant }: { variant: Variant }) {
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const [quota, setQuota] = useState<QuotaInfo>(() => getQuota(user?.id))
  const [mode, setMode] = useState<Mode>('solo')
  const [stripSize, setStripSize] = useState<StripCount>(3)
  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionId, setSessionId] = useState('')
  const [captures, setCaptures] = useState<Capture[]>([])
  const [sessions, setSessions] = useState<StoredPhoto[][]>([])
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justUnlocked, setJustUnlocked] = useState(false)

  // Deterministic room id for Live mode — couple id if present, else sorted pair.
  // Both partners derive the same value.
  const liveRoomId = useMemo(() => {
    if (!user) return ''
    const coupleId = (user as { couple?: { id: string } | null }).couple?.id
    if (coupleId) return coupleId
    if (user.partner) return [user.id, user.partner.id].sort().join('-')
    return ''
  }, [user])

  const reloadGallery = useCallback(async () => {
    try {
      const all = await photoboothService.list()
      const grouped = new Map<string, StoredPhoto[]>()
      for (const p of all) {
        const list = grouped.get(p.sessionId) ?? []
        list.push(p)
        grouped.set(p.sessionId, list)
      }
      const ordered = [...grouped.values()]
        .map((g) => g.sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
        .sort((a, b) =>
          (b[0]?.createdAt ?? '').localeCompare(a[0]?.createdAt ?? ''),
        )
      if (DEV) {
        console.log(
          '[Photobooth] gallery reloaded',
          ordered.map((s) => ({ sessionId: s[0]?.sessionId, count: s.length })),
        )
      }
      setSessions(ordered)
    } catch (err) {
      if (DEV) console.error('[Photobooth] reloadGallery failed', err)
      setError('Could not load gallery. Try refreshing.')
    }
  }, [])

  useEffect(() => {
    void reloadGallery()
  }, [reloadGallery])

  // Reload quota whenever the signed-in user changes (login / logout)
  useEffect(() => {
    setQuota(getQuota(user?.id))
  }, [user?.id])

  useEffect(() => {
    if (searchParams.get('unlocked') === '1') {
      setJustUnlocked(true)
      setQuota(getQuota(user?.id))
      const next = new URLSearchParams(searchParams)
      next.delete('unlocked')
      setSearchParams(next, { replace: true })
      const t = setTimeout(() => setJustUnlocked(false), 5000)
      return () => clearTimeout(t)
    }
  }, [searchParams, setSearchParams, user?.id])

  const start = () => {
    setError(null)
    const fresh = getQuota(user?.id)
    setQuota(fresh)

    if (fresh.remaining <= 0) {
      setError('No photos left today. Donate €10 to unlock 10 more.')
      return
    }
    if (fresh.remaining < stripSize) {
      setError(
        `You only have ${fresh.remaining} photo${fresh.remaining === 1 ? '' : 's'} left today. ` +
          `Choose a smaller strip or donate to unlock more.`,
      )
      return
    }
    if (mode === 'duo' && !partnerPhotoUrl) {
      setError('Add a partner photo first.')
      return
    }
    if (mode === 'live' && !liveRoomId) {
      setError('You need a partner to use Live mode.')
      return
    }
    const newSession = uid()
    if (DEV) {
      console.log('[Photobooth] start', {
        mode,
        stripSize,
        quota: fresh.remaining,
        sessionId: newSession,
      })
    }
    setSessionId(newSession)
    setCaptures([])
    setPhase('camera')
  }

  const complete = (caps: Capture[]) => {
    if (DEV) console.log('[Photobooth] complete', { count: caps.length, expected: stripSize })
    if (caps.length !== stripSize) {
      setError(
        `Capture returned ${caps.length} of ${stripSize} photos. Please try again.`,
      )
      caps.forEach((c) => URL.revokeObjectURL(c.url))
      setCaptures([])
      setPhase('idle')
      return
    }
    setCaptures(caps)
    setPhase('review')
  }

  const cancel = () => {
    captures.forEach((c) => URL.revokeObjectURL(c.url))
    setCaptures([])
    setPhase('idle')
  }

  const save = async () => {
    if (!captures.length) return
    setSaving(true)
    setError(null)
    const ownerId = variant === 'app' ? user?.id ?? 'anonymous' : 'guest'
    const now = new Date().toISOString()
    const stored: StoredPhoto[] = captures.map((c) => ({
      id: uid(),
      sessionId,
      ownerId,
      createdAt: now,
      blob: c.blob,
      width: c.width,
      height: c.height,
    }))
    if (DEV) console.log('[Photobooth] saving', { sessionId, count: stored.length })
    try {
      await photoboothService.save(stored)
      const ok = consumePhotos(user?.id, captures.length)
      if (!ok && DEV) {
        console.warn(
          '[Photobooth] consumePhotos returned false — quota was exhausted by another tab',
        )
      }
      captures.forEach((c) => URL.revokeObjectURL(c.url))
      setCaptures([])
      setPhase('idle')
      setQuota(getQuota(user?.id))
      await reloadGallery()
    } catch (err) {
      if (DEV) console.error('[Photobooth] save error', err)
      setError('Could not save photos. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const removeSession = async (sid: string) => {
    await photoboothService.deleteSession(sid)
    await reloadGallery()
  }

  const targetCount = stripSize

  const modeHint = useMemo(() => {
    const base =
      mode === 'solo'
        ? 'Just you, on your own.'
        : mode === 'duo'
          ? 'You on the left, their photo on the right.'
          : 'You and your partner, side by side, live.'
    return `${base} Strip will have ${stripSize} photos.`
  }, [mode, stripSize])

  return (
    <div className="space-y-6">
      <div>
        <p className="label">Photobooth</p>
        <h2 className="font-script text-3xl text-rose">Capture a moment</h2>
        <p className="mt-2 text-sm text-muted">
          Photos stay on this device — nothing is uploaded or shared.
        </p>
      </div>

      {justUnlocked && (
        <div className="rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent-strong">
          Thank you! 10 more photos have been added to your allowance.
        </div>
      )}

      {error && (
        <div className="rounded-card border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-strong">
          {error}
        </div>
      )}

      <Card className="space-y-4">
        <div>
          <p className="label">Mode</p>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-field border border-line bg-cream p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id)
                  setError(null)
                  setPhase('idle')
                }}
                disabled={phase !== 'idle'}
                className={`rounded-[6px] px-2 py-2 text-center transition ${
                  mode === m.id
                    ? 'bg-primary text-cream'
                    : 'text-muted hover:text-ink'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="block font-sans text-[0.7rem] font-bold uppercase tracking-[0.14em]">
                  {m.label}
                </span>
                <span className="mt-0.5 block text-[10px] opacity-80">
                  {m.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Strip size</p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-field border border-line bg-cream p-1">
            {([3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStripSize(n)}
                disabled={phase !== 'idle'}
                className={`rounded-[6px] px-2 py-2 font-sans text-[0.72rem] font-bold uppercase tracking-[0.14em] transition ${
                  stripSize === n
                    ? 'bg-primary text-cream'
                    : 'text-muted hover:text-ink'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {n} photos
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{modeHint}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="label">Today</p>
            <p className="text-sm text-ink">
              {quota.remaining} of {quota.dailyLimit + quota.bonusPool} photos remaining
              {quota.bonusPool > 0 ? ` (incl. ${quota.bonusPool} bonus)` : ''}
            </p>
          </div>
          <Camera className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>

        {quota.remaining <= 0 && (
          <div className="space-y-3 rounded-field border border-dashed border-accent/40 bg-cream p-4 text-center">
            <p className="text-sm text-ink">You've used your photos for today.</p>
            <Link to="/donate/photobooth">
              <Button>Donate €10 for 10 more photos</Button>
            </Link>
          </div>
        )}

        {quota.remaining > 0 && quota.remaining < stripSize && (
          <div className="rounded-field border border-accent/40 bg-accent-soft p-3 text-xs text-accent-strong">
            You have {quota.remaining} photo{quota.remaining === 1 ? '' : 's'} left
            today — fewer than the {stripSize}-photo strip you've chosen.{' '}
            <Link to="/donate/photobooth" className="font-bold underline">
              Donate €10
            </Link>{' '}
            for 10 more.
          </div>
        )}

        {mode === 'duo' && phase === 'idle' && quota.remaining > 0 && (
          <PartnerSetup onReady={setPartnerPhotoUrl} />
        )}

        {phase === 'idle' && quota.remaining >= stripSize && (
          <div className="text-center">
            <Button onClick={start}>Open photobooth</Button>
            <p className="mt-2 text-xs text-muted">
              {stripSize} photo strip will use {stripSize} of today's allowance.
            </p>
          </div>
        )}

        {phase === 'camera' && mode === 'solo' && (
          <CameraStage
            targetCount={targetCount}
            onComplete={complete}
            onCancel={cancel}
          />
        )}

        {phase === 'camera' && mode === 'duo' && (
          <DuoStage
            partnerPhotoUrl={partnerPhotoUrl}
            targetCount={targetCount}
            onComplete={complete}
            onCancel={cancel}
          />
        )}

        {phase === 'camera' && mode === 'live' &&
          (liveRoomId ? (
            <LiveStage
              coupleId={liveRoomId}
              targetCount={targetCount}
              onComplete={complete}
              onCancel={cancel}
            />
          ) : (
            <div className="rounded-field border border-rose/40 bg-rose-soft px-3 py-2 text-xs text-rose-strong">
              You need a partner to use Live mode.
            </div>
          ))}

        {phase === 'review' && (
          <PhotoStrip
            captures={captures}
            saving={saving}
            onSave={save}
            onRetake={cancel}
          />
        )}
      </Card>

      <section className="space-y-3">
        <h3 className="label">Your saved strips</h3>
        <StripUploader
          onImported={() => {
            void reloadGallery()
          }}
        />
        <PhotoGallery sessions={sessions} onDelete={removeSession} />
      </section>

      <p className="text-center text-xs text-muted">
        These photos are stored only in this browser. Clearing browser data
        removes them permanently.
      </p>
    </div>
  )
}