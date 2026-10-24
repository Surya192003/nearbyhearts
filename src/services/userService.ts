import { apiPost } from '@/lib/api'

type UpdatePayload = {
  city?: string
  state?: string | null
  country?: string
  timezone?: string
}

type UpdateResult = {
  ok: boolean
  geocoded: boolean
  geocodeError?: string
}

export const userService = {
  async updateMe(payload: UpdatePayload): Promise<UpdateResult> {
    // PATCH helper — inline since api.ts only has GET/POST
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/users/me`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      },
    )
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}))
      throw new Error(
        (detail as { error?: string }).error ?? `Update failed: ${res.status}`,
      )
    }
    return res.json() as Promise<UpdateResult>
  },
}

// Silence unused-import lint if apiPost isn't used — remove if not needed
void apiPost