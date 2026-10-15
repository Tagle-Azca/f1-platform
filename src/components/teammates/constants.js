// Curated entry points for the Rivalries page. Data only: no colours (team colour comes from the constructor id).
// Mostly 2022-2026; the legend matchups (Senna, Prost, Schumacher) show the no-data state until full history is seeded.
// Every id is an Ergast-style driver id as the seeded Pitwall data uses it.

/** Start-from-a-driver chips. `constructorId` is the driver's latest team in the range. */
export const FEATURED = [
  { driverId: 'max_verstappen', name: 'Max Verstappen', constructorId: 'red_bull', meta: 'Red Bull' },
  { driverId: 'hamilton', name: 'Lewis Hamilton', constructorId: 'ferrari', meta: 'Ferrari' },
  { driverId: 'norris', name: 'Lando Norris', constructorId: 'mclaren', meta: 'McLaren' },
  { driverId: 'leclerc', name: 'Charles Leclerc', constructorId: 'ferrari', meta: 'Ferrari' },
  { driverId: 'alonso', name: 'Fernando Alonso', constructorId: 'aston_martin', meta: 'Aston Martin' },
  { driverId: 'piastri', name: 'Oscar Piastri', constructorId: 'mclaren', meta: 'McLaren' },
  { driverId: 'michael_schumacher', name: 'Michael Schumacher', constructorId: 'ferrari', meta: 'Ferrari' },
  { driverId: 'senna', name: 'Ayrton Senna', constructorId: 'mclaren', meta: 'McLaren' },
]

/** Filter pills above the matchup grid, in display order. `all` shows every matchup. */
export const MATCHUP_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'title', label: 'Title fights' },
  { id: 'teammates', label: 'Teammates' },
  { id: 'classic', label: 'Classic' },
]

/**
 * Featured matchups, in feed order. `filter` is the pill it belongs to, `tag` the card's kicker; `ctorA`/`ctorB` give
 * each side its team mark. Copy (teams, years) is curated, not computed.
 */
export const MATCHUPS = [
  { a: 'max_verstappen', b: 'hamilton', filter: 'title', tag: 'Title fight', ctorA: 'red_bull', ctorB: 'mercedes', teams: 'Red Bull vs Mercedes', years: '2022-2024' },
  { a: 'alonso', b: 'hamilton', filter: 'classic', tag: 'Classic rivals', ctorA: 'aston_martin', ctorB: 'mercedes', teams: 'Aston Martin vs Mercedes', years: '2023-2026' },
  { a: 'max_verstappen', b: 'norris', filter: 'title', tag: 'Title fight', ctorA: 'red_bull', ctorB: 'mclaren', teams: 'Red Bull vs McLaren', years: '2022-2026' },
  { a: 'leclerc', b: 'max_verstappen', filter: 'classic', tag: 'Rivalry', ctorA: 'ferrari', ctorB: 'red_bull', teams: 'Ferrari vs Red Bull', years: '2022-2026' },
  { a: 'senna', b: 'prost', filter: 'classic', tag: 'Legends', ctorA: 'mclaren', ctorB: 'mclaren', teams: 'Teammates at McLaren', years: '1988-1989' },
  { a: 'alonso', b: 'michael_schumacher', filter: 'title', tag: 'Title fight', ctorA: 'renault', ctorB: 'ferrari', teams: 'Renault vs Ferrari', years: '2005-2006' },
  { a: 'hamilton', b: 'leclerc', filter: 'teammates', tag: 'Teammates', ctorA: 'ferrari', ctorB: 'ferrari', teams: 'Teammates at Ferrari', years: '2025-2026' },
  { a: 'norris', b: 'piastri', filter: 'teammates', tag: 'Teammates', ctorA: 'mclaren', ctorB: 'mclaren', teams: 'Teammates at McLaren', years: '2023-2026' },
  { a: 'hamilton', b: 'russell', filter: 'teammates', tag: 'Teammates', ctorA: 'mercedes', ctorB: 'mercedes', teams: 'Teammates at Mercedes', years: '2022-2024' },
  { a: 'alonso', b: 'stroll', filter: 'teammates', tag: 'Teammates', ctorA: 'aston_martin', ctorB: 'aston_martin', teams: 'Teammates at Aston Martin', years: '2023-2026' },
]

/** Matchup cards shown before "View all rivalries". */
export const MATCHUP_PREVIEW = 6

/** Display names for every id above (used before any load finishes). */
export const PRESET_NAMES = {
  norris: 'Lando Norris', piastri: 'Oscar Piastri', max_verstappen: 'Max Verstappen', perez: 'Sergio Pérez',
  leclerc: 'Charles Leclerc', sainz: 'Carlos Sainz', hamilton: 'Lewis Hamilton', russell: 'George Russell',
  alonso: 'Fernando Alonso', stroll: 'Lance Stroll',
  senna: 'Ayrton Senna', prost: 'Alain Prost', michael_schumacher: 'Michael Schumacher',
}
