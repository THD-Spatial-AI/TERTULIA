/**
 * Auth helpers for the Keycloak-backed facilitator session.
 *
 * The Go auth service owns the OIDC/token flow; the browser only ever holds an
 * opaque `session_id` cookie — no tokens or keys reach the frontend. Login is a
 * direct email/password grant (POST /api/login on the auth service).
 *
 * The auth service is reached SAME-ORIGIN via the nginx proxy at `/authsvc/*`
 * (see frontend/nginx.conf), so there is no CORS and the session cookie is a
 * first-party cookie for this origin.
 */

const AUTH_BASE = '/authsvc' // nginx proxies /authsvc/ -> auth-service /api/

export async function login(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) return { ok: true }
    let error = 'Invalid email or password.'
    try {
      const body = await res.json()
      error = body.message || body.error || body.detail || error
    } catch {
      /* non-JSON error body */
    }
    return { ok: false, error }
  } catch {
    return { ok: false, error: 'Authentication service is unreachable.' }
  }
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
  void fetch(`${AUTH_BASE}/logout`, { method: 'POST', credentials: 'include' })
    .catch(() => {})
    .finally(() => {
      window.location.href = '/facilitator/login'
    })
}
