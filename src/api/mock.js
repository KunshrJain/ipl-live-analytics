// Simulation engine for demo mode. Produces the same snapshot shape the backend must return
// (see docs/BACKEND_CONTRACT.md). All teams, players and numbers here are fictional.
const A = { code: 'CKG', name: 'Coastal Kings', color: '#38bdf8' };
const B = { code: 'HLT', name: 'Highland Titans', color: '#f59e0b' };
const BAT = ['R. Verma', 'S. Iyer', 'K. Nair', 'D. Rao', 'M. Khan', 'T. Bose', 'A. Sethi', 'P. Menon', 'V. Joshi', 'N. Dutta', 'H. Singh'];
const BOWL = ['J. Pillai', 'L. Ahmed', 'C. Reddy', 'F. Dsouza', 'G. Kulkarni'];
const rnd = (n) => Math.floor(Math.random() * n);
let S, timer, listeners = new Set(), tickMs = 2500;

function newMatch() {
  const overRuns = [6, 9, 11, 4, 12, 8, 7, 4].map((r, i) => ({ over: i + 1, runs: r, wicket: i === 4 }));
  const bowlers = BOWL.map((n) => ({ name: n, balls: 0, runs: 0, wkts: 0, dots: 0, maidens: 0 }));
  overRuns.forEach((o, i) => {
    const b = bowlers[i % 5];
    b.balls += 6; b.runs += o.runs; b.dots += Math.max(0, 6 - Math.round(o.runs / 1.6));
    if (o.wicket) b.wkts++;
  });
  const batters = BAT.map((n) => ({ name: n, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, in: false }));
  Object.assign(batters[0], { runs: 22, balls: 17, fours: 3, sixes: 1, out: true, in: true });
  Object.assign(batters[1], { runs: 24, balls: 20, fours: 2, sixes: 1, in: true });
  Object.assign(batters[2], { runs: 11, balls: 11, fours: 1, in: true });
  return {
    id: 'sim-001', target: 178, runs: 61, wkts: 1, balls: 48, striker: 1, other: 2, next: 3,
    batters, bowlers, overRuns, curOver: [], recent: [], events: [], evId: 0,
    partnerships: [{ wicket: 1, pair: 'R. Verma / S. Iyer', runs: 38, balls: 28 }],
    pRuns: 23, pBalls: 22, wp: [], done: false, result: ''
  };
}

function winProb(s) {
  const left = 120 - s.balls, need = s.target - s.runs;
  if (need <= 0) return 1;
  if (s.wkts >= 10 || left <= 0) return 0;
  const exp = left * 1.22 * Math.sqrt((10 - s.wkts) / 10);
  const z = (exp - need) / (Math.sqrt(left) * 1.6 + 1);
  return Math.min(0.99, Math.max(0.01, 1 / (1 + Math.exp(-1.7 * z))));
}

function pushEvent(type, text) {
  S.events.unshift({ id: ++S.evId, type, text, over: ov(), ts: new Date().toISOString() });
  S.events = S.events.slice(0, 30);
}
const ov = () => Math.floor(S.balls / 6) + '.' + (S.balls % 6);

function seedWp() {
  S.wp = [];
  let cum = 0;
  S.overRuns.forEach((o, i) => {
    cum += o.runs;
    S.wp.push({ ball: (i + 1) * 6, p: winProb({ target: S.target, runs: cum, wkts: i >= 4 ? 1 : 0, balls: (i + 1) * 6 }) });
  });
}

function ball() {
  if (S.done) return;
  const r = Math.random();
  const b = S.batters[S.striker], bw = S.bowlers[Math.floor(S.balls / 6) % 5];
  const o = ov();
  let runs = 0, wicket = false, label;
  if (r < 0.05) wicket = true;
  else if (r < 0.37) runs = 0;
  else if (r < 0.67) runs = 1;
  else if (r < 0.75) runs = 2;
  else if (r < 0.76) runs = 3;
  else if (r < 0.88) runs = 4;
  else runs = 6;
  S.balls++; S.runs += runs; S.pRuns += runs; S.pBalls++;
  b.balls++; b.runs += runs; bw.balls++; bw.runs += runs;
  if (runs === 4) b.fours++;
  if (runs === 6) b.sixes++;
  if (runs === 0 && !wicket) bw.dots++;
  label = wicket ? 'W' : runs === 0 ? '•' : String(runs);
  S.curOver.push(runs);
  S.recent.unshift({ over: o, label, runs, wicket });
  S.recent = S.recent.slice(0, 18);
  if (runs === 6) pushEvent('SIX', b.name + ' hits a six off ' + bw.name);
  if (runs === 4) pushEvent('FOUR', b.name + ' finds the boundary');
  if (runs > 0 && b.runs >= 50 && b.runs - runs < 50) pushEvent('MILESTONE', b.name + ' reaches fifty (' + b.runs + ' off ' + b.balls + ')');
  if (S.pRuns >= 50 && S.pRuns - runs < 50) pushEvent('MILESTONE', 'Fifty partnership: ' + S.batters[S.striker].name + ' / ' + S.batters[S.other].name);
  if (wicket) {
    b.out = true; S.wkts++; bw.wkts++;
    S.partnerships.push({ wicket: S.wkts, pair: b.name + ' / ' + S.batters[S.other].name, runs: S.pRuns, balls: S.pBalls });
    pushEvent('WICKET', b.name + ' b ' + bw.name + ' ' + b.runs + ' (' + b.balls + ')');
    S.pRuns = 0; S.pBalls = 0;
    if (S.next < 11) { S.striker = S.next; S.batters[S.next].in = true; S.next++; }
  } else if (runs % 2 === 1) [S.striker, S.other] = [S.other, S.striker];
  if (S.balls % 6 === 0) {
    const sum = S.curOver.reduce((a, c) => a + c, 0);
    S.overRuns.push({ over: S.balls / 6, runs: sum, wicket: S.recent.slice(0, 6).some((x) => x.wicket) });
    if (sum === 0) bw.maidens++;
    S.curOver = [];
    [S.striker, S.other] = [S.other, S.striker];
  }
  S.wp.push({ ball: S.balls, p: winProb(S) });
  if (S.runs >= S.target) { S.done = true; S.result = A.name + ' won by ' + (10 - S.wkts) + ' wickets'; }
  else if (S.wkts >= 10 || S.balls >= 120) { S.done = true; S.result = B.name + ' won by ' + (S.target - S.runs - 1) + ' runs'; }
  if (S.done) { pushEvent('RESULT', S.result); setTimeout(() => { S = newMatch(); seedWp(); emit(); }, 12000); }
}

const fmt = (n) => Math.round(n * 10) / 10;
function snapshot() {
  const left = 120 - S.balls, need = S.target - S.runs, overs = S.balls / 6;
  const wp = S.wp.length ? S.wp[S.wp.length - 1].p : 0.5;
  const bi = Math.floor(Math.max(S.balls - 1, 0) / 6) % 5;
  const bw = S.bowlers[S.done ? bi : Math.floor(S.balls / 6) % 5];
  const bat = (x) => ({ name: x.name, runs: x.runs, balls: x.balls, fours: x.fours, sixes: x.sixes, sr: x.balls ? fmt((x.runs / x.balls) * 100) : 0 });
  return {
    source: 'simulation',
    updatedAt: new Date().toISOString(),
    match: { id: S.id, title: A.name + ' vs ' + B.name, venue: 'Demo Stadium', series: 'Simulated League', status: S.done ? 'COMPLETED' : 'LIVE', innings: 2, result: S.result },
    teams: { batting: A, bowling: B },
    score: { runs: S.runs, wickets: S.wkts, overs: Math.floor(S.balls / 6) + '.' + (S.balls % 6), balls: S.balls, target: S.target, needed: Math.max(0, need), ballsLeft: left },
    batters: [S.striker, S.other].map((i) => ({ ...bat(S.batters[i]), onStrike: i === S.striker })),
    bowler: { name: bw.name, overs: Math.floor(bw.balls / 6) + '.' + (bw.balls % 6), runs: bw.runs, wickets: bw.wkts, econ: bw.balls ? fmt((bw.runs / bw.balls) * 6) : 0 },
    recentBalls: S.recent,
    winProbability: { batting: wp, bowling: 1 - wp, timeline: S.wp },
    runRate: { current: overs ? fmt(S.runs / overs) : 0, required: left ? fmt((Math.max(0, need) / left) * 6) : 0, projectedTotal: overs ? Math.round((S.runs / overs) * 20) : 0 },
    partnership: { runs: S.pRuns, balls: S.pBalls, batters: [S.batters[S.striker].name, S.batters[S.other].name] },
    partnerships: S.partnerships,
    overRuns: S.overRuns,
    bowling: S.bowlers.map((x) => ({ name: x.name, overs: Math.floor(x.balls / 6) + '.' + (x.balls % 6), maidens: x.maidens, runs: x.runs, wickets: x.wkts, econ: x.balls ? fmt((x.runs / x.balls) * 6) : 0, dotPct: x.balls ? Math.round((x.dots / x.balls) * 100) : 0 })),
    batting: S.batters.filter((x) => x.in).map((x) => ({ ...bat(x), status: x.out ? 'out' : 'not out' })),
    events: S.events
  };
}

function emit() { const snap = snapshot(); listeners.forEach((f) => f(snap)); }
function start() { if (!timer) timer = setInterval(() => { ball(); emit(); }, tickMs); }
function stop() { clearInterval(timer); timer = null; }

S = newMatch(); seedWp();

export const mock = {
  listMatches: async () => [{ id: S.id, title: A.name + ' vs ' + B.name, status: 'LIVE', venue: 'Demo Stadium' }],
  getState: async () => snapshot(),
  compare: async () => ({
    a: { code: A.code, name: A.name, metrics: { 'Avg powerplay score': 52, 'Avg death-over run rate': 10.4, 'Boundary %': 58, 'Bowling economy': 8.1, 'Dot ball %': 41, 'Win % (last 10)': 60 } },
    b: { code: B.code, name: B.name, metrics: { 'Avg powerplay score': 47, 'Avg death-over run rate': 11.2, 'Boundary %': 54, 'Bowling economy': 8.6, 'Dot ball %': 38, 'Win % (last 10)': 50 } }
  }),
  history: async () => [
    { season: '2025', date: '2025-04-12', teams: 'CKG v HLT', result: 'CKG won by 6 wkts', topScorer: 'R. Verma 71' },
    { season: '2025', date: '2025-05-03', teams: 'HLT v CKG', result: 'HLT won by 14 runs', topScorer: 'D. Rao 64' },
    { season: '2024', date: '2024-04-20', teams: 'CKG v HLT', result: 'CKG won by 3 wkts', topScorer: 'S. Iyer 58' },
    { season: '2024', date: '2024-05-11', teams: 'HLT v CKG', result: 'HLT won by 22 runs', topScorer: 'K. Nair 49' }
  ],
  login: async (u) => ({ user: { name: u || 'demo' }, token: 'demo' }),
  subscribeNotifications: async () => ({ ok: true }),
  health: async () => ({ status: 'ok', mode: 'simulation' }),
  // simulation-only controls
  onSnapshot(fn) { listeners.add(fn); start(); fn(snapshot()); return () => { listeners.delete(fn); if (!listeners.size) stop(); }; },
  setSpeed(ms) { tickMs = ms; if (timer) { stop(); start(); } },
  restart() { S = newMatch(); seedWp(); emit(); }
};
