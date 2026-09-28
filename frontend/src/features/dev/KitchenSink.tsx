// Dev-only catalogue of UI primitives in every state. Mounted at /dev/kitchen-sink when import.meta.env.DEV.
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Field } from '@/components/ui/Field'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel'
import { Status } from '@/components/ui/Status'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { Avatar } from '@/components/ui/Avatar'
import { DossierPile, DossierStack } from '@/components/ui/DossierStack'
import type { Activity } from '@/lib/dossier'

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-8">
      <h2 className="mb-5 text-heading font-semibold">{title}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  )
}

export default function KitchenSink() {
  const [done, setDone] = useState<Activity[]>(['persona'])
  const [landing, setLanding] = useState<Activity>()
  const [handoff, setHandoff] = useState(false)

  function addNext() {
    const order: Activity[] = ['persona', 'user-flow', 'problem-board', 'stakeholder-map']
    const next = order.find(a => !done.includes(a))
    if (!next) return
    setDone([...done, next])
    setLanding(next)
  }

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-display">A table for everyone</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Instrument Serif for the voice, Geist for the work. Paper, ink and one clay accent.
      </p>
      <p className="mt-2 font-mono text-meta text-ink-subtle">wildfire-stakeholders-2026</p>

      <Row title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Saving…</Button>
        <Button disabled>Disabled</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </Row>

      <Row title="Fields">
        <div className="grid w-full gap-6 sm:grid-cols-2">
          <Field label="Name"><Input placeholder="e.g. Ana García…" autoComplete="name" /></Field>
          <Field label="Organisation" optional hint="Shown to the facilitator only."><Input placeholder="e.g. Bomberos de Ourense…" /></Field>
          <Field label="Workshop tag" error="Use lowercase letters, numbers and dashes."><Input defaultValue="Wildfire 2026!" /></Field>
          <Field label="Disabled"><Input disabled defaultValue="Read only" /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea placeholder="What would you change first…" /></Field>
        </div>
      </Row>

      <Row title="Status">
        <Status tone="idle">Not started</Status>
        <Status tone="live">Persona</Status>
        <Status tone="done">Launched</Status>
        <Status tone="warning">Reconnecting…</Status>
        <Status tone="danger">Offline</Status>
      </Row>

      <Row title="Avatar, spinner, confirm">
        <Avatar name="Ana García" size="sm" />
        <Avatar name="Ricardo Miranda" />
        <Avatar name="Xoán" size="lg" />
        <Spinner />
        <ConfirmButton onConfirm={() => {}} confirmLabel="Remove?">Remove</ConfirmButton>
      </Row>

      <Row title="Panel">
        <Panel className="w-full">
          <PanelHeader title="Session links" description="Share with participants." action={<Button size="sm" variant="secondary">Copy</Button>} />
          <PanelBody><p className="text-sm text-ink-muted">Panel body content.</p></PanelBody>
        </Panel>
      </Row>

      <Row title="Empty state">
        <EmptyState
          className="w-full"
          title="No sessions yet"
          body="Create a session, share the QR code, and the room fills up."
          action={<Button>New session</Button>}
        />
      </Row>

      <Row title="Dossier">
        <div className="flex w-full flex-col items-center gap-8">
          <DossierStack done={done} highlight={landing} handingOff={handoff} key={String(handoff)} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={addNext}>Finish next activity</Button>
            <Button variant="secondary" onClick={() => { setDone([]); setLanding(undefined); setHandoff(false) }}>Reset</Button>
            <Button onClick={() => setHandoff(true)}>Hand off</Button>
          </div>
          <DossierPile done={done} />
        </div>
      </Row>
    </main>
  )
}
