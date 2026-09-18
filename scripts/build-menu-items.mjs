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
writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`)
console.log(`${items.length} items written to ${OUT}`)
const gaps = items.filter((i) => !i.translations.ar.name || i.price === '0.00')
console.log(`${gaps.length} items still need Arabic names or prices`)
