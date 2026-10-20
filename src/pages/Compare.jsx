import { useEffect, useState } from 'react';
import { API } from '../api/api.js';
import { Card } from '../components/ui.jsx';
import { CompareRows } from '../components/charts.jsx';

const LOWER_BETTER = ['Bowling economy'];

export default function Compare({ mode }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { setErr(false); API.compare('CKG', 'HLT').then(setD).catch(() => setErr(true)); }, [mode]);
  return (
    <Card title="Team comparison">
      {err && <p className="muted">Comparison data unavailable.</p>}
      {d && (
        <>
          <div className="cmp-head">
            <span><i className="swatch" style={{ background: 'var(--a)' }} />{d.a.name}</span>
            <span>{d.b.name}<i className="swatch" style={{ background: 'var(--b)' }} /></span>
          </div>
          <CompareRows a={d.a} b={d.b} lowerBetter={LOWER_BETTER} />
          <p className="muted">Lower is better for: {LOWER_BETTER.join(', ')}.</p>
        </>
      )}
    </Card>
  );
}
