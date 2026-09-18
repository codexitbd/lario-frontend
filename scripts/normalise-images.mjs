import { readdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'public/images/menu'

export function toSlug(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
