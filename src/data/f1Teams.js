export const F1_TEAMS = [
  { id: 'red_bull',     name: 'Red Bull Racing',  short: 'RBR', color: '#3671C6', drivers: ['Max Verstappen', 'Liam Lawson'] },
  { id: 'ferrari',      name: 'Scuderia Ferrari', short: 'FER', color: '#E8002D', drivers: ['Charles Leclerc', 'Lewis Hamilton'] },
  { id: 'mercedes',     name: 'Mercedes-AMG',     short: 'MER', color: '#27F4D2', drivers: ['George Russell', 'Kimi Antonelli'] },
  { id: 'mclaren',      name: 'McLaren F1 Team',  short: 'MCL', color: '#FF8000', drivers: ['Lando Norris', 'Oscar Piastri'] },
  { id: 'aston_martin', name: 'Aston Martin',     short: 'AMR', color: '#229971', drivers: ['Fernando Alonso', 'Lance Stroll'] },
  { id: 'alpine',       name: 'BWT Alpine F1',    short: 'ALP', color: '#FF87BC', drivers: ['Pierre Gasly', 'Jack Doohan'] },
  { id: 'williams',     name: 'Williams Racing',  short: 'WIL', color: '#64C4FF', drivers: ['Alexander Albon', 'Carlos Sainz'] },
  { id: 'racing_bulls', name: 'Racing Bulls',     short: 'RB',  color: '#6692FF', drivers: ['Yuki Tsunoda', 'Isack Hadjar'] },
  { id: 'sauber',       name: 'Kick Sauber',      short: 'SAU', color: '#52E252', drivers: ['Nico Hülkenberg', 'Gabriel Bortoleto'] },
  { id: 'haas',         name: 'Haas F1 Team',     short: 'HAA', color: '#B6BABD', drivers: ['Esteban Ocon', 'Oliver Bearman'] },
]

export function getTeam(id) {
  return F1_TEAMS.find(t => t.id === id) ?? null
}
