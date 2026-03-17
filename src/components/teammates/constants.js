export const SLOT_COLORS = ['#e8002d', '#27F4D2', '#FF8000']

export const ERA_COLORS = [
  '#e10600', '#27F4D2', '#FF8000', '#a855f7',
  '#22c55e', '#f5c518', '#3b82f6', '#ec4899',
]

export const FEATURED = [
  { driverId: 'hamilton',           name: 'Lewis Hamilton',  era: '2007–2025', titles: 7, note: '7 titles · The Hammer' },
  { driverId: 'michael_schumacher', name: 'M. Schumacher',   era: '1991–2012', titles: 7, note: '7 titles · The Káiser' },
  { driverId: 'alonso',             name: 'Fernando Alonso', era: '2001–',     titles: 2, note: '2 titles · Magic Alonso' },
  { driverId: 'max_verstappen',     name: 'Max Verstappen',  era: '2015–',     titles: 4, note: '4 titles · The Flying Dutchman' },
  { driverId: 'senna',              name: 'Ayrton Senna',    era: '1984–1994', titles: 3, note: '3 titles · Rain Master' },
  { driverId: 'prost',              name: 'Alain Prost',     era: '1980–1993', titles: 4, note: '4 titles · The Professor' },
]

export const RIVALRIES = [
  { a: { driverId: 'hamilton',           name: 'Lewis Hamilton'   }, b: { driverId: 'rosberg',            name: 'Nico Rosberg'     }, team: 'Mercedes',            years: '2013–2016', note: 'The title that tore a friendship apart' },
  { a: { driverId: 'senna',              name: 'Ayrton Senna'     }, b: { driverId: 'prost',               name: 'Alain Prost'      }, team: 'McLaren',              years: '1988–1989', note: 'The greatest rivalry in F1 history' },
  { a: { driverId: 'vettel',             name: 'Sebastian Vettel' }, b: { driverId: 'webber',              name: 'Mark Webber'      }, team: 'Red Bull',             years: '2009–2013', note: 'Multi 21, Seb, Multi 21' },
  { a: { driverId: 'alonso',             name: 'Fernando Alonso'  }, b: { driverId: 'hamilton',            name: 'Lewis Hamilton'   }, team: 'McLaren',              years: '2007',      note: 'Rookie vs champion — both left empty-handed' },
  { a: { driverId: 'max_verstappen',     name: 'Max Verstappen'   }, b: { driverId: 'perez',               name: 'Sergio Pérez'     }, team: 'Red Bull',             years: '2021–2024', note: 'Dominant duo turned bitter rivalry' },
  { a: { driverId: 'michael_schumacher', name: 'M. Schumacher'    }, b: { driverId: 'barrichello',         name: 'R. Barrichello'   }, team: 'Ferrari',              years: '2000–2005', note: 'Six titles, one clear hierarchy' },
  { a: { driverId: 'leclerc',            name: 'Charles Leclerc'  }, b: { driverId: 'sainz',               name: 'Carlos Sainz'     }, team: 'Ferrari',              years: '2019–2024', note: 'Close, respectful — and fiercely competitive' },
  { a: { driverId: 'norris',             name: 'Lando Norris'     }, b: { driverId: 'piastri',             name: 'Oscar Piastri'    }, team: 'McLaren',              years: '2023–',     note: 'The new generation battle for McLaren' },
  { a: { driverId: 'alonso',             name: 'Fernando Alonso'  }, b: { driverId: 'michael_schumacher',  name: 'M. Schumacher'    }, team: 'Championship rivals',  years: '2003–2006', note: 'Alonso ended the Schumacher era — twice' },
]
