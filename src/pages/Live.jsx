import { Card, Kpi, Table } from '../components/ui.jsx';
import { WinProbChart } from '../components/charts.jsx';

const pct = (p) => Math.round(p * 100);

export default function Live({ s }) {
  const { score: sc, winProbability: wp, runRate: rr, teams: t, match: m } = s;
  return (
    <>
      <div className="card hero">
        <div className="sb-meta">{m.series} &middot; {m.venue} <span className={'pill ' + (m.status === 'LIVE' ? 'live' : '')}>{m.status}</span></div>
        <div className="sb-main">
          <div className="team"><span className="swatch" style={{ background: 'var(--a)' }} /><div><b>{t.batting.name}</b><small>Batting, chasing {sc.target}</small></div></div>
          <div className="big">{sc.runs}<span>/{sc.wickets}</span><small>{sc.overs} ov</small></div>
          <div className="team r"><div><b>{t.bowling.name}</b><small>Bowling</small></div><span className="swatch" style={{ background: 'var(--b)' }} /></div>
        </div>
        <div className="sb-foot">
          {m.result ? <b>{m.result}</b> : <>{t.batting.code} need <b>{sc.needed}</b> off <b>{sc.ballsLeft}</b> balls</>}
        </div>
        <div className="wpbar" title="Win probability">
          <i style={{ width: pct(wp.batting) + '%', background: 'var(--a)' }} /><i style={{ width: pct(wp.bowling) + '%', background: 'var(--b)' }} />
        </div>
        <div className="wplbl"><span>{t.batting.code} {pct(wp.batting)}%</span><span>{t.bowling.code} {pct(wp.bowling)}%</span></div>
      </div>

      <div className="grid g3">
        <Card title="Win probability" note="indicative model output" className="span2">
          <div className="chart"><WinProbChart timeline={wp.timeline} color={t.batting.color} /></div>
        </Card>
        <Card title="Current state">
          <div className="kpis">
            <Kpi label="Current RR" value={rr.current} /><Kpi label="Required RR" value={rr.required} />
            <Kpi label="Projected total" value={rr.projectedTotal} /><Kpi label="Partnership" value={`${s.partnership.runs} (${s.partnership.balls})`} />
          </div>
        </Card>
      </div>

      <div className="grid g3">
        <Card title="At the crease">
          <Table head={['Batter', 'R', 'B', '4s', '6s', 'SR']} rows={s.batters.map((b) => [(b.onStrike ? '* ' : '') + b.name, b.runs, b.balls, b.fours, b.sixes, b.sr])} />
        </Card>
        <Card title="Ball by ball">
          <div className="balls">
            {s.recentBalls.map((b, i) => <span key={i} className={'ball ' + (b.wicket ? 'w' : b.runs >= 4 ? 'b' : '')} title={'Over ' + b.over}>{b.label}</span>)}
          </div>
          <div className="muted">Bowler: {s.bowler.name} {s.bowler.overs}-{s.bowler.runs}-{s.bowler.wickets} (econ {s.bowler.econ})</div>
        </Card>
        <Card title="Match events">
          <ul className="events">
            {s.events.slice(0, 8).map((e) => <li key={e.id} className={'ev ' + e.type}><b>{e.type}</b> {e.text}<small>ov {e.over}</small></li>)}
            {!s.events.length && <li className="muted">No events yet</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
