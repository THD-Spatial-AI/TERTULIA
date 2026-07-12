import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useLang } from '@/lib/i18n'
import { SessionLobby } from '@/features/session-lobby/SessionLobby'
import { ParticipantLobby } from '@/features/session-lobby/ParticipantLobby'
import { FacilitatorLogin } from '@/features/facilitator/FacilitatorLogin'
import { FacilitatorDashboard } from '@/features/facilitator/FacilitatorDashboard'
import { FacilitatorPanel } from '@/features/facilitator/FacilitatorPanel'
import { FacilitatorSettings } from '@/features/facilitator/FacilitatorSettings'
import { CreateSession } from '@/features/facilitator/CreateSession'
import { SlidesView } from '@/features/slides/SlidesView'
import { PersonaCard } from '@/features/persona-card/PersonaCard'
import { UserFlow } from '@/features/user-flow/UserFlow'
import { ProblemBoard } from '@/features/problem-board/ProblemBoard'
import { StakeholderMap } from '@/features/stakeholder-map/StakeholderMap'
import { LaunchScreen } from '@/features/launch/LaunchScreen'
import { NotFound } from '@/components/layout/NotFound'

function AppShell() {
  useLang()
  return (
    <Routes>
      {/* Redirect root to facilitator login */}
      <Route path="/" element={<Navigate to="/facilitator" replace />} />

      {/* Facilitator routes */}
      <Route path="/facilitator/login" element={<FacilitatorLogin />} />
      <Route path="/facilitator" element={<FacilitatorDashboard />} />
      <Route path="/facilitator/new" element={<CreateSession />} />
      <Route path="/facilitator/settings" element={<FacilitatorSettings />} />
      <Route path="/facilitator/session/:sessionId" element={<FacilitatorPanel />} />

      {/* Participant join — entry point via URL or QR */}
      <Route path="/session/:slug" element={<SessionLobby />} />
      <Route path="/session/:slug/lobby" element={<ParticipantLobby />} />
      <Route path="/session/:slug/slides" element={<SlidesView />} />
      <Route path="/session/:slug/persona" element={<PersonaCard />} />
      <Route path="/session/:slug/user-flow" element={<UserFlow />} />
      <Route path="/session/:slug/problem-board" element={<ProblemBoard />} />
      <Route path="/session/:slug/stakeholder-map" element={<StakeholderMap />} />
      <Route path="/session/:slug/launching" element={<LaunchScreen />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <AppShell />
    </BrowserRouter>
  )
}
