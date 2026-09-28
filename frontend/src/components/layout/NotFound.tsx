import { Link } from 'react-router-dom'
import { PageWrapper } from './PageWrapper'
import { buttonClasses } from '@/components/ui/Button'
import { t, useLang } from '@/lib/i18n'

export function NotFound() {
  useLang()
  return (
    <PageWrapper maxWidth="md">
      <div className="py-20 sm:py-28">
        <p className="font-mono text-meta text-ink-subtle">404</p>
        <h1 className="mt-3 font-display text-display text-ink">{t('errors.page_not_found')}</h1>
        <p className="mt-4 max-w-md text-[1.0625rem] text-ink-muted">{t('errors.not_found')}</p>
        <Link to="/" className={`${buttonClasses('secondary')} mt-8`}>{t('common.go_home')}</Link>
      </div>
    </PageWrapper>
  )
}
