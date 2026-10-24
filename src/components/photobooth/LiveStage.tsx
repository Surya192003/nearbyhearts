import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { makeComposite } from '@/lib/composite'
import type { Capture } from '@/lib/photoDb'
import {
  joinRoom,
  startHost,
  type LiveHandlers,
  type LiveSession,
} from '@/lib/liveSession'

type Props = {
  targetCount: number
  onComplete: (captures: Capture[]) => void
  onCancel: () => void
}

type Phase =
  | 'pick'
  | 'creating'
  | 'showing-code'
  | 'joining'
  | 'connected'

export function LiveStage({ targetCount, onComplete, onCancel }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const sessionRef = useRef<LiveSession | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<Phase>('pick')
  const [joinCode, setJoinCode] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [peerName, setPeerName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState<Capture[]>([])
  const [capturing, setCapturing] = useState(false)
  const [captures, setCaptures] = useState<Capture[]>([])

  const captureRef = useRef<() => Promise<void>>(async () => {})

  const cleanup = () => {
    sessionRef.current?.stop()
    sessionRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setRemoteStream(null)
  }

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      void remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream])

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
      void localVideoRef.current.play().catch(() => {})
    }
  })

  const runCapture = async () => {
    if (capturing) return
    if (!localVideoRef.current || !remoteVideoRef.current) return
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

  const requestLocalStream = async (): Promise<MediaStream> => {
    if (localStreamRef.current) return localStreamRef.current
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true,
    })
    localStreamRef.current = stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
      void localVideoRef.current.play().catch(() => {})
    }
    return stream
  }

  const handlers: LiveHandlers = {
    onRemoteStream: (stream) => {
      setRemoteStream(stream)
      setPeerName('Partner')
      setPhase('connected')
    },
    onRemoteCapture: () => {
      void captureRef.current()
    },
    onPeerConnected: () => setPhase('connected'),
    onPeerDisconnected: () => {
      setPeerName(null)
      setRemoteStream(null)
      setPhase('pick')
      setError('Your partner disconnected.')
    },
    onError: (msg) => setError(msg),
  }

  const host = async () => {
    setBusy(true)
    setError(null)
    try {
      const stream = await requestLocalStream()
      const session = await startHost(stream, handlers)
      sessionRef.current = session
      setRoomCode(session.roomCode)
      setPhase('showing-code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the room.')
    } finally {
      setBusy(false)
    }
  }

  const join = async () => {
    if (!joinCode.trim()) {
      setError('Enter a room code first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const stream = await requestLocalStream()
      const session = await joinRoom(joinCode.trim(), stream, handlers)
      sessionRef.current = session
      setRoomCode(joinCode.trim())
      setPhase('joining')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join that room.')
    } finally {
      setBusy(false)
    }
  }

  const trigger = () => {
    sessionRef.current?.triggerCapture()
    void captureRef.current()
  }

  const endLive = () => {
    cleanup()
    setPhase('pick')
    setRoomCode('')
    setRemoteStream(null)
    setShots([])
    setCaptures([])
  }

  const finish = () => {
    if (captures.length) {
      onComplete(captures)
    }
  }

  const close = () => {
    captures.forEach((c) => URL.revokeObjectURL(c.url))
    shots.forEach((c) => URL.revokeObjectURL(c.url))
    endLive()
    onCancel()
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-card border border-rose/40 bg-rose-soft p-3 text-sm text-rose-strong">
          {error}
        </div>
      )}

      {phase === 'pick' && (
        <div className="space-y-3">
          <div className="rounded-card border border-line bg-cream p-4">
            <p className="label">Live split</p>
            <p className="text-sm text-muted">
              You'll see each other side by side. Video flows directly between
              your devices — nothing is stored on a server.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => void host()} loading={busy}>
              Create room
            </Button>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="nh-ABC123"
                className="flex-1 rounded-field border border-line bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              />
              <Button variant="outline" onClick={() => void join()} loading={busy}>
                Join
              </Button>
            </div>
          </div>

          <Button variant="ghost" className="w-full" onClick={close}>
            Cancel
          </Button>
        </div>
      )}

      {(phase === 'showing-code' || phase === 'creating') && (
        <div className="space-y-3 text-center">
          <p className="label">Share this code with your partner</p>
          <p className="font-mono text-3xl font-bold tracking-[0.2em] text-rose">{roomCode}</p>
          <p className="text-xs text-muted">Waiting for them to join…</p>
          <Button variant="ghost" onClick={endLive}>
            Cancel
          </Button>
        </div>
      )}

      {phase === 'joining' && (
        <div className="space-y-3 text-center">
          <p className="label">Connecting…</p>
          <p className="text-xs text-muted">Calling room {roomCode}</p>
          <Button variant="ghost" onClick={endLive}>
            Cancel
          </Button>
        </div>
      )}

      {phase === 'connected' && (
        <>
          <div className="relative grid grid-cols-2 gap-2">
            <div className="relative aspect-square overflow-hidden rounded-field bg-black">
              <video
                ref={localVideoRef}
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
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
                {peerName ?? 'Partner'}
              </span>
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
              <Button onClick={trigger} disabled={capturing || !remoteStream}>
                {capturing ? 'Capturing…' : `Start (${targetCount} shots)`}
              </Button>
            ) : (
              <Button onClick={finish}>Continue to review</Button>
            )}
            <Button variant="ghost" onClick={endLive} disabled={capturing}>
              End live
            </Button>
          </div>

          <p className="text-center text-xs text-muted">
            Your partner sees the same countdown, so both sides capture the same moment.
          </p>
        </>
      )}
    </div>
  )
}