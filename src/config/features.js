/**
 * Feature flags. Everything reserved for later passes stays false until the
 * feature actually ships (PLAN section 6). Nothing here is user-configurable
 * at runtime, so it cannot be toggled from the browser.
 */
export const features = Object.freeze({
  myPitwall:    false,  // personalization: per-user widget order / pins
  deepAnalysis: false,  // AI summaries, strategy simulator
  social:       false,  // notifications, share buttons (TopBar action slot, Panel actions)
})

export const isFeatureOn = (flag, flags = features) => !flag || flags[flag] === true
