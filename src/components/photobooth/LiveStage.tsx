import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { makeComposite } from '@/lib/composite'
import type { Capture } from '@/lib/photoDb'
import {
  coupleRoomCode,
  joinRoom,
  startHost,
  type LiveHandlers,
  type LiveSession,
} from '@/lib/liveSession'

type Props = {
  coupleId: string
  targetCount: number
  onComplete: (captures: Capture[]) => void
  onCancel: () => void
}

type Phase = 'starting' | 'connected' | 'error'

const DEV = import.meta.env.DEV

export function LiveStage({ coupleId, targetCount, onComplete, onCancel }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const sessionRef = useRef<LiveSession | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const captureRef = useRef<() => Promise<void>>(async () => {})

  const [phase, setPhase] = useState<Phase>('starting')
  const [error, setError] = useState<string | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState<Capture[]>([])
  const [capturing, setCapturing] = useState(false)
  const [captures, setCaptures] = useState<Capture[]>([])

  const roomCode = coupleRoomCode(coupleId)

  const cleanup = () => {
    sessionRef.current?.stop()
    sessionRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setRemoteStream(null)
  }

  useEffect(() => {
    return () => { cleanup() }
  }, [])

  useEffect(() => {
    const el = localVideoRef.current
    const stream = localStreamRef.current
    if (!el || !stream) return
    if (el.srcObject !== stream) el.srcObject = stream
    if (el.paused) void el.play().catch(() => {})
  })

  useEffect(() => {
    const el = remoteVideoRef.current
    if (!el || !remoteStream) return
    if (el.srcObject !== remoteStream) {
      if (DEV) console.info('[live] remote srcObject attached')
      el.srcObject = remoteStream
    }
    if (el.paused) void el.play().catch(() => {})
  })

  const runCapture = async () => {
    if (capturing || !localVideoRef.current || !remoteVideoRef.current) return
    setCapturing(true)
    setError(null)
    const results: Capture[] = []
    try {
      for (let i = 0; i < targetCount; i += 1) {
        for (let c = 3; c >= 1; c -= 1) {
          setCountdown(c)
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 800))
        }
        setCountdown(null)
        setFlash(true)
        // eslint-disable-next-line no-await-in-loop
        const cap = await makeComposite(localVideoRef.current, remoteVideoRef.current)
        results.push(cap)
        setShots((prev) => [...prev, cap])
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 260))
        setFlash(false)
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 520))
      }
      setCaptures(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed')
      results.forEach((r) => URL.revokeObjectURL(r.url))
    } finally {
      setCapturing(false)
      setCountdown(null)
      setFlash(false)
    }
  }
  captureRef.current = runCapture

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          void localVideoRef.current.play().catch(() => {})
        }

        const handlers: LiveHandlers = {
          onRemoteStream: (remote) => {
            setRemoteStream(remote)
            setPhase('connected')
          },
          onRemoteCapture: () => { void captureRef.current() },
          onPeerConnected: () => setPhase('connected'),
          onPeerDisconnected: () => {
            setRemoteStream(null)
            setPhase('starting')
            setError('Your partner disconnected. Waiting for them to return…')
          },
          onError: (msg) => setError(msg),
        }

        // Try host first. If ID is taken, the other side is already host —
        // fall back to guest.
        try {
          sessionRef.current = await startHost(roomCode, stream, handlers)
          if (DEV) console.info('[live] started as host', roomCode)
        } catch (err) {
          if (DEV) console.info('[live] host failed, trying guest', err)
          sessionRef.current = await joinRoom(roomCode, stream, handlers)
          if (DEV) console.info('[live] joined as guest', roomCode)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not start live session')
          setPhase('error')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [roomCode])

  const finish = () => {
    if (captures.length) onComplete(captures)
  }

  const close = () => {
    captures.forEach((c) => URL.revokeObjectURL(c.url))
    shots.forEach((c) => URL.revokeObjectURL(c.url))
    cleanup()
    onCancel()
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-card border border-rose/40 bg-rose-soft p-3 text-sm text-rose-strong">
          {error}
        </div>
      )}

      <div className="text-center text-xs text-muted">
        Room: <span className="font-mono">{roomCode}</span> ·{' '}
        {phase === 'connected' ? 'Connected' : 'Waiting for your partner…'}
      </div>

      <div className="relative grid grid-cols-2 gap-2">
        <div className="relative aspect-square overflow-hidden rounded-field bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />
          <span className="absolute bottom-1 left-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
            You
          </span>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-field bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <span className="absolute bottom-1 left-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
            Partner
          </span>
          {!remoteStream && (
            <div className="absolute inset-0 grid place-items-center bg-black/60 text-center text-[10px] text-white/80">
              Waiting for partner's camera…
            </div>
          )}
        </div>

        {countdown !== null && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="font-sans text-8xl font-bold text-white">{countdown}</span>
          </div>
        )}
        {flash && <div className="animate-flash absolute inset-0 bg-white" />}
      </div>

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

      <div className="flex flex-wrap justify-center gap-2">
        {captures.length === 0 ? (
          <Button onClick={() => void captureRef.current()} disabled={capturing || !remoteStream}>
            {capturing ? 'Capturing…' : `Start (${targetCount} shots)`}
          </Button>
        ) : (
          <Button onClick={finish}>Continue to review</Button>
        )}
        <Button variant="ghost" onClick={close} disabled={capturing}>
          Cancel
        </Button>
      </div>
    </div>
  )
}