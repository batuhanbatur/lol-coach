import { describe, it, expect } from 'vitest'
import { latestVerifiedPatch } from './dataStats.js'

describe('latestVerifiedPatch', () => {
  it('returns the newest patch across entries', () => {
    const interactions = [
      { patch_verified: '26.14' },
      { patch_verified: '26.22' },
      { patch_verified: '26.20' },
    ]
    expect(latestVerifiedPatch(interactions)).toBe('26.22')
  })

  it('compares patch numbers numerically, not as text', () => {
    const interactions = [{ patch_verified: '26.9' }, { patch_verified: '26.14' }]
    expect(latestVerifiedPatch(interactions)).toBe('26.14')
  })

  it('prefers a later season over a later patch number', () => {
    const interactions = [{ patch_verified: '25.24' }, { patch_verified: '26.1' }]
    expect(latestVerifiedPatch(interactions)).toBe('26.1')
  })

  it('ignores entries that are not verified yet', () => {
    const interactions = [
      { patch_verified: null },
      { patch_verified: '' },
      { patch_verified: '26.14' },
      {},
    ]
    expect(latestVerifiedPatch(interactions)).toBe('26.14')
  })

  it('returns null when nothing is verified', () => {
    expect(latestVerifiedPatch([])).toBeNull()
    expect(latestVerifiedPatch([{ patch_verified: null }])).toBeNull()
  })
})
