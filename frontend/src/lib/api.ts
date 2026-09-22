import { getStoredSessionToken } from './utils'

const BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? ''

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body.detail === 'string'
        ? body.detail
        : body.detail
          ? JSON.stringify(body.detail)
          : `HTTP ${res.status}`,
    )
  }
  return res.json() as Promise<T>
}

export async function participantFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredSessionToken()
  if (!token) throw new Error('No session token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': token,
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(typeof body.detail === 'string' ? body.detail : `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}
