# IPL Live Analytics Platform: Frontend

React 18 + Vite single page app. Builds to static files for S3 or EC2/nginx.

## Run locally
```
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
```
Starts in Simulation mode (fictional data, no backend needed).

## Structure
- `public/config.js`: all backend settings. Copied as-is into `dist/`, so it can be edited in the deployed bucket without rebuilding.
- `src/api/api.js`: data layer (live HTTP/WebSocket or simulation).
- `src/api/mock.js`: simulation engine.
- `src/hooks.js`: `useSnapshot`, `useHashRoute`, `usePersisted`.
- `src/components/`: header, login dialog, SVG charts, shared UI.
- `src/pages/`: Live, Analytics, Players, Compare, History, Platform.
- `public/health.json`: static health check target.
- `docs/BACKEND_CONTRACT.md`: endpoints and snapshot schema.
- `deploy/`: S3 sync script and nginx config for EC2.

## Connect to AWS
1. Implement the endpoints in `docs/BACKEND_CONTRACT.md` on EC2.
2. ALB rules: `/api/*` to EC2, everything else to S3 or nginx.
3. Set `DEFAULT_MODE: 'live'` in `public/config.js` (and `API_BASE_URL` / `WS_URL` if needed).
4. Deploy: `deploy/sync-s3.sh <bucket>` (builds, then syncs `dist/`).

The header switch flips Simulation / Live at runtime.

This output is for internal reference only. Please review and verify all information before use. This does not constitute financial, legal, or investment advice.
