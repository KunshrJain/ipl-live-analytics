import { useEffect, useRef, useState } from 'react';
import { API } from './api/api.js';

const pick = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

export function usePersisted(key, initial) {
  const [v, setV] = useState(() => pick(key, initial));
  return [v, (n) => { put(key, n); setV(n); }];
}

export function useHashRoute() {
  const read = () => (location.hash || '#live').slice(1);
  const [r, setR] = useState(read);
  useEffect(() => {
    const f = () => setR(read());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return r;
}

// Subscribes to snapshots for the current mode; resubscribes when mode or reset key changes.
export function useSnapshot(mode, resetKey) {
  const [snap, setSnap] = useState(null);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let off = () => {}, dead = false;
    setSnap(null); setStatus('');
    API.listMatches().then((ms) => {
      if (dead) return;
      if (!ms || !ms[0]) { setStatus('error'); return; }
      off = API.subscribe(ms[0].id, (s) => !dead && setSnap(s), (st) => !dead && setStatus(st));
    }).catch(() => !dead && setStatus('error'));
    return () => { dead = true; off(); };
  }, [mode, resetKey]);
  return { snap, status };
}
