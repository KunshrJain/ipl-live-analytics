import { useEffect, useRef, useState } from 'react';
import { API } from '../api/api.js';

export default function LoginDialog({ open, onClose, onUser }) {
  const ref = useRef(null);
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    API.login(u, p).then((r) => {
      if (r.token) API.setToken(r.token);
      onUser((r.user && r.user.name) || 'Signed in');
      setErr(''); onClose();
    }).catch(() => setErr('Sign in failed.'));
  };

  return (
    <dialog ref={ref} onClose={onClose}>
      <form onSubmit={submit}>
        <h3>Sign in</h3>
        <label>Username<input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" /></label>
        <p className="muted">{err}</p>
        <div className="row">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Sign in</button>
        </div>
      </form>
    </dialog>
  );
}
