import { describe, expect, it } from 'vitest'
import { resolveTranslation } from '@/lib/api/resolve'

describe('resolveTranslation', () => {
  it('returns the requested locale', () => {
    expect(
      resolveTranslation({ en: { name: 'Pizza' }, ar: { name: 'بيتزا' } }, 'ar'),
    ).toEqual({ name: 'بيتزا' })
  })

  it('falls back to English when the locale is missing', () => {
    const translations = { en: { name: 'Pizza' } } as Record<
      'en' | 'ar',
      { name: string }
    >
    expect(resolveTranslation(translations, 'ar')).toEqual({ name: 'Pizza' })
  })

  it('throws when even the English fallback is absent', () => {
    expect(() =>
      resolveTranslation({} as Record<'en' | 'ar', { name: string }>, 'ar'),
    ).toThrow('No translation available')
  })
})
