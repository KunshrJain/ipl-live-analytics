// Dependency-free SVG charts. Colours come from CSS variables.
const W = 640, H = 220, P = { l: 36, r: 12, t: 12, b: 24 };
const iw = W - P.l - P.r, ih = H - P.t - P.b;

function Frame({ max, steps, fmt, children }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: steps + 1 }, (_, i) => {
        const y = P.t + ih - (ih * i) / steps;
        return (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={y} y2={y} className="grid" />
            <text x={P.l - 6} y={y + 4} className="axis" textAnchor="end">{fmt((max * i) / steps)}</text>
          </g>
        );
      })}
      {children}
    </svg>
  );
}

const XLabel = ({ x, children }) => <text x={x} y={H - 6} className="axis" textAnchor="middle">{children}</text>;

export function WinProbChart({ timeline, color }) {
  if (!timeline.length) return null;
  const X = (b) => P.l + (b / 120) * iw, Y = (p) => P.t + ih - p * ih;
  const d = timeline.map((t, i) => `${i ? 'L' : 'M'}${X(t.ball).toFixed(1)} ${Y(t.p).toFixed(1)}`).join(' ');
  const last = timeline[timeline.length - 1];
  return (
    <Frame max={1} steps={4} fmt={(v) => Math.round(v * 100) + '%'}>
      <line x1={P.l} x2={W - P.r} y1={Y(0.5)} y2={Y(0.5)} className="mid" />
      <path d={`${d} L${X(last.ball)} ${Y(0)} L${X(timeline[0].ball)} ${Y(0)}Z`} fill={color} opacity=".14" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={X(last.ball)} cy={Y(last.p)} r="4.5" fill={color} />
      {[0, 20, 40, 60, 80, 100, 120].map((b) => <XLabel key={b} x={X(b)}>{b / 6}</XLabel>)}
    </Frame>
  );
}

export function OverBars({ data, color, wicketColor }) {
  const max = Math.max(20, ...data.map((d) => d.runs)), bw = iw / 20;
  return (
    <Frame max={max} steps={4} fmt={Math.round}>
      {data.map((d) => {
        const h = (d.runs / max) * ih, x = P.l + (d.over - 1) * bw + 3;
        return (
          <g key={d.over}>
            <rect x={x} y={P.t + ih - h} width={bw - 6} height={h} rx="3" fill={d.wicket ? wicketColor : color}>
              <title>{`Over ${d.over}: ${d.runs}${d.wicket ? ' (wicket)' : ''}`}</title>
            </rect>
            <XLabel x={x + (bw - 6) / 2}>{d.over}</XLabel>
          </g>
        );
      })}
    </Frame>
  );
}

export function Worm({ overRuns, target, color, reqColor }) {
  let cum = 0;
  const pts = [{ o: 0, r: 0 }, ...overRuns.map((o) => ({ o: o.over, r: (cum += o.runs) }))];
  const max = Math.max(target, cum) * 1.05;
  const X = (o) => P.l + (o / 20) * iw, Y = (r) => P.t + ih - (r / max) * ih;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.o).toFixed(1)} ${Y(p.r).toFixed(1)}`).join(' ');
  return (
    <Frame max={max} steps={4} fmt={Math.round}>
      <line x1={X(0)} y1={Y(0)} x2={X(20)} y2={Y(target)} stroke={reqColor} strokeDasharray="5 4" strokeWidth="1.5" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {[0, 5, 10, 15, 20].map((o) => <XLabel key={o} x={X(o)}>{o}</XLabel>)}
    </Frame>
  );
}

export function CompareRows({ a, b, lowerBetter }) {
  return Object.keys(a.metrics).map((k) => {
    const x = a.metrics[k], y = b.metrics[k], t = x + y || 1;
    const aw = lowerBetter.includes(k) ? (y / t) * 100 : (x / t) * 100;
    return (
      <div className="cmp" key={k}>
        <div className="cmp-h"><b>{x}</b><span>{k}</span><b>{y}</b></div>
        <div className="cmp-bar"><i style={{ width: aw + '%', background: 'var(--a)' }} /><i style={{ width: 100 - aw + '%', background: 'var(--b)' }} /></div>
      </div>
    );
  });
}
