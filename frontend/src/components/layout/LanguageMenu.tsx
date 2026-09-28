import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t, setLanguage, useLang, type Language } from '@/lib/i18n'

const LANGS: { code: Language; name: string }[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'gl', name: 'Galego' },
]

export const menuContent =
  'z-50 min-w-44 rounded-lg border border-line bg-paper-raised p-1 shadow-float data-[state=open]:animate-[rise-in_150ms_var(--ease-soft)]'
export const menuItem =
  'flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-paper-sunk'

export function LanguageMenu({ className }: { className?: string }) {
  const lang = useLang()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t('nav.language_label')}
        className={cn(
          'inline-flex h-8 items-center gap-1 rounded-md px-2 text-meta font-medium uppercase text-ink-muted',
          'transition-colors hover:bg-paper-sunk hover:text-ink data-[state=open]:bg-paper-sunk',
          className,
        )}
      >
        {lang}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className={menuContent}>
          <DropdownMenu.RadioGroup value={lang} onValueChange={v => setLanguage(v as Language)}>
            {LANGS.map(({ code, name }) => (
              <DropdownMenu.RadioItem key={code} value={code} lang={code} className={menuItem}>
                <span className="flex-1">{name}</span>
                <DropdownMenu.ItemIndicator>
                  <Check className="h-4 w-4 text-clay-600" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
