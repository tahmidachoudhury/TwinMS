import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { patients } from '../data/twinms-config.js';
import { getCurrentPatientId, signOut } from '../auth.js';
import MarkerChart from '../components/MarkerChart.jsx';

const FLARE_NFL_VALUE = 46; // pushes the latest NFL reading into the red zone

function status(v, lo, hi) {
  if (v >= hi) return { label: 'HIGH', cls: 'high' };
  if (v >= lo) return { label: 'ELEVATED', cls: 'elevated' };
  return { label: 'STABLE', cls: 'normal' };
}

function Chip({ status: s }) {
  return (
    <span className={`chip chip--${s.cls}`}>
      <span className="chip-dot" />
      {s.label}
    </span>
  );
}

function greetingWord(hours) {
  return hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
}

const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function AIAssistant({ patient, ns, gs, isHot }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: `I’m monitoring ${patient.name.split(' ')[0]}'s latest markers. Ask me to explain a trend or today’s risk.`,
    },
  ]);

  const getResponse = (question) => {
    const normalized = question.toLowerCase();
    if (normalized.includes('nfl') || normalized.includes('trend')) {
      return `NFL is currently ${ns.label.toLowerCase()} at the latest reading. I compare it with GFAP and your personal baseline before flagging a change.`;
    }
    if (normalized.includes('heat') || normalized.includes('environment')) {
      return isHot
        ? 'Today’s heat advisory may temporarily worsen symptoms. Stay cool and hydrated, and note whether symptoms ease as you cool down.'
        : 'There is no heat advisory today. I’ll flag the environment if the temperature rises above your threshold.';
    }
    if (normalized.includes('risk') || normalized.includes('status')) {
      return `Today’s dashboard status is ${ns.label === 'HIGH' || gs.label === 'HIGH' ? 'REVIEW' : isHot || ns.label !== 'STABLE' || gs.label !== 'STABLE' ? 'MONITOR' : 'NORMAL'}. This is a trend signal for specialist review, not a diagnosis.`;
    }
    return 'I can explain your biomarker trend, current risk status, or the environment signal. What would you like to explore?';
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text },
      { id: Date.now() + 1, role: 'assistant', text: getResponse(text) },
    ]);
    setDraft('');
  };

  return (
    <section className="card grid-card assistant-card">
      <div className="card-head">
        <span className="card-title">AI ASSISTANT</span>
        <span className="card-tag card-tag--live"><span className="live-dot" /> ONLINE</span>
      </div>
      <div className="assistant-intro">
        <span className="assistant-mark">AI</span>
        <p>Ask about your readings, risk signals, or what to do next.</p>
      </div>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message chat-message--${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <label className="sr-only" htmlFor="assistant-message">Message the AI assistant</label>
        <input
          id="assistant-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about your dashboard..."
        />
        <button type="submit" aria-label="Send message">→</button>
      </form>
    </section>
  );
}

export default function Dashboard() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const authedId = getCurrentPatientId();
  const patient = patients[patientId];

  // Demo states can be preset via URL, e.g. ?flare=1&temp=25
  const [searchParams] = useSearchParams();
  const [tempC, setTempC] = useState(() =>
    searchParams.has('temp') ? Number(searchParams.get('temp')) : patient?.weather.tempC ?? 20,
  );
  const [simulateFlare, setSimulateFlare] = useState(searchParams.get('flare') === '1');
  const [reminded, setReminded] = useState(false);
  const [acted, setActed] = useState({});

  if (!authedId) return <Navigate to="/login" replace />;
  if (!patient) return <Navigate to={`/dashboard/${authedId}`} replace />;

  const { nfl, gfap } = patient.markers;

  // NFL — fixed clinical bands
  const nflSeries = simulateFlare ? [...nfl.series.slice(0, -1), FLARE_NFL_VALUE] : nfl.series;
  const nflLatest = nflSeries[nflSeries.length - 1];
  const ns = status(nflLatest, nfl.bands.normalMax, nfl.bands.elevatedMax);

  // GFAP — bands derived from the per-patient baseline seeds
  const b = gfap.baseline;
  const gfapLatest = gfap.series[gfap.series.length - 1];
  const gs = status(gfapLatest, b.inflammation, b.flare);

  // Environment
  const isHot = tempC > patient.weather.heatWarnC;

  // Medication cycle
  const med = patient.medication;
  const lastDose = new Date(med.lastDoseISO + 'T00:00:00');
  const daysSince = Math.round((Date.now() - lastDose.getTime()) / 864e5);
  const nextDose = new Date(lastDose.getTime() + med.cycleDays * 864e5);
  const progress = Math.min(daysSince / med.cycleDays, 1);
  const C = 2 * Math.PI * 42;

  // Overall strip — derived from card statuses
  const worst = [ns, gs].some((s) => s.label === 'HIGH') ? 'high'
    : [ns, gs].some((s) => s.label === 'ELEVATED') || isHot ? 'elevated' : 'normal';
  const stripStatus = worst === 'high' ? 'REVIEW' : worst === 'elevated' ? 'MONITOR' : 'NORMAL';
  const stripReason =
    worst === 'high' ? 'Marker in red zone — see next steps'
      : ns.label !== 'STABLE' ? 'NFL above baseline · GFAP stable'
        : isHot ? 'Heat advisory in effect'
          : 'All markers at baseline';

  const showEscalation = ns.label === 'HIGH' || gs.label === 'HIGH';
  const act = (key) => setActed((prev) => ({ ...prev, [key]: true }));

  const now = new Date();

  const onSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <main className="page">
      <div className="column">
        <header className="masthead">
          <span className="brand">TWINMS</span>
          <nav className="patient-nav" aria-label="Patient navigation">
            <span aria-current="page">OVERVIEW</span>
            <Link to="/analytics-dashboard">WEARABLE ANALYTICS</Link>
          </nav>
          <span className="patient-id">ID {patient.id}</span>
        </header>

        <div>
          <h1 className="greeting">
            {greetingWord(now.getHours())}, {patient.name.split(' ')[0]}
          </h1>
          <div className="date">
            {now
              .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              .toUpperCase()}
          </div>
        </div>

        <section className="strip" aria-label="Overall status">
          <span className="strip-dot" style={{ background: `var(--status-${worst})` }} />
          <span className="strip-label">TODAY: {stripStatus}</span>
          <span className="strip-reason">{stripReason}</span>
        </section>

        <div className="dashboard-grid">
          {showEscalation && (
            <section className="card card--alert grid-card steps-card">
              <div className="card-head">
                <span className="card-title">RECOMMENDED NEXT STEPS</span>
                <span className="card-tag card-tag--alert">&#9650; RED ZONE</span>
              </div>
              <div className="steps">
                <div className="step">
                  <p>Request an MRI scan order for specialist review</p>
                  <button onClick={() => act('mri')}>{acted.mri ? '✓ ORDER REQUESTED' : 'REQUEST MRI ORDER'}</button>
                </div>
                <div className="step">
                  <p>Book an appointment with your MS team</p>
                  <button onClick={() => act('book')}>{acted.book ? '✓ REQUEST SENT' : 'BOOK APPOINTMENT'}</button>
                </div>
                <div className="step">
                  <p>Export recent data to send to your clinician</p>
                  <button onClick={() => act('export')}>{acted.export ? '✓ EXPORT READY' : 'EXPORT DATA'}</button>
                </div>
              </div>
            </section>
          )}

          <section className="card grid-card biomarker-card">
            <div className="card-head">
              <span className="card-title">BIOMARKER TREND</span>
              <span className="card-tag">30-DAY</span>
            </div>

            <div className="marker-row">
              <span className="marker-name">NFL — SERUM</span>
              <span className="marker-value">
                <span className="marker-reading">{nflLatest} pg/mL</span>
                <Chip status={ns} />
              </span>
            </div>
            <MarkerChart
              series={nflSeries}
              edges={[nfl.bands.normalMax, nfl.bands.elevatedMax]}
              yMax={nfl.bands.chartMax}
              label="NFL 30-day trend"
            />

            <div className="marker-row">
              <span className="marker-name">GFAP — PERSONAL BASELINE</span>
              <span className="marker-value">
                <span className="marker-reading">{gfapLatest} pg/mL</span>
                <Chip status={gs} />
              </span>
            </div>
            <MarkerChart
              series={gfap.series}
              edges={[b.inflammation, b.flare]}
              yMax={gfap.chartMax}
              baseline={b.stable}
              tickOffsets={[3, 9]}
              className="chart--last"
              label="GFAP 30-day trend against personal baseline"
            />

            <p className="footnote">
              NFL can rise without active neurodegeneration, so GFAP is tracked alongside it — against your personal
              baseline — for corroboration.
            </p>
          </section>

          <div className="grid-stretch ai-font" style={{ gridColumn: "1 / -1" }}>
            <AIAssistant patient={patient} ns={ns} gs={gs} isHot={isHot} />
          </div>



          <div className="support-stack">
            <section className="card grid-card environment-card">
              <div className="card-head">
                <span className="card-title">ENVIRONMENT</span>
                <span className="card-tag">{patient.weather.location.toUpperCase()}</span>
              </div>
              <div className="temp-row">
                <span className="temp">{Math.round(tempC)}°C</span>
                <span className="condition">{patient.weather.condition.toUpperCase()}</span>
              </div>
              {isHot ? (
                <div className="advisory advisory--heat">
                  <span className="advisory-badge">▲ HEAT</span>
                  <p>
                    Heat can temporarily worsen MS symptoms (Uhthoff’s phenomenon). Stay cool and hydrated; symptoms
                    should ease as you cool down.
                  </p>
                </div>
              ) : (
                <div className="advisory advisory--normal">
                  <span className="advisory-badge">✓ NORMAL</span>
                  <p>
                    No heat risk today. Temperatures above {patient.weather.heatWarnC}°C can temporarily worsen symptoms —
                    we’ll warn you when that happens.
                  </p>
                </div>
              )}
            </section>

            <section className="card grid-card medication-card">
              <div className="card-head">
                <span className="card-title">MEDICATION</span>
                <span className="card-tag">NEXT DOSE</span>
              </div>
              <div className="med-row">
                <svg viewBox="0 0 100 100" className="ring" role="img" aria-label="Medication cycle progress">
                  <circle cx="50" cy="50" r="42" className="ring-track" />
                  <circle
                    cx="50" cy="50" r="42"
                    className="ring-progress"
                    strokeDasharray={`${(progress * C).toFixed(1)} ${C.toFixed(1)}`}
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="48" textAnchor="middle" className="ring-pct">{Math.round(progress * 100)}%</text>
                  <text x="50" y="62" textAnchor="middle" className="ring-caption">OF CYCLE</text>
                </svg>
                <div className="med-info">
                  <span className="med-name">{med.name}</span>
                  <span className="med-meta">{`${med.generic} — ${med.cadence}`.toUpperCase()}</span>
                  <span className="med-days">
                    <strong>{Math.max(med.cycleDays - daysSince, 0)} days</strong> to next {med.doseNoun}
                  </span>
                  <span className="med-dates">
                    Last dose {fmtDate(lastDose)} · next {fmtDate(nextDose)}
                  </span>
                </div>
              </div>
              <button className="btn-primary" onClick={() => setReminded((r) => !r)}>
                {reminded ? '✓ REMINDER SET' : 'REMIND ME — ADD TO CALENDAR'}
              </button>
            </section>
          </div>
        </div>

        <p className="disclaimer">
          TWINMS SURFACES TRENDS FOR SPECIALIST REVIEW. IT DOES NOT DIAGNOSE RELAPSES OR RECOMMEND TREATMENT. ·{' '}
          <button onClick={onSignOut}>SIGN OUT</button>
        </p>

        <div className="demo">
          <span>DEMO</span>
          <label>
            TEMP{' '}
            <input
              type="range"
              min="15"
              max="42"
              step="1"
              value={tempC}
              onChange={(e) => setTempC(Number(e.target.value))}
            />{' '}
            {Math.round(tempC)}°C
          </label>
          <label>
            <input
              type="checkbox"
              checked={simulateFlare}
              onChange={(e) => setSimulateFlare(e.target.checked)}
            />{' '}
            SIMULATE FLARE
          </label>
        </div>
      </div>
    </main>
  );
}
