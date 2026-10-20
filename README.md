# IPL Live Analytics Platform: Frontend

Static, dependency-free frontend (HTML, CSS, vanilla JS). No build step.

## Run locally
```
python3 -m http.server 8080
```
Open http://localhost:8080. It starts in Simulation mode.

## Structure
- `index.html`: single page app (hash routes: live, analytics, players, compare, history, platform).
- `js/config.js`: all backend settings. Edit this first.
- `js/api.js`: data layer (live HTTP/WebSocket or simulation).
- `js/mock.js`: simulation engine (fictional data).
- `js/charts.js`, `js/app.js`, `css/styles.css`.
- `health.json`: static health check target.
- `docs/BACKEND_CONTRACT.md`: endpoints and snapshot schema.
- `deploy/`: S3 sync script and nginx config for EC2.

## Connect to AWS
1. Implement endpoints in `docs/BACKEND_CONTRACT.md` on EC2.
2. Set ALB rules: `/api/*` to EC2, everything else to S3 or nginx.
3. Set `DEFAULT_MODE: 'live'` in `js/config.js` (and `API_BASE_URL` / `WS_URL` if needed).
4. Upload: `deploy/sync-s3.sh <bucket>`.

Users can also flip Simulation / Live from the header switch.

This output is for internal reference only. Please review and verify all information before use. This does not constitute financial, legal, or investment advice.
