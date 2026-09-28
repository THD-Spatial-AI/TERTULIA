import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { redirectToWildfire } from './utils'
import type { SessionPhase } from '@/types'

export const PHASE_ROUTES: Record<SessionPhase, string> = {
  lobby: 'lobby',
  slides: 'slides',
  template_1: 'persona',
  template_2: 'user-flow',
  template_3: 'problem-board',
  template_4: 'stakeholder-map',
  launched: 'launching',
}

const WS_BASE = (() => {
  const backend = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? ''
  if (backend.startsWith('http')) return backend.replace(/^http/, 'ws')
  const { protocol, host } = window.location
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`
})()

interface ReactionEvent { kind: string; name: string }

interface UseWorkshopChannelOptions {
  /** Called when a reaction message arrives from any participant. */
  onReaction?: (event: ReactionEvent) => void
  /** When true, phase/launch navigation events are not processed (facilitator view). */
  passive?: boolean
}

/**
 * Subscribes to the session control channel via a native WebSocket.
 * Automatically navigates on phase/launch events (unless `passive: true`).
 * Returns a `sendMessage` helper to send data back through the socket.
 */
export function useWorkshopChannel(
  slug: string | undefined,
  options: UseWorkshopChannelOptions = {},
) {
  const { onReaction, passive = false } = options
  const navigate = useNavigate()
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const onReactionRef = useRef(onReaction)
  onReactionRef.current = onReaction

  useEffect(() => {
    if (!slug) return

    let reconnectTimer: ReturnType<typeof setTimeout>
    let disposed = false

    function connect() {
      const ws = new WebSocket(`${WS_BASE}/api/v1/ws/sessions/${slug}`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (event) => {
        let payload: { type?: string; phase?: SessionPhase; message?: string; kind?: string; name?: string }
        try { payload = JSON.parse(event.data) } catch { return }

        if (!passive) {
          if (payload.type === 'phase' && payload.phase)
            navigate(`/session/${slug}/${PHASE_ROUTES[payload.phase]}`, { replace: true })
          if (payload.type === 'launch' && slug)
            void redirectToWildfire(slug)
        }
        if (payload.type === 'broadcast' && payload.message)
          setBroadcastMessage(payload.message)
        if (payload.type === 'reaction' && payload.kind && payload.name)
          onReactionRef.current?.({ kind: payload.kind, name: payload.name })
      }

      ws.onclose = () => {
        setConnected(false)
        // onclose also fires after our own cleanup closes the socket; don't resurrect it.
        if (!disposed) reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [slug, navigate, passive])

  const sendMessage = useCallback((msg: object) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
  }, [])

  return {
    broadcastMessage,
    connected,
    dismissBroadcast: () => setBroadcastMessage(null),
    sendMessage,
  }
}
