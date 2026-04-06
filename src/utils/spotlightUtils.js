export const CONFIDENCE_COLOR = { High: '#22c55e', Medium: '#f59e0b', Low: '#e10600' }

export function predictFinish(points, roundsDone) {
  if (!points || !roundsDone || roundsDone < 2) return null
  const avg = points / roundsDone
  if (avg >= 22) return 1
  if (avg >= 16) return 2
  if (avg >= 13) return 3
  if (avg >= 10) return 4
  if (avg >= 8)  return 5
  if (avg >= 6)  return 6
  if (avg >= 4)  return 7
  if (avg >= 2)  return 8
  if (avg >= 1)  return 9
  return null
}

export function confidenceFor(predicted, roundsDone) {
  if (!predicted || !roundsDone) return null
  if (roundsDone >= 5 && predicted <= 5)  return 'High'
  if (roundsDone >= 3 && predicted <= 10) return 'Medium'
  return 'Low'
}

export function buildInsight({ surname, position, wins, spotlightGap, remaining }) {
  if (!surname) return null
  if (position === 1 && remaining)
    return `${surname} leads the championship — ${remaining} rounds left to defend.`
  if (spotlightGap != null && remaining) {
    const maxCatch = remaining * 25
    if (spotlightGap < maxCatch * 0.3)
      return `${surname} needs ${spotlightGap}pts — title is still within reach.`
    if (spotlightGap < maxCatch * 0.7)
      return `${spotlightGap}pts back with ${remaining} rounds left — needs a run of results.`
    return `${surname} is ${spotlightGap}pts back. Every point matters now.`
  }
  if (wins > 0) return `${wins} win${wins > 1 ? 's' : ''} this season. Building momentum.`
  return `${surname} yet to win this season. Points are everything right now.`
}
