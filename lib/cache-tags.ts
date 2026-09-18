export const tags = {
  settings: () => 'settings',
  home: () => 'home',
  page: (slug: string) => `page:${slug}`,
  menu: () => 'menu',
  menuCategory: (slug: string) => `menu-category:${slug}`,
  menuItem: (slug: string) => `menu-item:${slug}`,
  branches: () => 'branches',
  branch: (slug: string) => `branch:${slug}`,
  testimonials: () => 'testimonials',
  redirects: () => 'redirects',
} as const

export function cascadeForMenuItem(
  slug: string,
  isFeatured: boolean,
): string[] {
  const result = [tags.menuItem(slug), tags.menu()]
  if (isFeatured) result.push(tags.home())
  return result
}

export function cascadeForMenuCategory(slug: string): string[] {
  return [tags.menuCategory(slug), tags.menu()]
}

export function cascadeForBranch(slug: string): string[] {
  return [tags.branch(slug), tags.branches(), tags.home()]
}
