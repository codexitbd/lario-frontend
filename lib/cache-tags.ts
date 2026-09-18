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
  // `redirects` has no cacheTag() caller and cannot get one. proxy.ts is the
  // only consumer of the redirect list, and it runs in the proxy, BEFORE the
  // render pipeline where `use cache` and cacheTag() have a context to attach
  // to — calling cacheTag() there throws. The tag is still generated and still
  // correct: the Laravel side emits it on every redirect save, and the
  // revalidation webhook accepts it, so it stays here so both sides agree
  // (03-api-contract.md requires CacheTags.php and this file to match). When
  // proxy.ts stops reading a build-time fixture and starts fetching
  // GET /redirects, that fetch is what will carry this tag.
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
