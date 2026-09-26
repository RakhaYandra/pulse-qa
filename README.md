# pulse-qa

> Ecosystem: [api](https://github.com/RakhaYandra/pulse) · [web](https://github.com/RakhaYandra/pulse-web) · [docs](https://github.com/RakhaYandra/pulse-docs/releases) · [data](https://github.com/RakhaYandra/pulse-data) · [qa](https://github.com/RakhaYandra/pulse-qa) · [ops](https://github.com/RakhaYandra/pulse-ops)

Quality assurance for [Pulse](https://github.com/RakhaYandra/pulse):
API contract tests, black-box E2E, and the performance benchmark rig.
Strategy: [`test-plan.md`](test-plan.md).

## Contents

| Path | Purpose | Gate |
|---|---|---|
| `collection.json` | Newman contract, 22 requests (auth, monitors, reads, reports) | 22/22 vs local API |
| `e2e/` | Playwright, 7 tests (CRUD, validation, pause, detail, incident click-through, reports) | 7/7 vs local API + web |
| `bench/` | Deterministic stub + seeder + runner + guards + summary results | throughput, qmax 0, 0 overdue, incident accuracy |

Run contract: `npx newman run collection.json --env-var baseUrl=http://localhost:8080`.
Run E2E: `npm install --prefix e2e && BASE_URL=http://localhost:5173 npm test --prefix e2e`
(needs API + web running). Run perf: `./bench/run.sh [N=100] [W=2] [D=600]`.
