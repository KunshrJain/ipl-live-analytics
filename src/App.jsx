import { Fragment, useEffect, useRef, useState } from 'react';
import { API } from './api/api.js';
import { useHashRoute, usePersisted, useSnapshot } from './hooks.js';
import Header, { SimBanner } from './components/Header.jsx';
import LoginDialog from './components/LoginDialog.jsx';
import Live from './pages/Live.jsx';
import Analytics from './pages/Analytics.jsx';
import Players from './pages/Players.jsx';
import Compare from './pages/Compare.jsx';
import History from './pages/History.jsx';
import Platform from './pages/Platform.jsx';

const ALERT_TYPES = ['WICKET', 'SIX', 'MILESTONE', 'RESULT'];
const SNAP_PAGES = { live: Live, analytics: Analytics, players: Players };

export default function App() {
  const route = useHashRoute();
  const [mode, setModeState] = useState(API.mode);
  const [theme, setTheme] = usePersisted('ipl.theme', 'dark');
  const [alerts, setAlerts] = usePersisted('ipl.alerts', 'off');
  const [user, setUser] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const seen = useRef(0);
  const { snap, status } = useSnapshot(mode);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    if (snap) {
      document.documentElement.style.setProperty('--a', snap.teams.batting.color);
      document.documentElement.style.setProperty('--b', snap.teams.bowling.color);
    }
  }, [snap && snap.teams.batting.color, snap && snap.teams.bowling.color]);

  // Toast alerts for new key events
  useEffect(() => { seen.current = 0; }, [mode]);
  useEffect(() => {
    if (!snap || !snap.events.length) return;
    const top = snap.events[0].id;
    if (!seen.current || top < seen.current) { seen.current = top; return; }
    const fresh = snap.events.filter((e) => e.id > seen.current).reverse();
    seen.current = top;
    if (alerts !== 'on') return;
    fresh.filter((e) => ALERT_TYPES.includes(e.type)).forEach((e) => {
      const id = Math.random();
      setToasts((t) => [...t, { id, type: e.type, text: e.type + ': ' + e.text }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
    });
  }, [snap, alerts]);

  const setMode = (sim) => { const m = sim ? 'simulation' : 'live'; API.setMode(m); setModeState(m); };
  const toggleAlerts = () => {
    const on = alerts !== 'on';
    setAlerts(on ? 'on' : 'off');
    if (on) API.subscribeNotifications({ events: ['WICKET', 'SIX', 'MILESTONE'] }).catch(() => {});
  };

  const sim = mode === 'simulation';
  const SnapPage = SNAP_PAGES[route];

  return (
    <Fragment>
      <Header route={route} status={status} sim={sim} onSim={setMode} alerts={alerts === 'on'} onAlerts={toggleAlerts}
        theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} user={user} onLogin={() => setLoginOpen(true)} />
      {sim && <SimBanner />}
      <main>
        {SnapPage && (snap ? <SnapPage s={snap} /> : <p className="muted">{status === 'error' ? 'Backend unreachable. Check config.js or switch to Simulation.' : 'Loading...'}</p>)}
        {route === 'compare' && <Compare mode={mode} />}
        {route === 'history' && <History mode={mode} />}
        {route === 'platform' && <Platform key={mode} />}
      </main>
      <footer>
        This output is for internal reference only. Please review and verify all information before use. This does not constitute financial, legal, or investment advice.
        Win probability and run rate projections are indicative model outputs based on assumptions that may not materialise.
      </footer>
      <div id="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={'toast ' + t.type}>{t.text}</div>)}</div>
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} onUser={setUser} />
    </Fragment>
  );
}
