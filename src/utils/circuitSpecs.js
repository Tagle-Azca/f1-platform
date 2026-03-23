/**
 * Technical specs for F1 circuits.
 * Keys match Jolpica/Ergast circuitId values.
 *
 * Fields:
 *   length    — lap length in km
 *   laps      — scheduled race laps
 *   turns     — number of corners
 *   drs       — DRS zones
 *   throttle  — full-throttle % per lap
 *   topSpeed  — projected top speed on main straight (km/h)
 *   gforce    — max lateral G-force
 *   gearChanges — avg gear changes per lap
 *   braking    — braking intensity 1–10
 *   tireStress — tyre degradation stress 1–10
 */
export const CIRCUIT_SPECS = {
  albert_park:   { length: 5.278, laps: 58, turns: 16, drs: 4, throttle: 67, topSpeed: 315, gforce: 4.5, gearChanges: 58, braking: 6,  tireStress: 6 },
  bahrain:       { length: 5.412, laps: 57, turns: 15, drs: 3, throttle: 63, topSpeed: 330, gforce: 4.1, gearChanges: 44, braking: 6,  tireStress: 8 },
  baku:          { length: 6.003, laps: 51, turns: 20, drs: 2, throttle: 75, topSpeed: 350, gforce: 3.8, gearChanges: 47, braking: 7,  tireStress: 5 },
  catalunya:     { length: 4.675, laps: 66, turns: 16, drs: 2, throttle: 68, topSpeed: 320, gforce: 4.4, gearChanges: 49, braking: 6,  tireStress: 7 },
  hungaroring:   { length: 4.381, laps: 70, turns: 14, drs: 2, throttle: 56, topSpeed: 295, gforce: 4.4, gearChanges: 57, braking: 7,  tireStress: 7 },
  imola:         { length: 4.909, laps: 63, turns: 19, drs: 2, throttle: 72, topSpeed: 330, gforce: 4.2, gearChanges: 49, braking: 8,  tireStress: 6 },
  interlagos:    { length: 4.309, laps: 71, turns: 15, drs: 2, throttle: 72, topSpeed: 320, gforce: 4.0, gearChanges: 46, braking: 7,  tireStress: 6 },
  jeddah:        { length: 6.174, laps: 50, turns: 27, drs: 3, throttle: 79, topSpeed: 340, gforce: 4.6, gearChanges: 50, braking: 5,  tireStress: 5 },
  las_vegas:     { length: 6.201, laps: 50, turns: 17, drs: 2, throttle: 82, topSpeed: 345, gforce: 3.6, gearChanges: 48, braking: 5,  tireStress: 4 },
  losail:        { length: 5.380, laps: 57, turns: 16, drs: 2, throttle: 70, topSpeed: 315, gforce: 4.3, gearChanges: 47, braking: 5,  tireStress: 9 },
  marina_bay:    { length: 4.940, laps: 62, turns: 19, drs: 3, throttle: 54, topSpeed: 305, gforce: 4.1, gearChanges: 61, braking: 9,  tireStress: 8 },
  miami:         { length: 5.412, laps: 57, turns: 19, drs: 3, throttle: 67, topSpeed: 320, gforce: 3.8, gearChanges: 54, braking: 7,  tireStress: 7 },
  monaco:        { length: 3.337, laps: 78, turns: 19, drs: 1, throttle: 48, topSpeed: 285, gforce: 3.4, gearChanges: 47, braking: 10, tireStress: 5 },
  monza:         { length: 5.793, laps: 53, turns: 11, drs: 2, throttle: 83, topSpeed: 362, gforce: 2.8, gearChanges: 37, braking: 4,  tireStress: 3 },
  americas:      { length: 5.513, laps: 56, turns: 20, drs: 2, throttle: 64, topSpeed: 320, gforce: 4.5, gearChanges: 55, braking: 7,  tireStress: 7 },
  red_bull_ring: { length: 4.318, laps: 71, turns: 10, drs: 3, throttle: 79, topSpeed: 330, gforce: 4.2, gearChanges: 38, braking: 5,  tireStress: 5 },
  rodriguez:     { length: 4.304, laps: 71, turns: 17, drs: 2, throttle: 73, topSpeed: 360, gforce: 3.5, gearChanges: 48, braking: 5,  tireStress: 4 },
  shanghai:      { length: 5.451, laps: 56, turns: 16, drs: 2, throttle: 67, topSpeed: 327, gforce: 4.1, gearChanges: 52, braking: 6,  tireStress: 7 },
  silverstone:   { length: 5.891, laps: 52, turns: 18, drs: 2, throttle: 68, topSpeed: 320, gforce: 5.3, gearChanges: 48, braking: 6,  tireStress: 8 },
  spa:           { length: 7.004, laps: 44, turns: 19, drs: 2, throttle: 71, topSpeed: 360, gforce: 4.3, gearChanges: 43, braking: 6,  tireStress: 8 },
  suzuka:        { length: 5.807, laps: 53, turns: 18, drs: 2, throttle: 65, topSpeed: 315, gforce: 4.8, gearChanges: 46, braking: 7,  tireStress: 8 },
  yas_marina:    { length: 5.281, laps: 58, turns: 16, drs: 2, throttle: 69, topSpeed: 330, gforce: 3.9, gearChanges: 54, braking: 5,  tireStress: 5 },
  zandvoort:     { length: 4.259, laps: 72, turns: 14, drs: 2, throttle: 65, topSpeed: 305, gforce: 4.7, gearChanges: 46, braking: 7,  tireStress: 8 },
}

export function getCircuitSpecs(circuitId) {
  return CIRCUIT_SPECS[circuitId] ?? null
}
