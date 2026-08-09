import { describe, it, expect } from 'vitest'
import { buildCoverageSet } from './coverage.js'

function makeEntry(champions) {
  return {
    id: 'test-entry',
    champions,
    abilities: [],
    interaction_type: 'counters',
    description: 'test',
    severity: 'medium',
    timing_note: '',
    tags: [],
    patch_verified: '16.1',
  }
}

describe('buildCoverageSet', () => {
  it('includes a champion that appears in an entry', () => {
    const set = buildCoverageSet([makeEntry(['Ahri', 'Zed'])])
    expect(set.has('Ahri')).toBe(true)
  })

  it('excludes a champion that never appears in any entry', () => {
    const set = buildCoverageSet([makeEntry(['Ahri', 'Zed'])])
    expect(set.has('Yasuo')).toBe(false)
  })

  it('is case-sensitive, matching the engine convention', () => {
    const set = buildCoverageSet([makeEntry(['Ahri', 'Zed'])])
    expect(set.has('ahri')).toBe(false)
  })
})
