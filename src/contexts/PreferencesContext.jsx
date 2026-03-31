import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { F1_TEAMS, getTeam } from '../data/f1Teams'

const PreferencesContext = createContext(null)
export const usePreferences = () => useContext(PreferencesContext)

const NEUTRAL_ACCENT = '#94a3b8'

function hexToSpaceRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

function effectiveAccent(favoriteTeam, favoriteDriver) {
  if (favoriteTeam) return getTeam(favoriteTeam)?.color ?? NEUTRAL_ACCENT
  if (favoriteDriver) {
    const team = F1_TEAMS.find(t => t.drivers.includes(favoriteDriver))
    return team?.color ?? NEUTRAL_ACCENT
  }
  return NEUTRAL_ACCENT
}

const DEFAULT = {
  favoriteTeam:   null,
  favoriteDriver: null,
  units:       { speed: 'kmh', temp: 'celsius' },
  dataLayers:  { tireLife: true, gForce: false, drsZones: true, sectorTimes: true },
}

const LS_KEY = 'pw_prefs_ext'

function loadExtended() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? {} } catch { return {} }
}

function saveExtended(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

function applyAccentVars(color) {
  document.documentElement.style.setProperty('--accent-color', color)
  document.documentElement.style.setProperty('--accent-rgb', hexToSpaceRgb(color))
}

export function PreferencesProvider({ children }) {
  const { user, updatePreferences } = useAuth()

  const [prefs,    setPrefs]    = useState(DEFAULT)
  const [draft,    setDraftRaw] = useState(DEFAULT)

  // Track user identity (not every user object change).
  // We only re-hydrate on login/logout, NOT when updatePreferences calls setUser.
  const userIdRef = useRef(null)

  useEffect(() => {
    const currentId = user?._id?.toString() ?? null
    if (currentId === userIdRef.current) return  // same user, skip (preference update, not login)
    userIdRef.current = currentId

    const ext = loadExtended()
    const loaded = {
      ...DEFAULT,
      // DB is source of truth when logged in; localStorage is fallback for non-logged-in or network failures
      favoriteTeam:   user?.preferences?.favoriteTeam   || ext.favoriteTeam   || null,
      favoriteDriver: user?.preferences?.favoriteDriver || ext.favoriteDriver || null,
      units:      ext.units      ?? DEFAULT.units,
      dataLayers: ext.dataLayers ?? DEFAULT.dataLayers,
    }
    setPrefs(loaded)
    setDraftRaw(loaded)
  }, [user])

  // Sync CSS vars when applied prefs change
  useEffect(() => {
    applyAccentVars(effectiveAccent(prefs.favoriteTeam, prefs.favoriteDriver))
  }, [prefs.favoriteTeam, prefs.favoriteDriver])

  const setDraft = useCallback((updater) => {
    setDraftRaw(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater })
  }, [])

  const previewAccent = useCallback((teamId, driverId) => {
    applyAccentVars(effectiveAccent(teamId, driverId))
  }, [])

  const resetDraft = useCallback(() => {
    setDraftRaw(prefs)
    applyAccentVars(effectiveAccent(prefs.favoriteTeam, prefs.favoriteDriver))
  }, [prefs])

  const resetAll = useCallback(() => {
    setDraftRaw(DEFAULT)
    applyAccentVars(NEUTRAL_ACCENT)
    saveExtended({ units: DEFAULT.units, dataLayers: DEFAULT.dataLayers, favoriteTeam: null, favoriteDriver: null })
  }, [])

  const applyChanges = useCallback(async () => {
    // Optimistic update — apply immediately so UI doesn't reset
    setPrefs(draft)
    saveExtended({
      units:          draft.units,
      dataLayers:     draft.dataLayers,
      favoriteTeam:   draft.favoriteTeam   || null,
      favoriteDriver: draft.favoriteDriver || null,
    })

    if (!user) return

    // Save to backend — errors bubble up to the drawer for display
    await updatePreferences({
      favoriteTeam:   draft.favoriteTeam   || null,
      favoriteDriver: draft.favoriteDriver || null,
    })
    // updatePreferences calls setUser internally, but userIdRef guard
    // prevents the useEffect from resetting our draft
  }, [draft, user, updatePreferences])

  const accentColor = effectiveAccent(prefs.favoriteTeam, prefs.favoriteDriver)

  return (
    <PreferencesContext.Provider value={{
      prefs, draft,
      setDraft, applyChanges, resetDraft, resetAll,
      previewAccent, accentColor,
    }}>
      {children}
    </PreferencesContext.Provider>
  )
}
