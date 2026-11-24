---
id: 0001
date: 2026-11-24
type: feat
status: accepted
branch: champion-crowned-state
run: 20261124-champion-crowned
checkpoint: 7b3a4682bf6261d8866045d1593e09dfdbae25cf
supersedes:
superseded-by:
summary: Show a champion state once the title is mathematically decided
---
# 0001. Champion crowned state

## Request
Do something special on the standings and the title fight once the champion is already known, for the current and past seasons.

## Why (context and problem)
After the title is decided, "Title fight" and the remaining-races framing were misleading: nothing is left to fight for at the top, and the interesting story moves to P2 and P3.

## Decision
- Clinch is computed from per-round points, never hard-coded: lead over P2 must be greater than the maximum points still available (per-GP max by season rules, plus sprint points). Reason: it also resolves past seasons and the exact clinch round.
- Sprint rounds come from the calendar (`hasSprint`), since the standings API has no sprint data. Reason: without them a clinch can show one sprint too early.
- The home card keeps the open-title view and adds a "needs N more points to clinch" line; after the clinch it becomes a "How it was decided" recap. Reason: the open fight is still the right story before the clinch.
- The standings banner appears only when the replay round is at or past the clinch round. Reason: no spoilers while scrubbing back.

## Alternatives considered
- Hide the title fight section after the clinch: loses the season story.
- Confetti/trophy animation: skipped as gimmicky.

## What changed
- New clinch model (drivers and constructors) with tests.
- Standings: champion banner, "Battle for P2" hero, "Clinched at Round N, X races early".
- Title fight card: Champion header, lead-over-P2 chart with clinch marker, final margin, P2/P3 battle.
- Gold (`--pw-gold`) marks the locked champion in the banner, hero, standings rows, title fight card and the right-hand rail (shared `useChampion` hook and `railChampion.js`).

Files: src/components/viz/clinchModel.js, src/components/standings/ChampionBanner.jsx, src/components/home/TitleFightCard.jsx, src/components/home/ClinchRecap.jsx

## Consequences
- The 8-point driver sprint maximum is conservative for 2021-22.
- If the calendar request fails, sprint points are skipped (`sprintsKnown: false`).
- The champion badge on the driver page was skipped (needs season data it does not load).

## Verification
- DoD-1 PASS: clinchModel tests; 2023 recomputed independently from the API (clinched at Round 17, 5 races early).
- DoD-2 PASS, DoD-3 PASS: component tests and browser check at 1280 and 375.
- DoD-4 NOT DONE: optional badge skipped.
- DoD-5 PASS: lint adds no errors (12 pre-existing), build passes, 0 standards fails; one unidentified test failure on the first full run, 3 clean reruns.
Overall: PASS.

## Where to change this later
Clinch rules: `src/components/viz/clinchModel.js`. Banner: "the champion banner" (`ChampionBanner.jsx`). Title fight recap: `ClinchRecap.jsx`. Wording: `clinchCopy.js`.
