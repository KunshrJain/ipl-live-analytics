// Dependency-free SVG charts. All colours come from CSS variables.
(function () {
  const W = 640, H = 220, P = { l: 36, r: 12, t: 12, b: 24 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const open = () => '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" preserveAspectRatio="xMidYMid meet">';
  const grid = (max, steps, fmt) => {
    let s = '';
    for (let i = 0; i <= steps; i++) {
      const y = P.t + ih - (ih * i) / steps;
      s += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y + '" y2="' + y + '" class="grid"/>' +
        '<text x="' + (P.l - 6) + '" y="' + (y + 4) + '" class="axis" text-anchor="end">' + fmt((max * i) / steps) + '</text>';
    }
    return s;
  };

  // pts: [{x,y}], x domain 0..xMax, y domain 0..1
  function winProb(tl, colA, colB) {
    if (!tl.length) return '';
    const xMax = 120, X = (b) => P.l + (b / xMax) * iw, Y = (p) => P.t + ih - p * ih;
    const d = tl.map((t, i) => (i ? 'L' : 'M') + X(t.ball).toFixed(1) + ' ' + Y(t.p).toFixed(1)).join(' ');
    const last = tl[tl.length - 1];
    return open() + grid(1, 4, (v) => Math.round(v * 100) + '%') +
      '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(0.5) + '" y2="' + Y(0.5) + '" class="mid"/>' +
      '<path d="' + d + ' L' + X(last.ball) + ' ' + Y(0) + ' L' + X(tl[0].ball) + ' ' + Y(0) + 'Z" fill="' + colA + '" opacity=".14"/>' +
      '<path d="' + d + '" fill="none" stroke="' + colA + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="' + X(last.ball) + '" cy="' + Y(last.p) + '" r="4.5" fill="' + colA + '"/>' +
      [0, 20, 40, 60, 80, 100, 120].map((b) => '<text x="' + X(b) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + b / 6 + '</text>').join('') + '</svg>';
  }

  // Runs per over bars; wicket overs highlighted.
  function overBars(data, col, colW) {
    const max = Math.max(20, ...data.map((d) => d.runs)), bw = iw / 20;
    return open() + grid(max, 4, (v) => Math.round(v)) + data.map((d) => {
      const h = (d.runs / max) * ih, x = P.l + (d.over - 1) * bw + 3, y = P.t + ih - h;
      return '<rect x="' + x + '" y="' + y + '" width="' + (bw - 6) + '" height="' + h + '" rx="3" fill="' + (d.wicket ? colW : col) + '"><title>Over ' + d.over + ': ' + d.runs + (d.wicket ? ' (wicket)' : '') + '</title></rect>' +
        '<text x="' + (x + (bw - 6) / 2) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + d.over + '</text>';
    }).join('') + '</svg>';
  }

  // Worm: cumulative actual vs required pace line to target.
  function worm(overRuns, target, col, colReq) {
    let cum = 0;
    const pts = [{ o: 0, r: 0 }].concat(overRuns.map((o) => ({ o: o.over, r: (cum += o.runs) })));
    const max = Math.max(target, cum) * 1.05, X = (o) => P.l + (o / 20) * iw, Y = (r) => P.t + ih - (r / max) * ih;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.o).toFixed(1) + ' ' + Y(p.r).toFixed(1)).join(' ');
    return open() + grid(max, 4, (v) => Math.round(v)) +
      '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(20) + '" y2="' + Y(target) + '" stroke="' + colReq + '" stroke-dasharray="5 4" stroke-width="1.5"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      [0, 5, 10, 15, 20].map((o) => '<text x="' + X(o) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + o + '</text>').join('') + '</svg>';
  }

  // Horizontal paired comparison rows (HTML, not SVG).
  function compareRows(a, b, lowerBetter) {
    return Object.keys(a.metrics).map((k) => {
      const x = a.metrics[k], y = b.metrics[k], t = x + y || 1, lb = lowerBetter.includes(k);
      const aw = lb ? (y / t) * 100 : (x / t) * 100;
      return '<div class="cmp"><div class="cmp-h"><b>' + x + '</b><span>' + k + '</span><b>' + y + '</b></div>' +
        '<div class="cmp-bar"><i style="width:' + aw.toFixed(1) + '%;background:var(--a)"></i><i style="width:' + (100 - aw).toFixed(1) + '%;background:var(--b)"></i></div></div>';
    }).join('');
  }

  window.IPL_CHARTS = { winProb, overBars, worm, compareRows };
})();
