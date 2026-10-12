import { describe, it, expect } from 'vitest'
import { isValidEntityId, backTarget, initialsOf } from './entityId'

describe('isValidEntityId', () => {
  it('accepts snake case ids', () => {
    for (const id of ['norris', 'red_bull', 'a', 'x'.repeat(40), 'f1_2022']) expect(isValidEntityId(id)).toBe(true)
  })
  it('rejects hostile and malformed ids', () => {
    for (const id of ['', 'A', 'a b', '<script>', '%3Cscript%3E', '../etc', 'x'.repeat(41), 'é', null, undefined, 4, {}, ['a']]) expect(isValidEntityId(id)).toBe(false)
  })
})

describe('backTarget', () => {
  it('follows only encyclopedia and standings URLs', () => {
    expect(backTarget('/encyclopedia?view=circuits&season=2025', 'drivers')).toEqual({ to: '/encyclopedia?view=circuits&season=2025', label: 'Encyclopedia' })
    expect(backTarget('/standings?view=constructors', 'drivers')).toEqual({ to: '/standings?view=constructors', label: 'Standings' })
    expect(backTarget('/encyclopedia', 'drivers').to).toBe('/encyclopedia')
  })
  it('drops anything else', () => {
    for (const f of ['https://evil.test/', '//evil.test', '/encyclopedia/../x', '/encyclopediaX', '/admin', 'javascript:alert(1)', '/encyclopedia?x=<', 7, null, undefined, {}]) {
      expect(backTarget(f, 'constructors')).toEqual({ to: '/encyclopedia?view=constructors', label: 'Encyclopedia' })
    }
  })
  it('defaults an unknown type to drivers', () => {
    expect(backTarget(undefined, 'weird').to).toBe('/encyclopedia?view=drivers')
    expect(backTarget(undefined, 'circuits').to).toBe('/encyclopedia?view=circuits')
  })
})

describe('initialsOf', () => {
  it('builds up to three letters', () => {
    expect(initialsOf('Lando Norris')).toBe('LN')
    expect(initialsOf('McLaren')).toBe('MCL')
    expect(initialsOf('  ')).toBe('')
    expect(initialsOf('a b c d')).toBe('ABC')
    expect(initialsOf(null)).toBe('')
  })
})
