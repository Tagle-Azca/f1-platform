export const CTOR_COLORS = {
  red_bull:       '#3671C6',
  mercedes:       '#00D2BE',
  ferrari:        '#DC0000',
  mclaren:        '#FF8000',
  alpine:         '#FF87BC',
  aston_martin:   '#006F62',
  williams:       '#64C4FF',
  alphatauri:     '#5E8FAA',
  alpha_tauri:    '#5E8FAA',
  alfa:           '#B12039',
  haas:           '#B6BABD',
  renault:        '#FFD700',
  racing_point:   '#F596C8',
  toro_rosso:     '#469BFF',
  force_india:    '#F596C8',
  lotus_f1:       '#B5A225',
  lotus:          '#B5A225',
  benetton:       '#25A617',
  jordan:         '#EDA120',
  bar:            '#AAAAAA',
  jaguar:         '#228B22',
  minardi:        '#666666',
  arrows:         '#F68020',
  tyrrell:        '#1E90FF',
  brabham:        '#DDDD22',
  march:          '#CC4444',
  ligier:         '#4444FF',
  wolf:           '#888800',
  shadow:         '#444444',
  fittipaldi:     '#994400',
  surtees:        '#CC0000',
}

export function driverColor(teamId, idx) {
  return CTOR_COLORS[teamId] || `hsl(${(idx * 53 + 20) % 360}, 65%, 58%)`
}

export const LEGENDARY = new Set([
  '1976','1984','1986','1988','1989','1994','2007','2008',
  '2010','2012','2016','2019','2021',
])

export const SEASON_STORIES = {
  '1976': 'Lauda vs Hunt. Niki survives a devastating crash at Nürburgring and returns 6 weeks later. Hunt wins the title by 1 point in the rain-soaked final race.',
  '1984': 'Prost wins his first title by half a point after the Monaco rain race, where Senna was leading before the red flag.',
  '1988': 'Senna and Prost at McLaren dominate: win 15 of 16 races. Senna champion.',
  '1989': 'Senna and Prost collide intentionally in Japan. Prost champion in his final McLaren year.',
  '1994': 'Schumacher vs Hill. Senna dies at Imola. Penultimate race in Adelaide: collision between the two. Schumacher champion by 1 point.',
  '2007': 'Hamilton debuts and leads all season. Loses the title at the final race by 1 point to Räikkönen.',
  '2008': 'Hamilton champion on the final lap of the final race, overtaking Glock to take the 5th place he needed. 1 point margin.',
  '2010': 'Four drivers arrive at Abu Dhabi with a chance. Vettel champion for the first time.',
  '2012': 'Vettel recovers from last place in Brazil to win the title by 3 points over Alonso.',
  '2016': 'Rosberg wins his only world title. Hamilton wins more races but not the championship.',
  '2019': 'Hamilton wins with an 87-point margin, dominating with Mercedes.',
  '2021': 'Verstappen vs Hamilton. 20 races of razor-thin margins. Controversy in Abu Dhabi. Verstappen champion on the final lap.',
}
