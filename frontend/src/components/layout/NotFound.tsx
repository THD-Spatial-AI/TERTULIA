import { Link } from 'react-router-dom'
import { PageWrapper } from './PageWrapper'
import { Button } from '@/components/ui/Button'
import { t } from '@/lib/i18n'

export function NotFound() {
  return (
    <PageWrapper maxWidth="full">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-mono text-8xl font-bold text-brand-200 select-none" aria-hidden="true">
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          {t('errors.not_found')}
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button variant="brand">{t('common.go_home')}</Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}
