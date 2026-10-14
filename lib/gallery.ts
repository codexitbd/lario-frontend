/**
 * Splits an album into the rows of the gallery's justified layout and gives
 * each frame its aspect ratio (its flex-grow on wide screens, see
 * `.lr-gallery-row` in globals.css).
 *
 * Rows alternate two frames and three, so the album has a rhythm instead of a
 * grid. A lone last frame never gets a row to itself: it joins the row before
 * it, which is why a row can hold four. Each row size has its own ratio sets,
 * alternated down the album so portraits and landscapes trade places.
 */
const RATIOS: Record<number, number[][]> = {
  1: [[2.4]],
  2: [
    [1.5, 0.8],
    [0.8, 1.5],
  ],
  3: [
    [0.8, 1.6, 0.8],
    [1.25, 0.8, 1.25],
  ],
  4: [[0.8, 1.25, 0.8, 1.5]],
}

export function galleryRows<T>(items: T[]): { item: T; ratio: number }[][] {
  const rows: T[][] = []
  for (let start = 0, row = 0; start < items.length; row++) {
    const size = row % 2 === 0 ? 2 : 3
    rows.push(items.slice(start, start + size))
    start += size
  }

  const last = rows.at(-1)
  if (rows.length > 1 && last?.length === 1) {
    rows.pop()
    rows[rows.length - 1].push(...last)
  }

  return rows.map((row, index) => {
    const sets = RATIOS[row.length]
    const ratios = sets[index % sets.length]
    return row.map((item, i) => ({ item, ratio: ratios[i] }))
  })
}
