import { notFound } from 'next/navigation'
import { getMenuCategories } from '@/lib/api/menu'
import { isLocale } from '@/lib/i18n/config'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const categories = await getMenuCategories(locale)

  return (
    <main id="main-content">
      <h1>La Rio</h1>
      <p>{categories.length} categories loaded for locale {locale}.</p>
    </main>
  )
}
