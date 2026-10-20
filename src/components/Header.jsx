import { API } from '../api/api.js';

const LINKS = [['live', 'Live'], ['analytics', 'Analytics'], ['players', 'Players'], ['compare', 'Compare'], ['history', 'History'], ['platform', 'Platform']];

export default function Header({ route, status, sim, onSim, alerts, onAlerts, theme, onTheme, user, onLogin }) {
  const C = window.IPL_CONFIG;
  const st = { sim: ['Simulation', 'sim'], live: [C.LIVE_SOURCE_LABEL, 'live'], error: ['Backend unreachable', 'err'] }[status] || ['Connecting', ''];
  return (
    <header className="top">
      <a className="brand" href="#live"><span className="logo" />IPL Live Analytics</a>
      <nav>{LINKS.map(([id, l]) => <a key={id} href={'#' + id} className={route === id ? 'on' : ''}>{l}</a>)}</nav>
      <div className="tools">
        <span className={'pill ' + st[1]} aria-live="polite">{st[0]}</span>
        <label className="switch" title="Switch between demo simulation and the live backend">
          <input type="checkbox" role="switch" checked={sim} onChange={(e) => onSim(e.target.checked)} />
          <span className="track" /><span className="lbl">{sim ? 'Simulation' : 'Live'}</span>
        </label>
        <button className="btn ghost" onClick={onAlerts}>Alerts: {alerts ? 'on' : 'off'}</button>
        <button className="btn ghost" onClick={onTheme} aria-label="Toggle theme">{theme === 'dark' ? 'Light' : 'Dark'}</button>
        <button className="btn" onClick={onLogin}>{user || 'Sign in'}</button>
      </div>
    </header>
  );
}

export function SimBanner() {
  return (
    <div className="banner">
      Simulation mode: fictional teams and generated data for demonstration.
      <span className="simctl">
        Speed{' '}
        <select defaultValue="2500" onChange={(e) => API.sim.setSpeed(+e.target.value)}>
          <option value="2500">Normal</option><option value="1000">Fast</option><option value="400">Turbo</option>
        </select>{' '}
        <button className="btn small" onClick={() => API.sim.restart()}>Restart match</button>
      </span>
    </div>
  );
}
