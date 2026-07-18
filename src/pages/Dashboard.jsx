import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

function PanelTitle({ children }) {
  return <div className="cd-panel-title"><h2>{children}</h2></div>;
}

export function AiAssistant({ patient, ns, gs, isHot, dashboardContext }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const profile = {
    drivers: [
      `NFL: ${ns.label}`,
      `GFAP: ${gs.label}`,
      `Temperature: ${isHot ? 'Heat advisory' : 'Within threshold'}`,
      `Treatment: ${patient.medication.name}`,
    ],
    rationale: `This summary combines your latest marker readings, personal baseline, and environment signal. It is for discussion with your care team.`,
    assistant: {
      recommendation: `I’m monitoring ${patient.name.split(' ')[0]}'s latest markers. Ask me to explain a trend or today’s risk.`,
      prompt: 'Ask a question about your dashboard.',
    },
  };

  const send = async () => {
    const prompt = draft.trim();
    if (!prompt || isSending) return;

    setDraft('');
    setError('');
    setIsSending(true);
    setMessages((items) => [...items, { prompt, reply: '', pending: true }]);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          dashboardContext,
          history: messages.flatMap((message) => [
            { role: 'user', text: message.prompt },
            ...(message.reply ? [{ role: 'assistant', text: message.reply }] : []),
          ]),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The assistant could not respond.');
      setMessages((items) => items.map((message, index) => (
        index === items.length - 1 ? { ...message, reply: payload.reply, pending: false } : message
      )));
    } catch (requestError) {
      setMessages((items) => items.slice(0, -1));
      setError(requestError.message);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <aside className="cd-panel cd-assistant text-body">
      <PanelTitle>AI ASSISTANT</PanelTitle><h3>RISK RATIONALE</h3>
      <div className="cd-rationale">
        <div><b>KEY RISK DRIVERS:</b>{profile.drivers.map((driver) => <span key={driver}>• {driver.toUpperCase()}</span>)}</div>
        <p>{profile.rationale}</p>
      </div>
      <div className="cd-chat" aria-live="polite">
        <div className="cd-chat-ai text-body">{profile.assistant.recommendation.toUpperCase()}</div>
        <div className="cd-chat-user text-body">{profile.assistant.prompt.toUpperCase()}</div>
        {messages.map((message, index) => <div key={`${message.prompt}-${index}`}><div className="cd-chat-user text-body">{message.prompt}</div><div className="cd-chat-ai text-body">{message.pending ? 'Thinking…' : message.reply}</div></div>)}
      </div>
      {error && <p className="cd-chat-error" role="alert">{error}</p>}
      <div className="cd-message-box"><span>+</span><input aria-label="Message AI assistant" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') send(); }} placeholder="TYPE A MESSAGE" disabled={isSending} /><button type="button" onClick={send} aria-label="Send message" disabled={isSending}>➤</button></div>
    </aside>
  );
}

function greetingWord(hours) {
  return hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
}

const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });


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
  const assistantContext = {
    asOf: now.toISOString(),
    patient: {
      id: patient.id,
      name: patient.name,
    },
    overallStatus: {
      level: stripStatus,
      reason: stripReason,
    },
    biomarkers: {
      nfl: {
        ...nfl,
        series: nflSeries,
        latest: nflLatest,
        status: ns.label,
      },
      gfap: {
        ...gfap,
        latest: gfapLatest,
        status: gs.label,
      },
    },
    environment: {
      ...patient.weather,
      currentTemperatureC: tempC,
      heatAdvisoryActive: isHot,
    },
    medication: {
      ...med,
      daysSinceLastDose: daysSince,
      daysUntilNextDose: Math.max(med.cycleDays - daysSince, 0),
      nextDoseDate: nextDose.toISOString(),
      cycleProgressPercent: Math.round(progress * 100),
      reminderSet: reminded,
    },
    escalation: {
      shown: showEscalation,
      actions: {
        mriOrderRequested: Boolean(acted.mri),
        appointmentRequested: Boolean(acted.book),
        exportReady: Boolean(acted.export),
      },
    },
    simulation: {
      flareEnabled: simulateFlare,
      simulatedNFLValue: simulateFlare ? FLARE_NFL_VALUE : null,
    },
  };

  const onSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <main className="page">
      <div className="column">
        <header className="masthead">
          <span className="brand">TWINMS</span>
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

            <p className="footnote text-body">
              NFL can rise without active neurodegeneration, so GFAP is tracked alongside it — against your personal
              baseline — for corroboration.
            </p>
          </section>

          <div className="grid-card assistant-card ai-font">
            <AiAssistant patient={patient} ns={ns} gs={gs} isHot={isHot} dashboardContext={assistantContext} />
          </div>
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
