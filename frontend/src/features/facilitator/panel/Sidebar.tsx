import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel'
import { t } from '@/lib/i18n'
import type { Participant } from '@/types'

/** QR + link so the room can join. Large QR: it gets projected. */
export function JoinCard({ joinUrl }: { joinUrl: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(joinUrl)
      toast.success(t('facilitator.url_copied'))
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  return (
    <Panel>
      <PanelHeader title={t('facilitator.session_url_label')} />
      <PanelBody>
        <div className="flex justify-center rounded-lg bg-white p-4">
          {/* White ground on purpose: scanners need maximum contrast. */}
          <QRCodeSVG value={joinUrl} size={176} level="M" marginSize={1} fgColor="#1f1915" bgColor="#ffffff" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate font-mono text-meta text-ink-muted" translate="no">{joinUrl}</code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-paper-raised px-2.5 text-meta font-medium text-ink transition-colors hover:bg-paper-sunk"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            {t('facilitator.copy_url_button')}
          </button>
        </div>
      </PanelBody>
    </Panel>
  )
}

export function RosterPreview({ participants, onViewAll }: { participants: Participant[]; onViewAll: () => void }) {
  const shown = participants.slice(0, 8)
  return (
    <Panel>
      <PanelHeader
        title={t('facilitator.participants_title')}
        action={<span className="text-sm text-ink-subtle tabular-nums">{participants.length}</span>}
      />
      <PanelBody>
        {participants.length === 0 ? (
          <p className="text-sm text-ink-subtle">{t('facilitator.no_participants')}</p>
        ) : (
          <ul className="space-y-3">
            {shown.map(p => (
              <li key={p.id} className="flex items-center gap-3">
                <Avatar name={p.display_name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.display_name}</p>
                  <p className="truncate text-meta text-ink-subtle">{p.role}{p.org ? ` · ${p.org}` : ''}</p>
                </div>
              </li>
            ))}
            {participants.length > shown.length && (
              <li>
                <button type="button" onClick={onViewAll} className="text-sm font-medium text-clay-700 hover:underline">
                  {t('facilitator.view_all', { count: participants.length - shown.length })}
                </button>
              </li>
            )}
          </ul>
        )}
      </PanelBody>
    </Panel>
  )
}
