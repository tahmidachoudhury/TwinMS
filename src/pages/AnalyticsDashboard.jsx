import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getCurrentPatientId, signOut } from '../auth.js';
import { patients } from '../data/twinms-config.js';

const METRIC_KEYS = ['sleep', 'restingHr', 'hrv', 'steps', 'recovery'];

function metricStatus(metric) {
  const value = metric.series.at(-1);
  const outside = metric.direction === 'higher'
    ? value < metric.baseline.low
    : value > metric.baseline.high;
  const beyondWarning = metric.direction === 'higher'
    ? value <= metric.warn
    : value >= metric.warn;

  if (beyondWarning) return { label: 'OFF BASELINE', level: 'high' };
  if (outside) return { label: 'SHIFTING', level: 'elevated' };
  return { label: 'BASELINE', level: 'normal' };
}

function formatValue(metric, value = metric.series.at(-1)) {
  const formatted = Number(value).toLocaleString('en-GB', {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
  });
  return `${formatted} ${metric.unit}`;
}

function baselineCopy(metric) {
  return `${formatValue(metric, metric.baseline.low)}–${formatValue(metric, metric.baseline.high)}`;
}

function wellbeingScore(metric) {
  const value = metric.series.at(-1);
  const edge = metric.direction === 'higher' ? metric.baseline.low : metric.baseline.high;
  const span = Math.abs(edge - metric.warn) || 1;
  const adverseDistance = metric.direction === 'higher' ? edge - value : value - edge;
  return Math.max(25, Math.min(100, 92 - (Math.max(0, adverseDistance) / span) * 57));
}

function point(cx, cy, radius, angle) {
  const radians = (angle - 90) * Math.PI / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
}

function RadarChart({ metrics }) {
  const cx = 150;
  const cy = 132;
  const radius = 88;
  const angles = METRIC_KEYS.map((_, index) => index * 72);
  const grid = [0.33, 0.66, 1].map((scale) =>
    angles.map((angle) => point(cx, cy, radius * scale, angle).join(',')).join(' '),
  );
  const dataPoints = METRIC_KEYS.map((key, index) =>
    point(cx, cy, radius * wellbeingScore(metrics[key]) / 100, angles[index]),
  );

  return (
    <div className="radar-wrap">
      <svg className="radar" viewBox="0 0 300 270" role="img" aria-labelledby="radar-title radar-desc">
        <title id="radar-title">Personal baseline overview</title>
        <desc id="radar-desc">
          Five-axis chart comparing current sleep, resting heart rate, heart rate variability, mobility, and recovery
          with personal baseline. A larger shape means closer to baseline.
        </desc>
        {grid.map((points, index) => <polygon key={points} points={points} className={`radar-grid radar-grid--${index}`} />)}
        {angles.map((angle) => {
          const [x, y] = point(cx, cy, radius, angle);
          return <line key={angle} x1={cx} y1={cy} x2={x} y2={y} className="radar-axis" />;
        })}
        <polygon points={dataPoints.map((coords) => coords.join(',')).join(' ')} className="radar-area" />
        {dataPoints.map(([x, y], index) => <circle key={METRIC_KEYS[index]} cx={x} cy={y} r="4" className="radar-point" />)}
        {angles.map((angle, index) => {
          const [x, y] = point(cx, cy, radius + 31, angle);
          return (
            <text key={METRIC_KEYS[index]} x={x} y={y} textAnchor="middle" className="radar-label">
              {metrics[METRIC_KEYS[index]].shortLabel.toUpperCase()}
            </text>
          );
        })}
      </svg>
      <p className="radar-caption">OUTER RING = PERSONAL BASELINE</p>
    </div>
  );
}

function TrendChart({ metric }) {
  const width = 760;
  const height = 230;
  const pad = { top: 16, right: 18, bottom: 30, left: 44 };
  const allValues = [...metric.series, metric.baseline.low, metric.baseline.high, metric.warn];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const buffer = (max - min || 1) * 0.16;
  const yMin = min - buffer;
  const yMax = max + buffer;
  const x = (index) => pad.left + index * ((width - pad.left - pad.right) / (metric.series.length - 1));
  const y = (value) => pad.top + (yMax - value) * ((height - pad.top - pad.bottom) / (yMax - yMin));
  const points = metric.series.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const areaPoints = `${x(0)},${height - pad.bottom} ${points} ${x(metric.series.length - 1)},${height - pad.bottom}`;
  const status = metricStatus(metric);

  return (
    <svg className="wearable-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric.label} 30-day trend`}>
      <rect
        x={pad.left}
        y={y(metric.baseline.high)}
        width={width - pad.left - pad.right}
        height={Math.max(2, y(metric.baseline.low) - y(metric.baseline.high))}
        className="trend-baseline-band"
      />
      {[0, 1, 2, 3].map((tick) => {
        const value = yMin + (yMax - yMin) * (tick / 3);
        return (
          <g key={tick}>
            <line x1={pad.left} y1={y(value)} x2={width - pad.right} y2={y(value)} className="trend-grid" />
            <text x={pad.left - 8} y={y(value) + 4} textAnchor="end" className="trend-tick">
              {Number(value).toLocaleString('en-GB', { maximumFractionDigits: metric.decimals })}
            </text>
          </g>
        );
      })}
      <polygon points={areaPoints} className={`trend-area trend-area--${status.level}`} />
      <polyline points={points} className={`trend-line trend-line--${status.level}`} />
      <circle
        cx={x(metric.series.length - 1)}
        cy={y(metric.series.at(-1))}
        r="5"
        className={`trend-current trend-current--${status.level}`}
      />
      <text x={pad.left} y={height - 8} className="trend-tick">30 DAYS AGO</text>
      <text x={width - pad.right} y={height - 8} textAnchor="end" className="trend-tick">TODAY</text>
      <text x={width - pad.right - 4} y={y(metric.baseline.high) - 6} textAnchor="end" className="trend-band-label">
        PERSONAL BASELINE
      </text>
    </svg>
  );
}

function MetricCard({ metric, selected, onSelect }) {
  const status = metricStatus(metric);
  const current = metric.series.at(-1);
  const previousWeek = metric.series.at(-8);
  const change = current - previousWeek;
  const changeLabel = `${change > 0 ? '+' : ''}${change.toFixed(metric.decimals)} ${metric.unit}`;

  return (
    <button
      type="button"
      className={`wearable-metric wearable-metric--${status.level}${selected ? ' is-selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="wearable-metric-label">{metric.label.toUpperCase()}</span>
      <strong>{formatValue(metric)}</strong>
      <span className={`metric-status metric-status--${status.level}`}>{status.label}</span>
      <span className="wearable-metric-meta">BASELINE {baselineCopy(metric)}</span>
      <span className="wearable-metric-change">{changeLabel} VS 7 DAYS AGO</span>
    </button>
  );
}

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const patientId = getCurrentPatientId();
  const patient = patients[patientId];
  const [selectedMetric, setSelectedMetric] = useState('sleep');

  const statuses = useMemo(
    () => patient
      ? Object.values(patient.wearable.metrics).map(metricStatus)
      : [],
    [patient],
  );

  if (!patientId) return <Navigate to="/login" replace />;
  if (!patient) return <Navigate to="/" replace />;

  const metrics = patient.wearable.metrics;
  const currentMetric = metrics[selectedMetric];
  const offBaselineCount = statuses.filter((status) => status.level !== 'normal').length;
  const isStrained = offBaselineCount >= 3;

  const onSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <main className="page analytics-page">
      <div className="column">
        <header className="masthead analytics-masthead">
          <span className="brand">TWINMS</span>
          <nav className="patient-nav" aria-label="Patient navigation">
            <Link to={`/dashboard/${patient.id}`}>OVERVIEW</Link>
            <span aria-current="page">WEARABLE ANALYTICS</span>
          </nav>
          <span className="patient-id">ID {patient.id}</span>
        </header>

        <div className="analytics-title-row">
          <div>
            <p className="eyebrow">PERSONAL DIGITAL TWIN · 30-DAY VIEW</p>
            <h1 className="greeting">Wearable context</h1>
            <p className="analytics-lede">
              Sleep, cardiac recovery, and mobility compared with {patient.name.split(' ')[0]}’s personal baseline.
            </p>
          </div>
          <div className="sync-note">
            <span>LAST SYNC</span>
            <strong>{patient.wearable.lastSync.toUpperCase()}</strong>
            <small>{patient.wearable.device.toUpperCase()}</small>
          </div>
        </div>

        <section className={`context-strip context-strip--${isStrained ? 'elevated' : 'normal'}`} aria-label="Wearable context summary">
          <span className="context-strip-index">{String(offBaselineCount).padStart(2, '0')}</span>
          <div>
            <strong>{isStrained ? 'RECOVERY STRAIN DETECTED' : 'WITHIN PERSONAL BASELINE'}</strong>
            <p>
              {isStrained
                ? `${offBaselineCount} signals have shifted together. This can reflect stress or poor recovery and does not, by itself, indicate an MS flare.`
                : 'Your wearable signals are consistent with your established sleep, recovery, and mobility pattern.'}
            </p>
          </div>
          <span className="context-strip-tag">CONTEXT, NOT DIAGNOSIS</span>
        </section>

        <div className="wearable-metrics" aria-label="Wearable metric summaries">
          {METRIC_KEYS.map((key) => (
            <MetricCard
              key={key}
              metric={metrics[key]}
              selected={selectedMetric === key}
              onSelect={() => setSelectedMetric(key)}
            />
          ))}
        </div>

        <div className="analytics-grid">
          <section className="card analytics-trend-card">
            <div className="card-head">
              <span className="card-title">30-DAY SIGNAL</span>
              <span className="card-tag">{currentMetric.label.toUpperCase()}</span>
            </div>
            <div className="trend-heading">
              <div>
                <span className="trend-current-label">CURRENT</span>
                <strong>{formatValue(currentMetric)}</strong>
              </div>
              <p>Select any metric above to compare its recent pattern with your personal baseline band.</p>
            </div>
            <TrendChart metric={currentMetric} />
          </section>

          <section className="card radar-card">
            <div className="card-head">
              <span className="card-title">BASELINE SHAPE</span>
              <span className="card-tag">TODAY</span>
            </div>
            <RadarChart metrics={metrics} />
          </section>

          <section className="card sleep-detail-card">
            <div className="card-head">
              <span className="card-title">SLEEP QUALITY</span>
              <span className="card-tag">RECOVERY INPUT</span>
            </div>
            <div className="sleep-score-row">
              <strong>{formatValue(metrics.sleep)}</strong>
              <span>{formatValue(metrics.consistency)}</span>
            </div>
            <div className="sleep-labels">
              <span>DURATION</span>
              <span>CONSISTENCY</span>
            </div>
            <div className="sleep-track" aria-hidden="true">
              {metrics.sleep.series.slice(-14).map((value, index) => (
                <i
                  key={`${value}-${index}`}
                  style={{ height: `${Math.max(18, Math.min(100, value / metrics.sleep.baseline.high * 100))}%` }}
                />
              ))}
            </div>
            <p>Sleep regularity adds context that duration alone may miss.</p>
          </section>

          <section className={`card interpretation-card interpretation-card--${isStrained ? 'elevated' : 'normal'}`}>
            <div className="card-head">
              <span className="card-title">TWIN INTERPRETATION</span>
              <span className="card-tag">PATTERN CHECK</span>
            </div>
            <p className="interpretation-lead">{patient.wearable.context}</p>
            <div className="interpretation-comparison">
              <div>
                <span>WEARABLE CONTEXT</span>
                <strong>{isStrained ? 'RECOVERY STRAIN' : 'BASELINE'}</strong>
              </div>
              <span className="comparison-mark">≠</span>
              <div>
                <span>CLINICAL CONCLUSION</span>
                <strong>NOT ESTABLISHED</strong>
              </div>
            </div>
            <p className="interpretation-note">
              Stress, raised cortisol, or sleep loss can worsen how symptoms feel. Share persistent or new neurological
              symptoms with your MS team; wearable data cannot rule a relapse in or out.
            </p>
          </section>
        </div>

        <p className="disclaimer">
          WEARABLE DATA ADDS CONTEXT TO YOUR DIGITAL TWIN. IT DOES NOT DIAGNOSE RELAPSES OR REPLACE CLINICAL REVIEW. ·{' '}
          <button onClick={onSignOut}>SIGN OUT</button>
        </p>
      </div>
    </main>
  );
}
