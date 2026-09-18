import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { toSlug } from './normalise-images.mjs'

const ROOT = 'public/images/menu'
const OUT = 'content/menu-items.json'

// Filename slug -> category slug. Anything unlisted lands in steaks-and-mains.
const CATEGORY_BY_KEYWORD = [
  ['cold-mezze', ['ezme', 'humus', 'mutebbel', 'baba-ghanoush', 'mouhamara', 'vine-leaves', 'onion-dolma', 'puff-bread', 'lahmacun']],
  ['soups', ['soup', 'harira']],
  ['salads', ['salad', 'tabbouleh', 'rucola-parmigiano', 'tomato-carpaccio']],
  ['pizza', ['pizza']],
  ['pasta-and-risotto', ['pasta', 'risotto', 'ravioli', 'gnocchi', 'linguine', 'spagetti', 'fettuccine']],
  ['kebabs-and-skewers', ['kebab', 'skewer', 'shish', 'kafta', 'meatball', 'beyti']],
  ['sides', ['fries', 'patato', 'potato', 'wedges', 'grilled-vegetables', 'spinach', 'pickled', 'asparagus']],
  ['starters', ['empanada', 'carpaccio', 'brie', 'scallop', 'tartar', 'prawns', 'tongue', 'tacos']],
]

function categoryFor(slug) {
  for (const [category, keywords] of CATEGORY_BY_KEYWORD) {
    if (keywords.some((k) => slug.includes(k))) return category
  }
  return 'steaks-and-mains'
}

function titleFrom(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const existing = existsSync(OUT)
  ? new Map(JSON.parse(readFileSync(OUT, 'utf8')).map((i) => [i.slug, i]))
  : new Map()

const items = []
for (const cuisine of readdirSync(ROOT)) {
  for (const file of readdirSync(join(ROOT, cuisine))) {
    const slug = toSlug(file.replace(/\.jpg$/i, ''))
    const previous = existing.get(slug)
    items.push(
      previous ?? {
        slug,
        category_slug: categoryFor(slug),
        cuisine: cuisine.toLowerCase(),
        image: `/images/menu/${cuisine}/${file}`,
        price: '0.00',
        currency: 'SAR',
        calories: null,
        dietary_tags: ['halal'],
        allergens: [],
        is_featured: false,
        is_available: true,
        sort_order: 0,
        translations: {
          en: { name: titleFrom(slug), description: '', short_description: null, ingredients_note: null, preparation_note: null },
          ar: { name: '', description: '', short_description: null, ingredients_note: null, preparation_note: null },
        },
      },
    )
  }
}

items.sort((a, b) => a.slug.localeCompare(b.slug))

// Curated entries are keyed by the slug stored in the previous file, but matched
// against a slug recomputed from the current filename. If toSlug's output changes
// or an image is renamed, the old entry matches nothing and is dropped — taking
// its price, calories, allergens and Arabic copy with it. toSlug HAS been changed
// once already in this repo, so this is a real path, not a theoretical one. Say so
// loudly at generation time rather than leaving it to be noticed in a git diff.
const produced = new Set(items.map((i) => i.slug))
const orphaned = [...existing.keys()].filter((slug) => !produced.has(slug))
if (orphaned.length > 0) {
  console.warn(
    `WARNING: ${orphaned.length} previously curated slug(s) matched no file this run and have been DROPPED:`,
  )
  for (const slug of orphaned) console.warn(`  - ${slug}`)
  console.warn('Recover with: git checkout content/menu-items.json')
}

writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`)
console.log(`${items.length} items written to ${OUT}`)
const gaps = items.filter((i) => !i.translations.ar.name || i.price === '0.00')
console.log(`${gaps.length} items still need Arabic names or prices`)
