/**
 * Auth helpers for the Keycloak-backed facilitator session.
 * The Go auth service owns the OIDC flow; the browser only sees an opaque
 * session_id cookie — no tokens or keys reach the frontend.
 */

const AUTH_SERVICE_URL = (import.meta.env.VITE_AUTH_SERVICE_URL as string | undefined) ?? ''
const AUTH_REALM       = (import.meta.env.VITE_AUTH_REALM as string | undefined) ?? 'tertulia'

export function loginUrl(): string {
  const redirect = encodeURIComponent(`${window.location.origin}/facilitator`)
  return `${AUTH_SERVICE_URL}/login?realm=${AUTH_REALM}&redirect_uri=${redirect}`
}

export function logoutUrl(): string {
  const redirect = encodeURIComponent(`${window.location.origin}/facilitator/login`)
  return `${AUTH_SERVICE_URL}/logout?realm=${AUTH_REALM}&redirect_uri=${redirect}`
}

export async function getMe(): Promise<{ authenticated: boolean; email?: string; sub?: string } | null> {
  try {
    const res = await fetch('/api/v1/me', { credentials: 'include' })
    if (res.status === 401) return { authenticated: false }
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function signOut(): void {
  window.location.href = logoutUrl()
}
