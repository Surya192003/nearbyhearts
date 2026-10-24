import { wait } from '@/lib/latency'
import type { CallSession } from '@/types'

/**
 * MOCK CALL SERVICE. No real WebRTC is initiated. roomUrl is a placeholder
 * returned for future integration. Swap this for a real signaling endpoint
 * when WebRTC is ready — the shape of CallSession stays the same.
 */
export const callService = {
  async startCall(): Promise<CallSession> {
    await wait(600)
    return {
      id: `call_${Math.random().toString(36).slice(2, 8)}`,
      roomUrl: 'https://example.invalid/mock-room',
      partnerOnline: true,
      startedAt: new Date().toISOString(),
    }
  },

  async endCall(_id: string): Promise<void> {
    await wait(200)
  },
}