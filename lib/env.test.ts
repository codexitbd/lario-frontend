import { describe, expect, it, afterEach } from 'vitest'
import { requireEnv } from '@/lib/env'

afterEach(() => {
  delete process.env.LARIO_TEST_VALUE
})

describe('requireEnv', () => {
  it('returns the value when set', () => {
    process.env.LARIO_TEST_VALUE = 'present'
    expect(requireEnv('LARIO_TEST_VALUE')).toBe('present')
  })

  it('throws a named error when missing', () => {
    expect(() => requireEnv('LARIO_TEST_VALUE')).toThrow(
      'Missing required environment variable: LARIO_TEST_VALUE',
    )
  })

  it('throws when set to an empty string', () => {
    process.env.LARIO_TEST_VALUE = ''
    expect(() => requireEnv('LARIO_TEST_VALUE')).toThrow(
      'Missing required environment variable: LARIO_TEST_VALUE',
    )
  })
})
