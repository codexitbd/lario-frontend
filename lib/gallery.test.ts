import { describe, expect, it } from 'vitest'
import { galleryRows } from '@/lib/gallery'

const sizes = (count: number) => galleryRows(Array.from({ length: count }, (_, i) => i)).map((row) => row.length)

describe('galleryRows', () => {
  it('alternates rows of two and three', () => {
    expect(sizes(10)).toEqual([2, 3, 2, 3])
    expect(sizes(7)).toEqual([2, 3, 2])
  })

  it('never leaves a frame alone on the last row', () => {
    expect(sizes(6)).toEqual([2, 4])
    expect(sizes(8)).toEqual([2, 3, 3])
    expect(sizes(3)).toEqual([3])
  })

  it('keeps one frame as one row and an empty album empty', () => {
    expect(sizes(1)).toEqual([1])
    expect(sizes(0)).toEqual([])
  })

  it('keeps every frame, in order, with a ratio', () => {
    const rows = galleryRows(Array.from({ length: 24 }, (_, i) => i))
    expect(rows.flat().map((cell) => cell.item)).toEqual(Array.from({ length: 24 }, (_, i) => i))
    expect(rows.flat().every((cell) => cell.ratio > 0)).toBe(true)
  })
})
