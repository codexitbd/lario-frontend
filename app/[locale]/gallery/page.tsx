import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GalleryViewer, type ViewerPhoto } from '@/components/gallery/gallery-viewer'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Container } from '@/components/ui/container'
import { Figure } from '@/components/ui/figure'
import { getPage } from '@/lib/api/pages'
import { getGalleries } from '@/lib/api/posts'
import { getSettings } from '@/lib/api/settings'
import { galleryRows } from '@/lib/gallery'
import { isLocale, localePath } from '@/lib/i18n/config'
import { absoluteUrl } from '@/content/seo-defaults'
import { getDictionary, interpolate } from '@/lib/i18n/dictionaries'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'

const PAGE_SLUG = 'gallery'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await getPage(locale, PAGE_SLUG)
  return page ? buildMetadata(page.seo) : {}
}

/**
 * /gallery. Words and SEO from the admin page "gallery"; the photographs from
 * the admin's gallery albums (GET /galleries), every one of them in the HTML.
 *
 * The photographs lead. The opening band is short: the title on the start
 * side, an index of the albums on the end side that jumps to each. Each album
 * is then a chapter on its own ground (ink and bone alternate, as they do down
 * every page of the site), its frames laid in justified rows (lib/gallery.ts)
 * so portraits and landscapes share a row at one height without cropping into
 * a uniform grid.
 *
 * Any frame opens the viewer (components/gallery/gallery-viewer.tsx), which
 * steps through every photograph on the page with the arrow keys.
 */
export default async function GalleryPage({ params }: { params: Params }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [page, albums, settings, dict] = await Promise.all([
    getPage(locale, PAGE_SLUG),
    getGalleries(locale),
    getSettings(locale),
    getDictionary(locale),
  ])
  if (!page) notFound()

  const intro = page.sections.find((s) => s.type === 'page_hero')?.content.subheading
  const photos: ViewerPhoto[] = albums.flatMap((album) => album.images.map((image) => ({ ...image, album: album.title })))
  let next = 0

  return (
    <main id="main-content">
      <section className="bg-ink pt-36 pb-16 text-ivory md:pt-44 md:pb-24">
        <Container>
          <Breadcrumb items={[{ label: settings.site_name, href: localePath(locale, '/') }, { label: page.title }]} />

          <div className="mt-8 grid gap-y-14 lg:grid-cols-12 lg:items-end lg:gap-x-12">
            <div className="lg:col-span-7">
              <h1 className="lr-display lr-hero-title max-w-[14ch] pb-1 text-[clamp(2.5rem,1.4rem+3.6vw,4.25rem)] leading-[1.04] text-balance">
                {page.heading}
              </h1>
              {typeof intro === 'string' && intro ? (
                <p className="lr-hero-in mt-6 max-w-[46ch] text-lg leading-relaxed text-pretty text-ivory-dim" style={{ '--d': 220 } as React.CSSProperties}>
                  {intro}
                </p>
              ) : null}
            </div>

            {albums.length > 1 ? (
              <nav aria-label={dict.gallery.albums} className="lr-hero-in lg:col-span-4 lg:col-start-9" style={{ '--d': 360 } as React.CSSProperties}>
                <ul className="border-b border-ivory/12">
                  {albums.map((album) => (
                    <li key={album.slug} className="border-t border-ivory/12">
                      <a href={`#${album.slug}`} className="group flex items-baseline justify-between gap-6 py-4">
                        <span className="lr-display text-xl transition-colors duration-300 group-hover:text-gold md:text-2xl">{album.title}</span>
                        <span className="shrink-0 text-sm text-ivory-dim tabular-nums">
                          {interpolate(dict.gallery.photos, { count: String(album.images.length) })}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>

          {albums.length === 0 ? <p className="mt-16 max-w-[44ch] text-lg text-ivory-dim">{dict.gallery.empty}</p> : null}
        </Container>
      </section>

      <GalleryViewer
        photos={photos}
        labels={{
          viewer: dict.gallery.viewer,
          close: dict.gallery.close,
          previous: dict.gallery.previous,
          next: dict.gallery.next,
          position: dict.gallery.position,
        }}
      >
        {albums.map((album, albumIndex) => {
          const light = albumIndex % 2 === 1
          return (
            <section
              key={album.slug}
              id={album.slug}
              aria-labelledby={`${album.slug}-title`}
              className={`scroll-mt-20 py-20 md:py-28 ${light ? 'bg-bone text-ink' : 'bg-ink text-ivory'} ${albumIndex === 0 ? 'pt-4 md:pt-6' : ''}`}
            >
              <Container>
                <header className="mb-10 max-w-[52ch] md:mb-14">
                  <h2 id={`${album.slug}-title`} className="lr-display lr-unmask text-[clamp(1.875rem,1.1rem+2.6vw,3.25rem)] leading-[1.08]">
                    {album.title}
                  </h2>
                  {album.description ? (
                    <p className={`lr-reveal mt-4 text-base leading-relaxed md:text-lg ${light ? 'text-ink-soft' : 'text-ivory-dim'}`}>{album.description}</p>
                  ) : null}
                </header>

                <div className="space-y-2 md:space-y-3">
                  {galleryRows(album.images).map((row, rowIndex) => {
                    const sum = row.reduce((total, cell) => total + cell.ratio, 0)
                    return (
                      <div key={rowIndex} className="lr-gallery-row">
                        {row.map(({ item: image, ratio }) => {
                          const index = next++
                          return (
                            <a
                              key={index}
                              href={image.url}
                              data-photo={index}
                              aria-haspopup="dialog"
                              className="lr-plate group relative block overflow-hidden"
                              style={{ '--ar': ratio } as React.CSSProperties}
                            >
                              <Figure
                                src={image.url}
                                alt={image.alt}
                                shot={album.title}
                                sizes={`(min-width: 1400px) ${Math.round((ratio / sum) * 1304)}px, (min-width: 768px) ${Math.round((ratio / sum) * 100)}vw, ${row.length % 2 === 1 && image === row[0].item ? '100vw' : '50vw'}`}
                                className="absolute inset-0"
                                imageClassName="transition-transform duration-[1200ms] ease-brand group-hover:scale-[1.035]"
                              />
                            </a>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </Container>
            </section>
          )
        })}
      </GalleryViewer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: settings.site_name, url: absoluteUrl(locale, '/') },
              { name: page.title, url: page.seo.canonical },
            ]),
            {
              '@context': 'https://schema.org',
              '@type': 'ImageGallery',
              name: page.heading,
              url: page.seo.canonical,
              image: photos.map((photo) => ({ '@type': 'ImageObject', contentUrl: photo.url, name: photo.alt, caption: photo.caption ?? undefined })),
            },
          ]),
        }}
      />
    </main>
  )
}
