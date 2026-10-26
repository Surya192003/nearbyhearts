import Peer, {
  type DataConnection,
  type MediaConnection,
  type PeerJSOption,
} from 'peerjs'

const PEER_CONFIG: PeerJSOption = {
  host: import.meta.env.VITE_PEER_HOST ?? '0.peerjs.com',
  port: Number(import.meta.env.VITE_PEER_PORT ?? 443),
  secure: (import.meta.env.VITE_PEER_SECURE ?? 'true') === 'true',
  path: import.meta.env.VITE_PEER_PATH ?? '/',
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    iceCandidatePoolSize: 4,
  },
  debug: 1,
}

export type LiveHandlers = {
  onRemoteStream: (stream: MediaStream) => void
  onRemoteCapture: () => void
  onPeerConnected?: () => void
  onPeerDisconnected?: () => void
  onError: (msg: string) => void
}

export type LiveSession = {
  roomCode: string
  stop: () => void
  triggerCapture: () => void
}

const CAPTURE_MSG = { type: 'capture' as const }

function isCaptureMessage(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as { type: unknown }).type === 'capture'
  )
}

function waitOpen(peer: Peer): Promise<void> {
  return new Promise((resolve, reject) => {
    peer.once('open', () => resolve())
    peer.once('error', (err) =>
      reject(new Error(`Signaling failed: ${err.message}`)),
    )
  })
}

function isTransientError(msg: string): boolean {
  return (
    msg.includes('peer-unavailable') ||
    msg.includes('Could not connect to peer') ||
    msg.includes('network')
  )
}

export async function startHost(
  roomCode: string,
  localStream: MediaStream,
  handlers: LiveHandlers,
): Promise<LiveSession> {
  const peer = new Peer(roomCode, PEER_CONFIG)

  try {
    await waitOpen(peer)
  } catch (err) {
    peer.destroy()
    throw err
  }

  let mediaConn: MediaConnection | null = null
  let dataConn: DataConnection | null = null
  let connected = false

  peer.on('call', (call) => {
    mediaConn = call

    call.on('stream', (remote) => {
      if (import.meta.env.DEV) {
        console.info(
          '[live:host] remote stream received',
          remote.getVideoTracks().length,
          'video',
          remote.getAudioTracks().length,
          'audio',
        )
      }
      handlers.onRemoteStream(remote)
      if (!connected) {
        connected = true
        handlers.onPeerConnected?.()
      }
    })
    call.on('close', () => handlers.onPeerDisconnected?.())
    call.on('error', (err) => handlers.onError(err.message))

    call.answer(localStream)
  })

  peer.on('connection', (conn) => {
    dataConn = conn
    conn.on('data', (data) => {
      if (isCaptureMessage(data)) handlers.onRemoteCapture()
    })
    conn.on('close', () => handlers.onPeerDisconnected?.())
    conn.on('error', (err) => handlers.onError(err.message))
  })

  peer.on('disconnected', () => handlers.onPeerDisconnected?.())
  peer.on('error', (err) => {
    if (isTransientError(err.message)) return
    handlers.onError(err.message)
  })

  return {
    roomCode,
    stop: () => {
      mediaConn?.close()
      dataConn?.close()
      peer.destroy()
    },
    triggerCapture: () => {
      dataConn?.send(CAPTURE_MSG)
    },
  }
}

export async function joinRoom(
  roomCode: string,
  localStream: MediaStream,
  handlers: LiveHandlers,
): Promise<LiveSession> {
  const myId = `${roomCode}-guest-${Math.random().toString(36).slice(2, 8)}`
  const peer = new Peer(myId, PEER_CONFIG)

  try {
    await waitOpen(peer)
  } catch (err) {
    peer.destroy()
    throw err
  }

  const call = peer.call(roomCode, localStream)
  if (!call) {
    peer.destroy()
    throw new Error('Could not reach the other side.')
  }

  call.on('stream', (remote) => {
    if (import.meta.env.DEV) {
      console.info(
        '[live:guest] remote stream received',
        remote.getVideoTracks().length,
        'video',
        remote.getAudioTracks().length,
        'audio',
      )
    }
    handlers.onRemoteStream(remote)
    handlers.onPeerConnected?.()
  })
  call.on('close', () => handlers.onPeerDisconnected?.())
  call.on('error', (err) => handlers.onError(err.message))

  const dataConn = peer.connect(roomCode)
  await new Promise<void>((resolve, reject) => {
    dataConn.once('open', () => resolve())
    dataConn.once('error', (err) =>
      reject(new Error(`Data channel failed: ${err.message}`)),
    )
  })
  dataConn.on('data', (data) => {
    if (isCaptureMessage(data)) handlers.onRemoteCapture()
  })
  dataConn.on('close', () => handlers.onPeerDisconnected?.())
  dataConn.on('error', (err) => handlers.onError(err.message))

  return {
    roomCode,
    stop: () => {
      call.close()
      dataConn.close()
      peer.destroy()
    },
    triggerCapture: () => {
      dataConn.send(CAPTURE_MSG)
    },
  }
}

export function coupleRoomCode(coupleId: string): string {
  // Deterministic 8-char prefix from the couple UUID.
  // Both partners derive the same code, so no sharing needed.
  return `nh-${coupleId.replace(/-/g, '').slice(0, 10).toLowerCase()}`
}