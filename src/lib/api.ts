const raw = import.meta.env.VITE_API_URL 
export const API_BASE_URL = raw.replace(/\/+$/, '')


export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function handle<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, `${label}: ${detail}`)
  }
  return res.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include' })
  return handle<T>(res, `GET ${path}`)
}

export async function apiGetOptional<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include' })
  if (res.status === 401) return null
  return handle<T>(res, `GET ${path}`)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return handle<T>(res, `POST ${path}`)
}

export async function apiPostNoContent(path: string, body?: unknown): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  await handle<unknown>(res, `POST ${path}`)
}

export type BackendHealth = { ok: boolean; db: boolean; time: string }

export async function pingBackend(): Promise<BackendHealth | null> {
  try {
    return await apiGet<BackendHealth>('/health')
  } catch {
    return null
  }
}