import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { makeComposite } from '@/lib/composite'
import type { Capture } from '@/lib/photoDb'

type Props = {
  partnerPhotoUrl: string
  targetCount: number
  onComplete: (captures: Capture[]) => void
  onCancel: () => void
}

const DEV = import.meta.env.DEV

export function DuoStage({
  partnerPhotoUrl,
  targetCount,
  onComplete,
  onCancel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const partnerImgRef = useRef<HTMLImageElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState<Capture[]>([])
  const [running, setRunning] = useState(false)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          void videoRef.current.play().catch(() => {})
          setReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Camera unavailable or permission denied.')
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const ensureVideoLive = async (): Promise<void> => {
    const v = videoRef.current
    if (!v) throw new Error('Video element missing')
    if (!v.srcObject && streamRef.current) {
      v.srcObject = streamRef.current
    }
    if (v.paused) {
      await v.play().catch(() => {})
    }
    if (!v.videoWidth || !v.videoHeight) {
      // Give the browser a moment to produce the first frame
      await new Promise((r) => setTimeout(r, 250))
    }
    if (!v.videoWidth || !v.videoHeight) {
      throw new Error('Camera frame not available')
    }
  }

  const runSession = async () => {
    if (running) return
    if (targetCount <= 0) {
      setError('Nothing to capture.')
      return
    }
    if (!videoRef.current || !partnerImgRef.current) {
      setError('Camera or partner photo not ready.')
      return
    }

    if (DEV) console.log('[Duo] runSession', { targetCount })

    setRunning(true)
    setError(null)
    setShots([])
    setProgress('')

    const results: Capture[] = []
    try {
      for (let i = 0; i < targetCount; i += 1) {
        setProgress(`Shot ${i + 1} of ${targetCount}`)

        for (let c = 3; c >= 1; c -= 1) {
          setCountdown(c)
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 800))
        }
        setCountdown(null)

        // eslint-disable-next-line no-await-in-loop
        await ensureVideoLive()

        setFlash(true)
        // eslint-disable-next-line no-await-in-loop
        const cap = await makeComposite(
          videoRef.current,
          partnerImgRef.current,
        )
        results.push(cap)
        setShots((prev) => [...prev, cap])
        if (DEV) console.log('[Duo] captured', { shot: i + 1, of: targetCount })

        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 260))
        setFlash(false)
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 520))
      }

      if (results.length !== targetCount) {
        throw new Error(
          `Only captured ${results.length} of ${targetCount} — please try again.`,
        )
      }
      if (DEV) console.log('[Duo] complete', { captured: results.length })
      onComplete(results)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Capture failed'
      if (DEV) console.error('[Duo] capture error', err)
      setError(msg)
      results.forEach((r) => URL.revokeObjectURL(r.url))
    } finally {
      setRunning(false)
      setCountdown(null)
      setFlash(false)
      setProgress('')
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-card border border-rose/40 bg-rose-soft p-3 text-sm text-rose-strong">
          {error}
        </div>
      )}

      <div className="relative grid grid-cols-2 gap-2">
        <div className="relative aspect-square overflow-hidden rounded-field bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />
          <span className="absolute bottom-1 left-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
            You
          </span>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-field bg-cream">
          <img
            ref={partnerImgRef}
            src={partnerPhotoUrl}
            alt="Your partner"
            className="h-full w-full object-cover"
            onLoad={() => setReady(true)}
          />
          <span className="absolute bottom-1 left-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
            Partner
          </span>
        </div>

        {countdown !== null && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="font-sans text-8xl font-bold text-white">
              {countdown}
            </span>
          </div>
        )}
        {flash && <div className="animate-flash absolute inset-0 bg-white" />}
      </div>

      {progress && (
        <p className="text-center font-sans text-xs uppercase tracking-[0.16em] text-muted">
          {progress}
        </p>
      )}

      {shots.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shots.map((s) => (
            <img
              key={s.url}
              src={s.url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-field object-cover ring-1 ring-line"
            />
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2">
        {!running ? (
          <Button onClick={() => void runSession()} disabled={!ready}>
            Start ({targetCount} shot{targetCount === 1 ? '' : 's'})
          </Button>
        ) : (
          <span className="grid h-11 place-items-center font-sans text-xs uppercase tracking-[0.16em] text-muted">
            Capturing…
          </span>
        )}
        <Button variant="ghost" onClick={onCancel} disabled={running}>
          Cancel
        </Button>
      </div>
    </div>
  )
}