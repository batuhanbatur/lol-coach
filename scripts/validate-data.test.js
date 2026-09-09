import { describe, it, expect } from 'vitest'
import { validateEntry } from './validate-data.js'

function makeEntry(overrides = {}) {
  return {
    id: 'test-entry',
    champions: ['Ashe', 'Zed'],
    abilities: ['R'],
    interaction_type: 'counters',
    description: 'test',
    severity: 'medium',
    tags: ['test-tag'],
    patch_verified: '16.1',
    ...overrides,
  }
}

function validate(entry) {
  const errors = []
  const warnings = []
  validateEntry(entry, 0, errors, warnings, new Set())
  return { errors, warnings }
}

describe('team_scope validation', () => {
  it('accepts an entry with no team_scope field', () => {
    expect(validate(makeEntry()).errors).toEqual([])
  })

  it.each(['same_team', 'cross_team', 'any'])(
    'accepts team_scope "%s"',
    (scope) => {
      expect(validate(makeEntry({ team_scope: scope })).errors).toEqual([])
    }
  )

  it('rejects an invalid team_scope value', () => {
    const { errors } = validate(makeEntry({ team_scope: 'enemy_team' }))
    expect(errors.some((error) => error.includes('team_scope'))).toBe(true)
  })
})
