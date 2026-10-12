import { describe, it, expect } from 'vitest'
import { xTicks, rankTicks, pointsAxis, spreadLabels, positionHeight } from './chartLayout'

describe('xTicks', () => {
  it('handles empty and single rounds', () => {
    expect(xTicks(0, true)).toEqual([])
    expect(xTicks(1, false)).toEqual([1])
  })
  it('compact: about 6 ticks including first and last', () => {
    const t = xTicks(22, true)
    expect(t[0]).toBe(1)
    expect(t[t.length - 1]).toBe(22)
    expect(t.length).toBeGreaterThanOrEqual(5)
    expect(t.length).toBeLessThanOrEqual(7)
    expect(xTicks(3, true)).toEqual([1, 2, 3])
    expect(xTicks(6, true)).toEqual([1, 2, 3, 4, 5, 6])
  })
  it('wide: every round up to 12 rounds, then every 2nd with the last included', () => {
    expect(xTicks(12, false)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(xTicks(24, false)).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 24])
    expect(xTicks(23, false).at(-1)).toBe(23)
  })
})

describe('rankTicks and pointsAxis', () => {
  it('rank ticks fit the visible ranks', () => {
    expect(rankTicks(22)).toEqual([1, 5, 10, 15, 20])
    expect(rankTicks(10)).toEqual([1, 5, 10])
    expect(rankTicks(3)).toEqual([1])
  })
  it('points axis rounds up and keeps 4 to 5 ticks', () => {
    expect(pointsAxis(325, 50)).toEqual({ top: 350, ticks: [0, 100, 200, 300, 350] })
    expect(pointsAxis(561, 100).top).toBe(600)
    expect(pointsAxis(0, 50)).toEqual({ top: 50, ticks: [0, 50] })
    expect(pointsAxis(-5, 50).top).toBe(50)
    expect(pointsAxis(200, 50).ticks).toEqual([0, 50, 100, 150, 200])
  })
})

describe('spreadLabels', () => {
  it('keeps neighbours apart in the original order', () => {
    const out = spreadLabels([100, 102, 101, 200], 13, 0, 300)
    const sorted = [...out].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(13)
    expect(out[3]).toBe(200)
    expect(out[0]).toBeLessThan(out[2])
    expect(out[2]).toBeLessThan(out[1])
  })
  it('respects the bounds and handles empty', () => {
    expect(spreadLabels([], 13, 0, 100)).toEqual([])
    const out = spreadLabels([98, 99, 100], 13, 0, 100)
    expect(Math.max(...out)).toBeLessThanOrEqual(100)
    expect(out[0]).toBeLessThanOrEqual(out[1] - 13 + 0.001)
    expect(spreadLabels([-20], 13, 0, 100)).toEqual([0])
  })
})

describe('positionHeight', () => {
  it('matches the spec sizes', () => {
    expect(positionHeight(22, { isDrivers: true, compact: false })).toBe(441)
    expect(positionHeight(10, { isDrivers: true, compact: true })).toBe(280)
    expect(positionHeight(22, { isDrivers: true, compact: true })).toBe(441)
    expect(positionHeight(10, { isDrivers: false, compact: true })).toBe(316)
  })
})
