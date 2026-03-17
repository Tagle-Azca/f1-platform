<table>
  <tr>
    <td>
      <h1>F1 Intelligence Platform</h1>
      <p>A full-stack Formula 1 data platform combining three specialized databases to serve historical race data, real-time telemetry, and driver relationship graphs.</p>
    </td>
    <td align="center">
      <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
      <br>
      <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
      <br>
      <img src="https://img.shields.io/badge/Cassandra-1287B1?style=for-the-badge&logo=apache-cassandra&logoColor=white" />
      <br>
      <img src="https://img.shields.io/badge/Dgraph-E51B23?style=for-the-badge&logo=dgraph&logoColor=white" />
    </td>
  </tr>
</table>
---

## What it does

| Section | Description | Database |
|---|---|---|
| **Home** | Dashboard — last race results, next session countdown, DB health | MongoDB |
| **Next Race** | Countdown, full weekend schedule, circuit map and history | MongoDB |
| **Drivers** | Driver encyclopedia with career stats and profiles | MongoDB |
| **Races** | Season calendar and race detail pages (FP / Qualifying / Race tabs) | MongoDB |
| **Circuits** | World map, circuit DNA radar chart, all-time winners | MongoDB |
| **Standings** | Driver and constructor championship by season | MongoDB |
| **Performance Hub** | Lap times, sector splits, pit stops — 2023 onward | Cassandra |
| **Tire Strategy** | Compound stint chart per driver for any race | Cassandra |
| **Race Pace** | Lap time comparison across drivers in a race | Cassandra |
| **Teammate History** | Career graph — teammates, teams and shared seasons | Dgraph |
| **Ego Graph** | Interactive force-directed driver–team connection graph | Dgraph |

---

## Architecture

```
f1-platform/          ← React frontend (Vite · port 5173)
f1dbBack/             ← Express API (port 8741)
  ├── MongoDB          ← historical data: drivers, circuits, races (from 1950)
  ├── Cassandra        ← telemetry: lap times, pit stops, tire stints (2023+)
  └── Dgraph           ← relationship graph: driver ↔ team ↔ teammate
```

Data is fetched from **Jolpica F1 API** (historical) and **OpenF1 API** (2023+ telemetry) by seed scripts. The frontend never touches the databases directly — everything goes through the API.

---

## Requirements

- Node.js 18+
- Docker + Docker Compose
- npm

---

## Getting started

### 1 · Clone both repos

```bash
git clone git@github.com:Tagle-Azca/f1-platform.git f1-platform
git clone git@github.com:Tagle-Azca/f1Backend.git   f1dbBack
```

### 2 · Set up the backend

```bash
cd f1dbBack
npm install
cp .env.example .env   # default values work out of the box
```

**Start the databases** (Docker required):

```bash
npm run db:up
```

> Cassandra takes ~60 s to be ready on first boot. Check with `npm run db:logs`.

**Seed the databases:**

```bash
# Seed everything at once (recommended to start)
npm run seed

# Or individually:
npm run seed:mongo        # historical data
npm run seed:cassandra    # telemetry 2023+
npm run seed:dgraph       # relationship graph

# Full MongoDB history from 1950 (~12 h)
npm run seed:history
```

Optional extras:

```bash
npm run fetch:photos      # download driver photos
npm run fetch:circuits    # download circuit track SVGs
```

**Start the API server:**

```bash
npm run dev     # development (nodemon, auto-reload)
npm start       # production
```

API available at **http://localhost:8741**.

---

### 3 · Set up the frontend

```bash
cd f1-platform
npm install
```

Create the `.env` file:

```env
VITE_API_URL=http://localhost:8741
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:5173**.

---

### Quick start — three terminals

```bash
# Terminal 1 — databases
cd f1dbBack && npm run db:up

# Terminal 2 — backend
cd f1dbBack && npm run dev

# Terminal 3 — frontend
cd f1-platform && npm run dev
```

---

## Environment variables

### Backend — `f1dbBack/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8741` | API port |
| `MONGO_URI` | `mongodb://localhost:27017/f1_platform` | MongoDB connection string |
| `CASSANDRA_HOST` | `127.0.0.1` | Cassandra host |
| `CASSANDRA_PORT` | `9042` | Cassandra port |
| `CASSANDRA_KEYSPACE` | `f1_telemetry` | Cassandra keyspace |
| `CASSANDRA_DC` | `datacenter1` | Cassandra datacenter |
| `DGRAPH_URL` | `localhost:9080` | Dgraph gRPC address |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

### Frontend — `f1-platform/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8741` | Backend API base URL |

---

## API endpoints

```
GET /api/dashboard                          next race, last session, top standings
GET /api/drivers                            driver list
GET /api/drivers/:id                        driver profile
GET /api/races?season=2024                  races for a season
GET /api/races/:season/:round               race detail
GET /api/circuits                           all circuits
GET /api/circuits/:id                       single circuit
GET /api/standings?season=2024              driver championship
GET /api/stats/circuit/:id                  circuit history
GET /api/telemetry/races                    races with available telemetry
GET /api/telemetry/laps/:raceId/:driverId   lap times
GET /api/telemetry/pitstops/:raceId/:driverId pit stops
GET /api/telemetry/strategy/:raceId         full tire strategy
GET /api/graph/drivers?season=2024          driver-team graph (Dgraph)
GET /api/graph/driver/:driverId             single driver connections
GET /api/search?q=alonso                    global search
```

---

## Tech stack

**Frontend**
- React 19 + Vite
- React Router DOM v7
- Tailwind CSS v3
- Framer Motion — page transitions and animations
- Recharts — telemetry charts
- React-Leaflet — world circuit map
- React Force Graph — relationship graph visualization
- Lucide React — icons

**Backend**
- Node.js + Express (ES modules)
- Mongoose — MongoDB ODM
- cassandra-driver
- dgraph-js + gRPC

**Databases (Docker)**
- MongoDB 7
- Cassandra 4.1
- Dgraph standalone

---

## Project structure

```
f1-platform/
├── src/
│   ├── pages/              one file per route
│   ├── components/
│   │   ├── layout/         Navbar, PageWrapper, PageHeader
│   │   ├── ui/             Panel, StatCard, AccentBanner, EmptyState, etc.
│   │   ├── telemetry/      LapTooltip, SectorTooltip, ReliabilityBar
│   │   ├── circuits/       CircuitDetailPanel, CircuitDNAPanel, GhostLapsPanel
│   │   ├── teammates/      DriverCard, DriverSearch, ComparisonPanel, FeaturedDrivers
│   │   ├── nextrace/       WeekendSchedulePanel
│   │   └── home/           LastSessionPanel, dashboard widgets
│   ├── hooks/              useBreakpoint, useCountdown, useGraphCanvas
│   ├── services/api.js     all fetch calls — single access point to the backend
│   └── utils/              teamColors, flags, sessionConfig

f1dbBack/
├── server.js               Express entry point
├── src/
│   ├── config/             mongodb.js, cassandra.js, dgraph.js
│   ├── models/             Driver, Circuit, Race (Mongoose schemas)
│   ├── routes/             one router per resource
│   └── controllers/        business logic
└── scripts/
    ├── seed.js             master seed script
    ├── fetchPhotos.js      driver photo downloader
    └── fetchCircuitLayouts.js  circuit SVG downloader
```

---

## Contributing

1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b feature/my-improvement
   ```

2. **Keep pages thin** — if a component grows past ~80 lines, extract it into `src/components/<domain>/`. Pages should only hold state and orchestration.

3. **Naming conventions:**
   - Pages: `PascalCase` in `src/pages/`
   - Components: `PascalCase` in `src/components/<domain>/`
   - Hooks: `camelCase` prefixed with `use` in `src/hooks/`
   - Utilities: `camelCase` in `src/utils/`

4. **Design tokens** — use the existing CSS variables (`--f1-red`, `--text-primary`, `--cassandra-color`, `.card`, etc.). Avoid hardcoding colors that already exist as variables.

5. **API calls** — new routes go in `src/routes/` with a matching controller in `src/controllers/`. The frontend consumes them only through `src/services/api.js`.

6. **Lint before opening a PR:**
   ```bash
   cd f1-platform && npm run lint
   ```

7. Open a **Pull Request** with a short description of what changed and why.

### Good first issues

- Add support for more historical seasons in the telemetry seeder
- Add a lap time delta chart to the Race Detail page
- Add constructor nationality flags to the standings table
- Improve mobile layout for the Circuits map
- Add a dark/light theme toggle

---

## License

MIT
