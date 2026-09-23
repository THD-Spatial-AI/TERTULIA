import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSessionUrl(slug: string): string {
  return `${window.location.origin}/session/${slug}`
}

/**
 * Only http(s) URLs are safe to hand to `window.location.href`. Rejects
 * `javascript:`, `data:`, and other schemes to prevent redirect-based XSS /
 * phishing. Returns the URL if safe, otherwise null.
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null
  } catch {
    return null
  }
}

/**
 * Redirect the whole session to Wildfire. The target is ALWAYS re-read from the
 * backend (authoritative, facilitator-owned) rather than trusted from a
 * Realtime broadcast payload — any participant can send on the broadcast
 * channel, so a spoofed `launch` event must not be able to choose the URL.
 */
export async function redirectToWildfire(slug: string): Promise<void> {
  const res = await fetch(`/api/v1/sessions/${slug}`)
  if (!res.ok) return
  const session = await res.json().catch(() => null)
  if (session?.phase !== 'launched') return
  const target = safeExternalUrl(session?.wildfire_url)
  if (!target) return
  // Carry the participant's session token across to the target app so the
  // feedback overlay can link submissions back to their pre-registered persona
  // (localStorage isn't shared across origins). Non-fatal if absent.
  const token = getStoredSessionToken()
  let href = target
  if (token) {
    const url = new URL(target)
    url.searchParams.set('tertulia_token', token)
    href = url.href
  }
  window.location.href = href
}

export function getStoredSessionToken(): string | null {
  return localStorage.getItem('workshop_session_token')
}

export function storeSessionToken(token: string): void {
  localStorage.setItem('workshop_session_token', token)
}

export function getStoredParticipant(): { display_name: string; role: string; org?: string } | null {
  const raw = localStorage.getItem('workshop_participant')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function storeParticipant(data: { display_name: string; role: string; org?: string }): void {
  localStorage.setItem('workshop_participant', JSON.stringify(data))
}
