import { Check, Minus, RefreshCw, Download } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/lib/i18n'
import { phaseLabel } from '../phase'
import { COMPLETION_COLS } from './phases'
import type { Participant, ParticipantCompletion } from '@/types'

interface ParticipantsTabProps {
  participants: Participant[]
  completions: ParticipantCompletion[]
  loading: boolean
  countLabel: string
  onRefresh: () => void
  onRemove: (id: string) => void
  onExport: () => void
}

export function ParticipantsTab({ participants, completions, loading, countLabel, onRefresh, onRemove, onExport }: ParticipantsTabProps) {
  const byId = new Map(completions.map(c => [c.participant_id, c]))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{countLabel} · {t('facilitator.template_completion')}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onRefresh} loading={loading}>
            {!loading && <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            {t('facilitator.refresh')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport} disabled={participants.length === 0}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t('facilitator.export_csv')}
          </Button>
        </div>
      </div>

      {participants.length === 0 ? (
        <EmptyState title={t('facilitator.no_participants')} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper-raised">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-meta text-ink-muted">
                <th scope="col" className="px-5 py-3 text-left font-medium">{t('facilitator.participant_header')}</th>
                {COMPLETION_COLS.map(col => (
                  <th key={col.key} scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">{phaseLabel(col.phaseKey)}</th>
                ))}
                <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">{t('facilitator.action_header')}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {participants.map(p => {
                const c = byId.get(p.id)
                return (
                  <tr key={p.id} className="transition-colors hover:bg-paper-sunk/60">
                    <th scope="row" className="px-5 py-3 text-left font-normal">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.display_name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{p.display_name}</p>
                          <p className="truncate text-meta text-ink-subtle">{p.role}{p.org ? ` · ${p.org}` : ''}</p>
                        </div>
                      </div>
                    </th>
                    {COMPLETION_COLS.map(col => {
                      const done = Boolean(c?.[col.key])
                      return (
                        <td key={col.key} className="px-4 py-3 text-center">
                          {loading && !c ? (
                            <span className="inline-block h-2 w-6 rounded-full bg-line" aria-hidden="true" />
                          ) : done ? (
                            <><Check className="mx-auto h-4 w-4 text-success" aria-hidden="true" /><span className="sr-only">{t('panel.completed')}</span></>
                          ) : (
                            <><Minus className="mx-auto h-4 w-4 text-ink-faint" aria-hidden="true" /><span className="sr-only">{t('panel.not_yet')}</span></>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right">
                      <ConfirmButton
                        onConfirm={() => onRemove(p.id)}
                        confirmLabel={t('facilitator.confirm_remove')}
                        aria-label={t('panel.remove_participant_named', { name: p.display_name })}
                      >
                        {t('facilitator.remove_participant')}
                      </ConfirmButton>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
