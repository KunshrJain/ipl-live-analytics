import { useEffect, useState } from 'react';
import { API } from '../api/api.js';
import { Card, Table } from '../components/ui.jsx';

export default function History({ mode }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { setErr(false); API.history().then(setRows).catch(() => setErr(true)); }, [mode]);
  return (
    <Card title="Historical results">
      {err && <p className="muted">History unavailable.</p>}
      {rows && <div className="scroll"><Table head={['Season', 'Date', 'Match', 'Result', 'Top scorer']} rows={rows.map((r) => [r.season, r.date, r.teams, r.result, r.topScorer])} /></div>}
    </Card>
  );
}
