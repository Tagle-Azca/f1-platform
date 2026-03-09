# F1 Intelligence Platform — Frontend

Aplicación React que visualiza datos de Fórmula 1 desde tres bases de datos distintas: MongoDB, Cassandra y Dgraph.

---

## Stack

| Tecnología | Uso |
|---|---|
| React 19 + Vite | Framework y bundler |
| React Router DOM | Navegación entre páginas |
| Recharts | Gráfica de campeonato (LineChart) |
| react-force-graph-2d | Grafo de red ego (canvas 2D) |
| Framer Motion | Transiciones de página |

---

## Estructura de `src/`

```
src/
├── pages/          ← orquestadores: estado + composición
├── components/     ← piezas visuales agrupadas por dominio
├── hooks/          ← lógica React sin render
├── utils/          ← funciones puras sin React
└── services/       ← único punto de contacto con el backend
```

---

## Regla de oro — dónde va cada cosa

| Dónde | Criterio |
|---|---|
| `utils/` | Función pura de JS, no usa React |
| `hooks/` | Usa React (useState, useCallback…) pero no renderiza |
| `components/` | Renderiza JSX, recibe todo por props, no llama al API |
| `pages/` | Dueño del estado, llama al API, ensambla componentes |

---

## Pages — el director de orquesta

Cada page hace solo dos cosas: **manejar estado** y **ensamblar componentes**.

```jsx
// GraphPage.jsx (~85 líneas)
export default function GraphPage() {
  // 1. Estado
  const [activeDriver, setActiveDriver] = useState(null)

  // 2. Lógica (llamadas al API)
  function loadEgo(driverId) { ... }

  // 3. Composición — sin HTML complejo
  return (
    <PageWrapper>
      <DriverSearch onSelect={handleSelect} />
      <GraphCanvas graphData={graphData} ... />
      <EgoSidebar activeDriver={activeDriver} ... />
    </PageWrapper>
  )
}
```

Si una page supera ~150 líneas, es señal de que algo debería extraerse a un componente.

### Pages disponibles

| Ruta | Page | Base de datos |
|---|---|---|
| `/` | HomePage | — |
| `/graph` | GraphPage | Dgraph |
| `/encyclopedia` | EncyclopediaPage | MongoDB |
| `/standings` | StandingsPage | MongoDB |
| `/telemetry` | TelemetryPage | Cassandra |
| `/drivers` | DriversPage | MongoDB |
| `/races` | RacesPage | MongoDB |
| `/circuits` | CircuitsPage | MongoDB |

---

## Components — agrupados por dominio

En lugar de una carpeta plana, los componentes viven junto a la page que los usa.

```
components/
├── graph/
│   ├── DriverSearch.jsx   — input + autocomplete de pilotos
│   ├── GraphCanvas.jsx    — ForceGraph2D + estados vacío/carga/error + leyenda
│   └── EgoSidebar.jsx     — panel lateral: stats, debut, equipos, compañeros
│
├── standings/
│   ├── ChampionBanner.jsx    — banner del campeón con color de equipo
│   ├── ChampionshipChart.jsx — LineChart de Recharts + controles de playback
│   ├── ChartTooltip.jsx      — tooltip personalizado del gráfico
│   └── StandingsTable.jsx    — tabla lateral de clasificación + historia legendaria
│
├── encyclopedia/
│   ├── SearchBox.jsx      — buscador con autocomplete (GPs, pilotos, circuitos)
│   ├── DriverBanner.jsx   — carrusel horizontal de pilotos recientes
│   ├── DriverProfile.jsx  — ficha completa de piloto con stats y equipos
│   ├── RaceDetail.jsx     — detalle de carrera: podio, clasificación, retiros
│   └── Podium.jsx         — podio visual (P1/P2/P3)
│
└── layout/
    ├── Navbar.jsx         — barra de navegación sticky con tabs por DB
    └── PageWrapper.jsx    — wrapper con transición de Framer Motion
```

**Regla:** si un componente solo lo usa una page, vive en la carpeta de esa page. Si lo usaran dos o más pages, sube a `components/` raíz.

Los componentes **no llaman al API** ni tienen estado global. Reciben todo por props.

---

## Hooks — lógica React sin render

Un hook es una función que usa cosas de React pero no renderiza JSX.

```
hooks/
└── useGraphCanvas.js   — nodeCanvasObject, nodePointerAreaPaint para ForceGraph2D
```

```js
// Uso en GraphPage
const { nodeCanvasObject, nodePointerAreaPaint } = useGraphCanvas(imgCache, fgRef)
```

Sin el hook, GraphPage tendría ~80 líneas solo de lógica de canvas.

---

## Utils — funciones puras sin React

No usan hooks, no renderizan nada. Fáciles de probar y de importar desde cualquier lado.

```
utils/
├── graphLayout.js   — applyRadialLayout(), COLOR, LINK_COLOR, seasonRange()
├── teamColors.js    — CTOR_COLORS, driverColor(), LEGENDARY, SEASON_STORIES
└── raceUtils.js     — STATUS_COLOR, statusColor(), isFinished()
```

### graphLayout.js

- `COLOR` — colores de nodo: Driver (rojo), Team (amarillo), Teammate (gris)
- `LINK_COLOR` — colores de arista: drove_for, teammate
- `seasonRange(seasons)` — convierte `['2005','2006','2007']` → `"2005–2007"`
- `applyRadialLayout(nodes, links)` — posiciona nodos con `fx/fy`:
  - Piloto central: `fx=0, fy=0`
  - Equipos: anillo interior radio 140
  - Compañeros: anillo exterior radio 270, agrupados cerca de su equipo

### teamColors.js

- `CTOR_COLORS` — mapa `constructorId → color hex` para todos los equipos 1950–2024
- `driverColor(teamId, idx)` — devuelve color del equipo o genera uno por HSL
- `LEGENDARY` — Set de temporadas legendarias (1976, 1988, 1994, 2008, 2021…)
- `SEASON_STORIES` — narrativa corta de cada temporada legendaria

### raceUtils.js

- `STATUS_COLOR` — mapa de estado de retiro a color (accidente=rojo, motor=púrpura…)
- `statusColor(status)` — devuelve el color correspondiente al status
- `isFinished(status)` — `true` si el piloto terminó la carrera

---

## Services — único punto de contacto con el backend

Todo `fetch` pasa por `services/api.js`. Ningún componente hace fetch directamente.

```js
export const graphApi = {
  getDriverEgoGraph: (driverId) => request(`/api/graph/driver/${driverId}/ego`),
}
```

Si el backend cambia una URL, solo se toca este archivo.

### APIs disponibles

| Exportación | Endpoints |
|---|---|
| `driversApi` | `getAll`, `getById`, `getFeatured` |
| `racesApi` | `getAll`, `getBySeason`, `getByRound` |
| `circuitsApi` | `getAll`, `getById` |
| `telemetryApi` | `getLapTimes`, `getPitStops`, `getAvailableRaces` |
| `graphApi` | `getDriverNetwork`, `getDriverEgoGraph`, `getDriverNode`, `getDriverConnections` |
| `searchApi` | `search(q, limit)` |
| `statsApi` | `driverStats`, `circuitHistory`, `getSeasonStandings` |

La URL base se configura en `.env`:
```
VITE_API_URL=http://localhost:3001
```

---

## Flujo de datos completo

```
Backend Express (puerto 3001)
        ↓ HTTP
services/api.js          ← único fetch
        ↓ datos crudos
pages/ (useState)        ← dueño del estado
        ↓ props
components/              ← solo renderizan
        ↓ lógica canvas
hooks/                   ← lógica React encapsulada
        ↓ cálculos
utils/                   ← funciones puras
```

---

## Variables de entorno

```
VITE_API_URL=http://localhost:3001
```

---

## Correr en desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
```

El backend debe estar corriendo en el puerto configurado en `VITE_API_URL`.
