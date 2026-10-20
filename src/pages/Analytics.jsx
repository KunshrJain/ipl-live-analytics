import { Card, Table } from '../components/ui.jsx';
import { OverBars, Worm } from '../components/charts.jsx';

export function BowlingTable({ s }) {
  return <Table head={['Bowler', 'O', 'M', 'R', 'W', 'Econ', 'Dot %']} rows={s.bowling.map((b) => [b.name, b.overs, b.maidens, b.runs, b.wickets, b.econ, b.dotPct])} />;
}

export default function Analytics({ s }) {
  const rr = s.runRate;
  const tiles = [['Current run rate', rr.current], ['Required run rate', rr.required], ['Projected total', rr.projectedTotal], ['Win probability', Math.round(s.winProbability.batting * 100) + '%']];
  return (
    <>
      <div className="grid g4">{tiles.map(([l, v]) => <div className="card tile" key={l}><small>{l}</small><b>{v}</b></div>)}</div>
      <div className="grid g2">
        <Card title="Runs per over">
          <div className="chart"><OverBars data={s.overRuns} color="var(--a)" wicketColor="var(--danger)" /></div>
          <p className="legend"><i className="dot a" />Over <i className="dot w" />Wicket over</p>
        </Card>
        <Card title="Run progression vs required pace">
          <div className="chart"><Worm overRuns={s.overRuns} target={s.score.target} color="var(--a)" reqColor="var(--muted)" /></div>
          <p className="legend"><i className="dot a" />Actual <i className="dot r" />Required pace</p>
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Partnerships"><Table head={['Wkt', 'Pair', 'Runs', 'Balls']} rows={s.partnerships.map((p) => [p.wicket, p.pair, p.runs, p.balls])} /></Card>
        <Card title="Bowling efficiency"><BowlingTable s={s} /></Card>
      </div>
    </>
  );
}
