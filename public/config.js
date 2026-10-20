// Single place the backend owner edits. All values can be overridden at deploy time
// by replacing this file in the S3 bucket / EC2 web root (no rebuild required).
window.IPL_CONFIG = {
  // Default data mode. 'simulation' = built-in demo engine, 'live' = real backend.
  // Users can flip it with the header switch; the choice is stored in localStorage.
  DEFAULT_MODE: 'simulation',

  // Same-origin path when the ALB routes /api/* to EC2. Use a full URL if API is on another host.
  API_BASE_URL: '/api',

  // Optional WebSocket endpoint (API Gateway WebSocket / ALB). Empty string = HTTP polling.
  WS_URL: '',

  POLL_INTERVAL_MS: 3000,
  SIM_TICK_MS: 2500,

  // Auth: set ENABLED true once the auth service (e.g. Cognito) is ready.
  AUTH: { ENABLED: false },

  // Shown in the UI so users know where the data comes from (e.g. 'Scraped feed').
  LIVE_SOURCE_LABEL: 'Live feed'
};
