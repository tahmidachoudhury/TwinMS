// 30-day marker trend in a 320×120 viewBox: status band fills, optional
// personal-baseline rule, threshold ticks, and the reading trace.
export function chartGeometry(series, edges, yMax) {
  const y = (v) => 110 - (Math.min(v, yMax) / yMax) * 104;
  const x = (i) => 4 + (i / (series.length - 1)) * 312;
  const bands = [];
  let prev = 0;
  for (const e of [...edges, yMax]) {
    bands.push({ y: y(e), h: y(prev) - y(e) });
    prev = e;
  }
  const last = series[series.length - 1];
  return {
    pts: series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '),
    bands, y,
    lastX: x(series.length - 1).toFixed(1),
    lastY: y(last).toFixed(1),
    latest: last,
  };
}

const BAND_CLASSES = ['band--normal', 'band--elevated', 'band--high'];

export default function MarkerChart({ series, edges, yMax, baseline, tickOffsets = [3, 3], className = '', label }) {
  const g = chartGeometry(series, edges, yMax);
  return (
    <svg viewBox="0 0 320 120" className={`chart ${className}`.trim()} role="img" aria-label={label}>
      {g.bands.map((b, i) => (
        <rect key={i} x="0" width="320" y={b.y.toFixed(1)} height={b.h.toFixed(1)} className={BAND_CLASSES[i]} />
      ))}
      {baseline && (
        <>
          <line
            x1="0" x2="320"
            y1={g.y(baseline).toFixed(1)} y2={g.y(baseline).toFixed(1)}
            strokeDasharray="3 4" className="baseline"
          />
          <text x="4" y={(g.y(baseline) - 4).toFixed(1)} className="tick tick--soft">
            BASELINE {baseline}
          </text>
        </>
      )}
      {edges.map((e, i) => (
        <text key={e} x="316" y={(g.y(e) + tickOffsets[i]).toFixed(1)} textAnchor="end" className="tick">
          {e}
        </text>
      ))}
      <polyline points={g.pts} className="trace" />
      <circle cx={g.lastX} cy={g.lastY} r="3.5" className="trace-dot" />
    </svg>
  );
}
