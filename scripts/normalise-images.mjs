import { readdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'public/images/menu'

export function toSlug(name) {
  return (
    name
      // NFD splits an accented letter into base + combining mark; the next line
      // strips those marks. This pair is what actually normalises c-cedilla,
      // o/u-umlaut, s-cedilla, g-breve and dotted-I — in BOTH cases — because each
      // one decomposes. Do NOT delete it as redundant with the replacement below:
      // the uppercase forms have no explicit mapping and would silently become
      // stray hyphens in the final strip.
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Dotless i (U+0131) is the one Turkish letter with no decomposition, so it
      // is the only character that genuinely needs replacing by hand.
      .replace(/\u0131/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}

if (process.argv[1]?.endsWith('normalise-images.mjs')) {
  for (const cuisine of readdirSync(ROOT)) {
    for (const file of readdirSync(join(ROOT, cuisine))) {
      const base = file.replace(/\.jpg$/i, '')
      const next = `${toSlug(base)}.jpg`
      if (next !== file) {
        renameSync(join(ROOT, cuisine, file), join(ROOT, cuisine, next))
        console.log(`${file} -> ${next}`)
      }
    }
  }
}
