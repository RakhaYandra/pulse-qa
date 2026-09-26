# Pulse QA — Test Plan

Strategy: unit (backend, in `pulse` repo) → contract (Newman, here) →
E2E black-box (Playwright, here) → engine live procedures → perf gates
(bench rig, here). No mocks of the system under test; stub only for
external targets (`bench/stub`).

## Layers

| Layer | Location | Gate |
|---|---|---|
| Go unit | `pulse/backend` (`go test ./...`) | domain + usecase (fake repos) + checker + SSRF + rate limit, all green |
| API contract | `collection.json` (Newman, 22 requests) | 22/22 vs local API |
| E2E UI | `e2e/` (Playwright, 7 tests) | 7/7 vs local API + web |
| Engine live | procedure below | OPEN→RESOLVED observed on real stack |
| Perf | `bench/run.sh` | throughput + qmax + overdue + incident accuracy, see bench results |

## Engine live procedure (incident lifecycle)

1. Register account, create monitor `GET https://example.com/does-not-exist-404`
   (interval 60s, failure 2, recovery 1).
2. Wait ~3 min → incident OPEN (2 consecutive 404s).
3. PATCH url to `https://example.com` → next successes → RESOLVED.
4. Assert via `GET /incidents` + `GET /monitors/:id/checks`.

## Perf gates (`bench/run.sh [N] [W] [D]`)

Pre-flight aborts on dead stub, missing allowlist, or zero checks in 75s.
Validity exit codes: false incidents on healthy targets or exploding queue
fail the run. Reference results in `bench/results/bench_*.json`.

## Housekeeping

`bench/clean.sql` after every run (bench + e2e leftovers). Never commit
`bench/results/samples_*.jsonl` (gitignored).
