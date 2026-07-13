import { supabase } from './supabase'
import { getStoredSessionToken } from './utils'

import { BACKEND_URL } from './config'

const BASE = BACKEND_URL

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('[api] request failed', res.status, path, body)
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
    console.error('[api] participant request failed', res.status, path, body)
    throw new Error(typeof body.detail === 'string' ? body.detail : `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}
