import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Realtime channel helpers ──────────────────────────────────────────────────

export function controlChannel(sessionId: string) {
  return supabase.channel(`session:${sessionId}:control`)
}

export function presenceChannel(sessionId: string) {
  return supabase.channel(`session:${sessionId}:presence`)
}

export function reactionsChannel(sessionId: string) {
  return supabase.channel(`session:${sessionId}:reactions`)
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/facilitator`,
    },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback)
}
