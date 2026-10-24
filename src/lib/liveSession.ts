// @ts-ignore -- peerjs may be provided by the app runtime without installed typings.
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

function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'nh-'
  for (let i = 0; i < 6; i += 1) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return s
}

function waitOpen(peer: Peer): Promise<void> {
  return new Promise((resolve, reject) => {
    peer.once('open', () => resolve())
    peer.once('error', (err) =>
      reject(new Error(`Signaling failed: ${err.message}`)),
    )
  })
}

export async function startHost(
  localStream: MediaStream,
  handlers: LiveHandlers,
): Promise<LiveSession> {
  const code = generateRoomCode()
  const peer = new Peer(code, PEER_CONFIG)

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
    call.answer(localStream)
    mediaConn = call
    call.on('stream', (remote) => {
      handlers.onRemoteStream(remote)
      if (!connected) {
        connected = true
        handlers.onPeerConnected?.()
      }
    })
    call.on('close', () => handlers.onPeerDisconnected?.())
    call.on('error', (err) => handlers.onError(err.message))
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
  peer.on('error', (err) => handlers.onError(err.message))

  return {
    roomCode: code,
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
  hostCode: string,
  localStream: MediaStream,
  handlers: LiveHandlers,
): Promise<LiveSession> {
  const myId = `nh-guest-${Math.random().toString(36).slice(2, 10)}`
  const peer = new Peer(myId, PEER_CONFIG)

  try {
    await waitOpen(peer)
  } catch (err) {
    peer.destroy()
    throw err
  }

  const call = peer.call(hostCode, localStream)
  if (!call) {
    peer.destroy()
    throw new Error('Could not reach the other side. Check the room code.')
  }

  call.on('stream', (remote) => {
    handlers.onRemoteStream(remote)
    handlers.onPeerConnected?.()
  })
  call.on('close', () => handlers.onPeerDisconnected?.())
  call.on('error', (err) => handlers.onError(err.message))

  const dataConn = peer.connect(hostCode)
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
    roomCode: hostCode,
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