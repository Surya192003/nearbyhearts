import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Pill'
import { formatDistance, timeAgo } from '@/lib/format'
import {
  joinRoom,
  startHost,
  type LiveHandlers,
  type LiveSession,
} from '@/lib/liveSession'
import { useAuthStore } from '@/store/authStore'
import { useCountdownStore } from '@/store/countdownStore'

type Phase = 'pick' | 'hosting' | 'joining' | 'connected'

const DEV = import.meta.env.DEV

// Room code for the manual flow. Uppercase to match the join input's
// `.toUpperCase()` behavior, so both sides always match.
function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'NH-'
  for (let i = 0; i < 6; i += 1) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return s
}

export function VideoCallPage() {
  const user = useAuthStore((s) => s.user)
  const partner = user?.partner
  const coupleDistanceKm = useCountdownStore((s) => s.distanceKm)
  const loadCountdown = useCountdownStore((s) => s.load)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef<LiveSession | null>(null)

  const [phase, setPhase] = useState<Phase>('pick')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [copied, setCopied] = useState(false)

  const isPaired = Boolean(user?.couple && user.partner)

  // Distance comes from the couple row (set via /app/settings → couple details).
  const liveKm = coupleDistanceKm

  useEffect(() => {
    void loadCountdown()
  }, [loadCountdown])

  // Attach local stream on every render — idempotent, catches late-mounted
  // <video> elements (e.g. when phase transitions from pick → hosting).
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
    if (el.srcObject !== remoteStream) el.srcObject = remoteStream
    if (el.paused) void el.play().catch(() => {})
  }, [remoteStream])

  useEffect(() => {
    return () => {
      sessionRef.current?.stop()
      sessionRef.current = null
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
  }, [])

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
      setPhase('connected')
    },
    onRemoteCapture: () => {
      /* capture is photobooth-only, not used in video calls */
    },
    onPeerConnected: () => setPhase('connected'),
    onPeerDisconnected: () => {
      setRemoteStream(null)
      setPhase('pick')
      setError('Your partner disconnected.')
    },
    onError: (msg) => {
      setError(msg)
      if (DEV) console.error('[VideoCall] peer error', msg)
    },
  }

  const host = async () => {
    setBusy(true)
    setError(null)
    try {
      const stream = await requestLocalStream()
      const code = generateRoomCode()
      const session = await startHost(code, stream, handlers)
      sessionRef.current = session
      setRoomCode(session.roomCode)
      setPhase('hosting')
      if (DEV) console.info('[VideoCall] hosting room', session.roomCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the room.')
    } finally {
      setBusy(false)
    }
  }

  const join = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) {
      setError('Enter a room code first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const stream = await requestLocalStream()
      const session = await joinRoom(code, stream, handlers)
      sessionRef.current = session
      setRoomCode(code)
      setPhase('joining')
      if (DEV) console.info('[VideoCall] joining room', code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join that room.')
    } finally {
      setBusy(false)
    }
  }

  const end = () => {
    sessionRef.current?.stop()
    sessionRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setRemoteStream(null)
    setPhase('pick')
    setRoomCode('')
    setJoinCode('')
    setError(null)
    setMicOn(true)
    setCamOn(true)
  }

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMicOn(track.enabled)
  }

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCamOn(track.enabled)
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked */
    }
  }

  if (!user) return null

  if (!isPaired) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Video call</h2>
        <EmptyState
          emoji="📹"
          title="Pair first to call"
          hint="Find your partner's code in /app/pair."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Video call</h2>

      {error && (
        <div className="rounded-card border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-strong">
          {error}
        </div>
      )}

      {phase === 'pick' && (
        <Card className="space-y-5 text-center">
          <div className="mx-auto w-fit">
            <Avatar
              name={partner ? `${partner.firstName} ${partner.lastName}` : 'Partner'}
              size="lg"
            />
          </div>

          <div>
            <p className="text-base font-semibold">
              {partner?.firstName ?? 'Your person'}
            </p>
            <p className="text-xs text-muted">
              {partner?.city}
              {liveKm != null ? ` · ${formatDistance(liveKm)} away` : ''}
            </p>
            <p className="mt-1 text-xs text-muted">
              {partner ? `Last seen ${timeAgo(partner.lastSeenAt)}` : 'Waiting…'}
            </p>
          </div>

          <div className="flex justify-center gap-2">
            <Pill tone="forest">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Ready to call
            </Pill>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => void host()}
              loading={busy}
              icon={<Phone className="h-4 w-4" />}
              className="w-full"
            >
              Start a call
            </Button>

            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="NH-ABC123"
                className="flex-1 rounded-field border border-line bg-surface px-3 py-2 font-mono text-sm uppercase outline-none focus:border-accent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void join()
                }}
              />
              <Button variant="outline" onClick={() => void join()} loading={busy}>
                Join
              </Button>
            </div>
            <p className="text-xs text-muted">
              Video flows directly between your devices over the internet — no
              server records or stores it.
            </p>
          </div>
        </Card>
      )}

      {(phase === 'hosting' || phase === 'joining') && (
        <Card className="space-y-4 text-center">
          {phase === 'hosting' ? (
            <>
              <p className="label">Share this code with your partner</p>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="mx-auto flex items-center gap-2 rounded-field border border-accent/40 bg-cream px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em] text-rose hover:bg-accent-soft"
              >
                {roomCode}
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4 text-muted" />
                )}
              </button>
              <p className="text-xs text-muted">
                They open this page and paste the code in "Join". Waiting…
              </p>
            </>
          ) : (
            <>
              <p className="label">Connecting…</p>
              <p className="text-sm text-muted">Calling room {roomCode}</p>
            </>
          )}

          <div className="relative aspect-video w-full overflow-hidden rounded-card bg-black">
            <video
              ref={localVideoRef}
              playsInline
              autoPlay
              muted
              className="h-full w-full scale-x-[-1] object-cover"
            />
            <span className="absolute bottom-1 left-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
              You
            </span>
          </div>

          <Button variant="outline" onClick={end}>
            Cancel
          </Button>
        </Card>
      )}

      {phase === 'connected' && (
        <Card className="space-y-4 p-0">
          <div className="relative aspect-video overflow-hidden rounded-t-card bg-black">
            <video
              ref={remoteVideoRef}
              playsInline
              autoPlay
              muted
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded-pill bg-black/60 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              {partner?.firstName ?? 'Partner'}
            </span>
            <div className="absolute right-2 top-2 h-24 w-32 overflow-hidden rounded-field bg-black ring-1 ring-white/20 sm:h-32 sm:w-44">
              <video
                ref={localVideoRef}
                playsInline
                autoPlay
                muted
                className="h-full w-full scale-x-[-1] object-cover"
              />
              <span className="absolute bottom-1 left-1 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-white/80">
                You
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pb-5">
            <button
              type="button"
              onClick={toggleMic}
              className={`grid h-12 w-12 place-items-center rounded-full transition ${
                micOn
                  ? 'bg-cream text-ink hover:bg-accent-soft'
                  : 'bg-rose-soft text-rose-strong hover:bg-rose/20'
              }`}
              aria-label={micOn ? 'Mute' : 'Unmute'}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={toggleCam}
              className={`grid h-12 w-12 place-items-center rounded-full transition ${
                camOn
                  ? 'bg-cream text-ink hover:bg-accent-soft'
                  : 'bg-rose-soft text-rose-strong hover:bg-rose/20'
              }`}
              aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={end}
              className="grid h-14 w-14 place-items-center rounded-full bg-rose text-cream shadow-lift transition hover:bg-rose-strong"
              aria-label="End call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}