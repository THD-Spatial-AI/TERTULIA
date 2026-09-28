import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel'
import { t } from '@/lib/i18n'

export interface SessionSettings {
  title: string
  slides_url: string
  wildfire_url: string
}

interface SettingsTabProps {
  initial: SessionSettings
  saving: boolean
  onSave: (form: SessionSettings) => void
  onBroadcast: (message: string) => Promise<boolean>
  onExport: () => void
  canExport: boolean
}

export function SettingsTab({ initial, saving, onSave, onBroadcast, onExport, canExport }: SettingsTabProps) {
  const [form, setForm] = useState(initial)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    if (await onBroadcast(message.trim())) setMessage('')
    setSending(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <PanelHeader title={t('facilitator.tab_settings')} />
        <PanelBody>
          <form className="space-y-5" onSubmit={e => { e.preventDefault(); onSave(form) }}>
            <Field label={t('facilitator.session_title_label')}>
              <Input id="s-title" name="title" autoComplete="off" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label={t('facilitator.slides_url_label')}>
              <Input id="s-slides" name="slides_url" type="url" inputMode="url" autoComplete="off" spellCheck={false}
                value={form.slides_url} placeholder={t('facilitator.slides_url_placeholder')}
                onChange={e => setForm(f => ({ ...f, slides_url: e.target.value }))} />
            </Field>
            <Field label={t('facilitator.wildfire_url_label')}>
              <Input id="s-wildfire" name="wildfire_url" type="url" inputMode="url" autoComplete="off" spellCheck={false}
                value={form.wildfire_url}
                onChange={e => setForm(f => ({ ...f, wildfire_url: e.target.value }))} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>{t('common.save')}</Button>
            </div>
          </form>
        </PanelBody>
      </Panel>

      <div className="space-y-6">
        <Panel>
          <PanelHeader title={t('facilitator.broadcast_label')} description={t('facilitator.broadcast_hint')} />
          <PanelBody>
            <form className="flex gap-2" onSubmit={send}>
              <label htmlFor="broadcast" className="sr-only">{t('facilitator.broadcast_label')}</label>
              <Input id="broadcast" name="broadcast" autoComplete="off" value={message}
                onChange={e => setMessage(e.target.value)} placeholder={t('facilitator.broadcast_placeholder')} />
              <Button type="submit" variant="secondary" disabled={!message.trim()} loading={sending} className="shrink-0">
                {!sending && <Send className="h-4 w-4" aria-hidden="true" />}
                {t('facilitator.broadcast_send')}
              </Button>
            </form>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title={t('facilitator.export_csv')} description={t('facilitator.export_csv_hint')} />
          <PanelBody>
            <Button variant="secondary" onClick={onExport} disabled={!canExport}>{t('facilitator.export_csv')}</Button>
          </PanelBody>
        </Panel>
      </div>
    </div>
  )
}
