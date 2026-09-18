import { describe, expect, it } from 'vitest'
import {
  cascadeForBranch,
  cascadeForMenuCategory,
  cascadeForMenuItem,
  tags,
} from '@/lib/cache-tags'

describe('tag strings', () => {
  it('matches the contract exactly', () => {
    expect(tags.settings()).toBe('settings')
    expect(tags.home()).toBe('home')
    expect(tags.page('contact')).toBe('page:contact')
    expect(tags.menu()).toBe('menu')
    expect(tags.menuCategory('pizza')).toBe('menu-category:pizza')
    expect(tags.menuItem('carbonara')).toBe('menu-item:carbonara')
    expect(tags.branches()).toBe('branches')
    expect(tags.branch('narjis')).toBe('branch:narjis')
    expect(tags.testimonials()).toBe('testimonials')
    expect(tags.redirects()).toBe('redirects')
  })
})

describe('cascades', () => {
  it('a menu item invalidates itself and the menu listing', () => {
    expect(cascadeForMenuItem('carbonara', false)).toEqual([
      'menu-item:carbonara',
      'menu',
    ])
  })

  it('a featured menu item also invalidates the homepage', () => {
    expect(cascadeForMenuItem('carbonara', true)).toEqual([
      'menu-item:carbonara',
      'menu',
      'home',
    ])
  })

  it('a category invalidates itself and the menu listing', () => {
    expect(cascadeForMenuCategory('pizza')).toEqual([
      'menu-category:pizza',
      'menu',
    ])
  })

  it('a branch invalidates itself, the listing and the homepage cards', () => {
    expect(cascadeForBranch('narjis')).toEqual([
      'branch:narjis',
      'branches',
      'home',
    ])
  })
})
