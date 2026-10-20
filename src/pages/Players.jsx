import { Card, Table } from '../components/ui.jsx';
import { BowlingTable } from './Analytics.jsx';

export default function Players({ s }) {
  return (
    <div className="grid g2">
      <Card title="Batting"><div className="scroll"><Table head={['Batter', 'Status', 'R', 'B', '4s', '6s', 'SR']} rows={s.batting.map((b) => [b.name, b.status, b.runs, b.balls, b.fours, b.sixes, b.sr])} /></div></Card>
      <Card title="Bowling"><div className="scroll"><BowlingTable s={s} /></div></Card>
    </div>
  );
}
