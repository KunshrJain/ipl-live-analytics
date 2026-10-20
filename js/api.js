// Data layer. The UI only talks to window.IPL_API; swap modes without touching UI code.
// Contract: docs/BACKEND_CONTRACT.md
(function () {
  const C = window.IPL_CONFIG;
  const KEY = 'ipl.mode';
  let token = null;
  let mode = (function () { try { return localStorage.getItem(KEY) || C.DEFAULT_MODE; } catch (e) { return C.DEFAULT_MODE; } })();

  async function http(path, opts = {}) {
    const res = await fetch(C.API_BASE_URL + path, {
      credentials: 'include',
      ...opts,
      headers: { Accept: 'application/json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + path);
    return res.json();
  }
  const post = (p, b) => http(p, { method: 'POST', body: JSON.stringify(b) });

  const live = {
    listMatches: () => http('/matches'),
    getState: (id) => http('/matches/' + encodeURIComponent(id) + '/state'),
    compare: (a, b) => http('/teams/compare?a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b)),
    history: (team) => http('/history' + (team ? '?team=' + encodeURIComponent(team) : '')),
    login: (username, password) => post('/auth/login', { username, password }),
    subscribeNotifications: (prefs) => post('/notifications/subscribe', prefs),
    health: () => http('/health')
  };
  const cur = () => (mode === 'simulation' ? window.IPL_MOCK : live);

  // Subscribe to snapshots. Uses WebSocket when WS_URL is set, otherwise polls /state.
  function subscribe(matchId, onSnap, onStatus) {
    if (mode === 'simulation') { onStatus('sim'); return window.IPL_MOCK.onSnapshot(onSnap); }
    let stopped = false, ws, t;
    const poll = async () => {
      if (stopped) return;
      try { onSnap(await live.getState(matchId)); onStatus('live'); } catch (e) { onStatus('error'); }
      t = setTimeout(poll, C.POLL_INTERVAL_MS);
    };
    if (C.WS_URL) {
      const open = () => {
        ws = new WebSocket(C.WS_URL.replace(/\/$/, '') + '/' + encodeURIComponent(matchId));
        ws.onopen = () => onStatus('live');
        ws.onmessage = (m) => { try { const d = JSON.parse(m.data); onSnap(d.payload || d); } catch (e) { /* ignore */ } };
        ws.onclose = () => { if (!stopped) { onStatus('error'); t = setTimeout(open, 3000); } };
      };
      open();
    } else poll();
    return () => { stopped = true; clearTimeout(t); if (ws) ws.close(); };
  }

  window.IPL_API = {
    get mode() { return mode; },
    setMode(m) { mode = m; try { localStorage.setItem(KEY, m); } catch (e) { /* ignore */ } },
    setToken(t) { token = t; },
    subscribe,
    listMatches: () => cur().listMatches(),
    compare: (a, b) => cur().compare(a, b),
    history: (t) => cur().history(t),
    login: (u, p) => cur().login(u, p),
    subscribeNotifications: (p) => cur().subscribeNotifications(p),
    health: () => cur().health()
  };
})();
