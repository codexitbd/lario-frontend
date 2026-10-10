import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Figure } from '@/components/ui/figure'

const base = { alt: 'Room', shot: 'Room', sizes: '100vw', className: 'absolute inset-0' }

describe('Figure', () => {
  it('serves the phone photo below the breakpoint and the main photo above it', () => {
    const html = renderToStaticMarkup(
      <Figure {...base} src="/storage/wide.jpg" mobileSrc="/storage/tall.jpg" desktopFrom={1024} />,
    )

    expect(html).toContain('<picture>')
    expect(html).toMatch(/<source media="\(min-width: 1024px\)" srcSet="[^"]*wide\.jpg/)
    expect(html).toMatch(/<img[^>]*alt="Room"[^>]*src="[^"]*tall\.jpg/)
  })

})
