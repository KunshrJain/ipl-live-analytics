(function () {
  const C = window.IPL_CONFIG, API = window.IPL_API, CH = window.IPL_CHARTS;
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (p) => Math.round(p * 100);
  const store = {
    get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  let snap = null, unsub = null, seenEvent = 0, alerts = store.get('ipl.alerts', 'off') === 'on', matchId = null;

  // ---------- router ----------
  function route() {
    const id = (location.hash || '#live').slice(1);
    document.querySelectorAll('.page').forEach((p) => { p.hidden = p.id !== id; });
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
    if (id === 'compare') loadCompare();
    if (id === 'history') loadHistory();
    if (id === 'platform') renderCfg();
  }

  // ---------- rendering ----------
  const table = (head, rows) => '<table><thead><tr>' + head.map((h) => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map((r) => '<tr>' + r.map((c, i) => '<td' + (i ? ' class="n"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';

  function render(s) {
    snap = s;
    document.documentElement.style.setProperty('--a', s.teams.batting.color);
    document.documentElement.style.setProperty('--b', s.teams.bowling.color);
    const sc = s.score, wp = s.winProbability, rr = s.runRate;
    $('scoreboard').innerHTML =
      '<div class="sb-meta">' + esc(s.match.series) + ' &middot; ' + esc(s.match.venue) + ' <span class="pill ' + (s.match.status === 'LIVE' ? 'live' : '') + '">' + esc(s.match.status) + '</span></div>' +
      '<div class="sb-main"><div class="team"><span class="swatch" style="background:var(--a)"></span><div><b>' + esc(s.teams.batting.name) + '</b><small>Batting, chasing ' + esc(sc.target) + '</small></div></div>' +
      '<div class="big">' + esc(sc.runs) + '<span>/' + esc(sc.wickets) + '</span><small>' + esc(sc.overs) + ' ov</small></div>' +
      '<div class="team r"><div><b>' + esc(s.teams.bowling.name) + '</b><small>Bowling</small></div><span class="swatch" style="background:var(--b)"></span></div></div>' +
      '<div class="sb-foot">' + (s.match.result ? '<b>' + esc(s.match.result) + '</b>' : esc(s.teams.batting.code) + ' need <b>' + esc(sc.needed) + '</b> off <b>' + esc(sc.ballsLeft) + '</b> balls') + '</div>' +
      '<div class="wpbar" title="Win probability"><i style="width:' + pct(wp.batting) + '%;background:var(--a)"></i><i style="width:' + pct(wp.bowling) + '%;background:var(--b)"></i></div>' +
      '<div class="wplbl"><span>' + esc(s.teams.batting.code) + ' ' + pct(wp.batting) + '%</span><span>' + esc(s.teams.bowling.code) + ' ' + pct(wp.bowling) + '%</span></div>';

    $('wpNote').textContent = 'indicative model output';
    $('wpChart').innerHTML = CH.winProb(wp.timeline, s.teams.batting.color, s.teams.bowling.color);
    $('stateBox').innerHTML = '<div class="kpis">' +
      kpi('Current RR', rr.current) + kpi('Required RR', rr.required) + kpi('Projected total', rr.projectedTotal) +
      kpi('Partnership', s.partnership.runs + ' (' + s.partnership.balls + ')') + '</div>';
    $('crease').innerHTML = table(['Batter', 'R', 'B', '4s', '6s', 'SR'], s.batters.map((b) => [(b.onStrike ? '* ' : '') + b.name, b.runs, b.balls, b.fours, b.sixes, b.sr]));
    $('balls').innerHTML = s.recentBalls.map((b) => '<span class="ball ' + (b.wicket ? 'w' : b.runs >= 4 ? 'b' : '') + '" title="Over ' + esc(b.over) + '">' + esc(b.label) + '</span>').join('');
    $('bowlerBox').textContent = 'Bowler: ' + s.bowler.name + ' ' + s.bowler.overs + '-' + s.bowler.runs + '-' + s.bowler.wickets + ' (econ ' + s.bowler.econ + ')';
    $('events').innerHTML = s.events.slice(0, 8).map((e) => '<li class="ev ' + esc(e.type) + '"><b>' + esc(e.type) + '</b> ' + esc(e.text) + '<small>ov ' + esc(e.over) + '</small></li>').join('') || '<li class="muted">No events yet</li>';

    $('rrTiles').innerHTML = [['Current run rate', rr.current], ['Required run rate', rr.required], ['Projected total', rr.projectedTotal], ['Win probability', pct(wp.batting) + '%']]
      .map((t) => '<div class="card tile"><small>' + t[0] + '</small><b>' + esc(t[1]) + '</b></div>').join('');
    $('overChart').innerHTML = CH.overBars(s.overRuns, 'var(--a)', 'var(--danger)');
    $('wormChart').innerHTML = CH.worm(s.overRuns, sc.target, 'var(--a)', 'var(--muted)');
    $('partners').innerHTML = table(['Wkt', 'Pair', 'Runs', 'Balls'], s.partnerships.map((p) => [p.wicket, p.pair, p.runs, p.balls]));
    $('bowlEff').innerHTML = table(['Bowler', 'O', 'M', 'R', 'W', 'Econ', 'Dot %'], s.bowling.map((b) => [b.name, b.overs, b.maidens, b.runs, b.wickets, b.econ, b.dotPct]));
    $('batCard').innerHTML = table(['Batter', 'Status', 'R', 'B', '4s', '6s', 'SR'], s.batting.map((b) => [b.name, b.status, b.runs, b.balls, b.fours, b.sixes, b.sr]));
    $('bowlCard').innerHTML = $('bowlEff').innerHTML;
    notify(s);
  }
  const kpi = (l, v) => '<div class="kpi"><small>' + l + '</small><b>' + esc(v) + '</b></div>';

  // ---------- notifications ----------
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 5000);
  }
  function notify(s) {
    const top = s.events[0];
    if (!top) return;
    if (!seenEvent) { seenEvent = top.id; return; }
    if (top.id === seenEvent) return;
    const fresh = s.events.filter((e) => e.id > seenEvent).reverse();
    seenEvent = top.id;
    if (!alerts) return;
    fresh.filter((e) => ['WICKET', 'SIX', 'MILESTONE', 'RESULT'].includes(e.type)).forEach((e) => toast(e.type + ': ' + e.text, e.type));
  }

  // ---------- status / mode ----------
  function setStatus(k) {
    const el = $('status');
    const m = { sim: ['Simulation', 'sim'], live: [C.LIVE_SOURCE_LABEL, 'live'], error: ['Backend unreachable', 'err'] }[k] || ['Connecting', ''];
    el.textContent = m[0]; el.className = 'pill ' + m[1];
  }
  function connect() {
    if (unsub) unsub();
    seenEvent = 0;
    const sim = API.mode === 'simulation';
    $('simSwitch').checked = sim;
    $('simLbl').textContent = sim ? 'Simulation' : 'Live';
    $('simBanner').hidden = !sim;
    setStatus('');
    API.listMatches().then((ms) => {
      matchId = ms && ms[0] ? ms[0].id : null;
      if (!matchId) { setStatus('error'); return; }
      unsub = API.subscribe(matchId, render, setStatus);
    }).catch(() => setStatus('error'));
  }

  // ---------- compare / history ----------
  const LOWER_BETTER = ['Bowling economy'];
  function loadCompare() {
    API.compare('CKG', 'HLT').then((d) => {
      $('cmpHead').innerHTML = '<span><i class="swatch" style="background:var(--a)"></i>' + esc(d.a.name) + '</span><span>' + esc(d.b.name) + '<i class="swatch" style="background:var(--b)"></i></span>';
      $('cmpBody').innerHTML = CH.compareRows(d.a, d.b, LOWER_BETTER) + '<p class="muted">Lower is better for: ' + LOWER_BETTER.join(', ') + '.</p>';
    }).catch(() => { $('cmpBody').innerHTML = '<p class="muted">Comparison data unavailable.</p>'; });
  }
  function loadHistory() {
    API.history().then((rows) => {
      $('histBody').innerHTML = table(['Season', 'Date', 'Match', 'Result', 'Top scorer'], rows.map((r) => [r.season, r.date, r.teams, r.result, r.topScorer]));
    }).catch(() => { $('histBody').innerHTML = '<p class="muted">History unavailable.</p>'; });
  }

  // ---------- platform ----------
  function renderCfg() {
    const rows = [['Mode', API.mode], ['API base URL', C.API_BASE_URL], ['WebSocket URL', C.WS_URL || 'not set (HTTP polling)'], ['Poll interval', C.POLL_INTERVAL_MS + ' ms'], ['Auth', C.AUTH.ENABLED ? 'enabled' : 'disabled']];
    $('cfgBox').innerHTML = rows.map((r) => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('');
  }

  // ---------- wiring ----------
  $('simSwitch').addEventListener('change', (e) => { API.setMode(e.target.checked ? 'simulation' : 'live'); connect(); renderCfg(); });
  $('simSpeed').addEventListener('change', (e) => window.IPL_MOCK.setSpeed(+e.target.value));
  $('simRestart').addEventListener('click', () => { seenEvent = 0; window.IPL_MOCK.restart(); });
  $('healthBtn').addEventListener('click', () => {
    $('healthOut').textContent = 'Checking...';
    API.health().then((r) => { $('healthOut').textContent = 'OK: ' + JSON.stringify(r); }).catch((e) => { $('healthOut').textContent = 'Failed: ' + e.message; });
  });
  const setAlerts = () => { $('notifyBtn').textContent = 'Alerts: ' + (alerts ? 'on' : 'off'); };
  $('notifyBtn').addEventListener('click', () => {
    alerts = !alerts; store.set('ipl.alerts', alerts ? 'on' : 'off'); setAlerts();
    if (alerts) API.subscribeNotifications({ events: ['WICKET', 'SIX', 'MILESTONE'] }).catch(() => {});
  });
  const setTheme = (t) => { document.documentElement.dataset.theme = t; store.set('ipl.theme', t); };
  $('themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('loginBtn').addEventListener('click', () => $('loginDlg').showModal());
  $('loginForm').addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    API.login($('lgUser').value, $('lgPass').value).then((r) => {
      if (r.token) API.setToken(r.token);
      $('loginBtn').textContent = (r.user && r.user.name) || 'Signed in';
      $('loginDlg').close();
    }).catch(() => { $('lgErr').textContent = 'Sign in failed.'; });
  });
  window.addEventListener('hashchange', route);

  setTheme(store.get('ipl.theme', 'dark'));
  setAlerts();
  route();
  connect();
})();
