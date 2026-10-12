/* global process */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CTOR_COLORS } from '../utils/teamColors'
import { teamMark, contrastRatio, BASE, VIZ_HEX, own, tyre, sectorTone, constructorMark, TYPE_HEX, TYPE_TONES } from '../styles/vizPalette'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const cssVar = (name) => new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]

describe('vizPalette', () => {
  it('JS hex mirror equals the --viz-* CSS vars', () => {
    expect(cssVar('--viz-tyre-soft')).toBe(VIZ_HEX.tyreSoft)
    expect(cssVar('--viz-tyre-medium')).toBe(VIZ_HEX.tyreMedium)
    expect(cssVar('--viz-tyre-hard')).toBe(VIZ_HEX.tyreHard)
    expect(cssVar('--viz-tyre-inter')).toBe(VIZ_HEX.tyreInter)
    expect(cssVar('--viz-tyre-wet')).toBe(VIZ_HEX.tyreWet)
    expect(cssVar('--viz-tyre-ink')).toBe(VIZ_HEX.tyreInk)
  })
  it('circuit type tones mirror the CSS vars and reach 3:1 on panel and bg', () => {
    for (const k of Object.keys(TYPE_HEX)) {
      expect(cssVar(`--viz-type-${k}`)).toBe(TYPE_HEX[k])
      expect(TYPE_TONES[k]).toBe(`var(--viz-type-${k})`)
      expect(contrastRatio(TYPE_HEX[k], BASE.panel)).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(TYPE_HEX[k], BASE.bg)).toBeGreaterThanOrEqual(3)
    }
  })
  it('teamMark reaches 3:1 on panel and bg for every team color', () => {
    for (const hex of Object.values(CTOR_COLORS)) {
      expect(contrastRatio(teamMark(hex), BASE.panel)).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(teamMark(hex, BASE.bg), BASE.bg)).toBeGreaterThanOrEqual(3)
    }
  })
  it('teamMark keeps already-legible colors and falls back on junk', () => {
    expect(teamMark('#FF8000')).toBe('#ff8000')
    expect(teamMark('#0600EF')).not.toBe('#0600ef')
    expect(teamMark('#fff')).toBe('#ffffff')
    expect(teamMark('#f80a')).toBe('#ff8800')
    expect(teamMark('javascript:alert(1)')).toBe('#888888')
    expect(teamMark(undefined)).toBe('#888888')
  })
  it('lookups are own-property only', () => {
    expect(own({ a: 1 }, '__proto__')).toBeUndefined()
    expect(own({ a: 1 }, 'a')).toBe(1)
    expect(tyre('__proto__')).toBeUndefined()
    expect(tyre('soft').letter).toBe('S')
    expect(tyre(null)).toBeUndefined()
    expect(sectorTone('constructor')).toBeUndefined()
    expect(sectorTone('purple').glyph).toBe('diamond')
    expect(constructorMark('__proto__')).toBe('#888888')
    expect(constructorMark('ferrari')).toMatch(/^#/)
  })
})
