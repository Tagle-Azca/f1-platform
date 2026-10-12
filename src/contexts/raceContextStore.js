import { createContext, useContext } from 'react'

export const RaceCtx = createContext(null)

const EMPTY = { nextRace: null, totalRounds: null, roundsDone: null, loaded: false, failed: false }
export const useRace = () => useContext(RaceCtx) ?? EMPTY
