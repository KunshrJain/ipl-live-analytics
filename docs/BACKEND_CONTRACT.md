# Backend Contract

The frontend is a React build (static files). It talks to the backend only through `src/api/api.js`. Set `API_BASE_URL` (and optionally `WS_URL`) in `public/config.js` (`config.js` at the deployed root).

## Routing (ALB)
- `/` and static assets: S3 bucket (or EC2 nginx).
- `/api/*`: EC2 target group (path-based rule).
- `/health`: EC2 target group health check (returns 200).
- CORS: required only if the API is on a different origin. Allow `GET, POST, OPTIONS` and the `Authorization` header.

## Endpoints
| Method | Path | Returns |
|---|---|---|
| GET | `/api/matches` | `[{id, title, status, venue}]` (first item is shown) |
| GET | `/api/matches/{id}/state` | Snapshot (below) |
| GET | `/api/teams/compare?a=CKG&b=HLT` | `{a:{code,name,metrics:{label:number}}, b:{...}}` |
| GET | `/api/history?team=` | `[{season,date,teams,result,topScorer}]` |
| POST | `/api/auth/login` | body `{username,password}` returns `{user:{name}, token}` |
| POST | `/api/notifications/subscribe` | body `{events:[...]}` returns `{ok:true}` |
| GET | `/api/health` | `{status:"ok"}` |

## WebSocket (optional)
Connect to `WS_URL + "/" + matchId`. Each message is either a snapshot or `{type:"snapshot", payload:<snapshot>}`. Without `WS_URL` the client polls `/state` every `POLL_INTERVAL_MS`.

## Snapshot shape
See `snapshot()` in `src/api/mock.js` for a complete working example. Required keys:

```
source, updatedAt,
match{id,title,venue,series,status:"LIVE|COMPLETED",innings,result},
teams{batting{code,name,color}, bowling{code,name,color}},
score{runs,wickets,overs:"8.3",balls,target,needed,ballsLeft},
batters[{name,runs,balls,fours,sixes,sr,onStrike}],
bowler{name,overs,runs,wickets,econ},
recentBalls[{over,label,runs,wicket}]            // newest first
winProbability{batting,bowling,timeline[{ball,p}]}  // p = batting team win prob, 0..1
runRate{current,required,projectedTotal},
partnership{runs,balls,batters[2]},
partnerships[{wicket,pair,runs,balls}],
overRuns[{over,runs,wicket}],
bowling[{name,overs,maidens,runs,wickets,econ,dotPct}],
batting[{name,runs,balls,fours,sixes,sr,status}],
events[{id,type:"WICKET|SIX|FOUR|MILESTONE|RESULT",text,over,ts}]  // newest first, id increasing
```

The UI currently renders the second innings (chase). Extending to first innings needs `score.target` to be null and the "needed" line hidden.

## Data source note
The ingestion service may obtain match data by web scraping. Confirm the source's terms of use and robots policy before scraping. Keep scraping entirely in the backend; the frontend never calls third-party sites. Set `LIVE_SOURCE_LABEL` in `config.js` to name the source in the UI.

## Demo mode
The header switch toggles Simulation and Live. Simulation uses `src/api/mock.js` (fictional data, no network). The choice persists in `localStorage` (`ipl.mode`); `DEFAULT_MODE` in `config.js` sets the initial value.
