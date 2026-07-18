import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { clinicianPatients, clinicianProfile, triageSummary } from '../data/clinician-config.js';
import { getCurrentRole, signOut } from '../auth.js';

const statusLabels = {
  review: 'REVIEW TODAY',
  monitor: 'MONITOR',
  stable: 'STABLE',
};

function MiniTrend({ series, direction }) {
  const width = 180;
  const height = 42;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series
    .map((value, index) => `${(index / (series.length - 1)) * width},${height - ((value - min) / range) * 30 - 5}`)
    .join(' ');

  return (
    <svg className={`mini-trend mini-trend--${direction}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recent biomarker trend">
      <line x1="0" x2={width} y1="36" y2="36" className="mini-trend-baseline" />
      <polyline points={points} className="mini-trend-line" />
      <circle cx={width} cy={Number(points.split(',').at(-1))} r="3" className="mini-trend-dot" />
    </svg>
  );
}

function StatusMark({ status }) {
  return <span className={`status-mark status-mark--${status}`}><span />{statusLabels[status]}</span>;
}

function PatientRow({ patient, selected, onSelect }) {
  return (
    <button className={`patient-row${selected ? ' is-selected' : ''}`} onClick={() => onSelect(patient)} type="button">
      <span className={`patient-avatar patient-avatar--${patient.status}`}>{patient.initials}</span>
      <span className="patient-main">
        <span className="patient-name">{patient.name}</span>
        <span className="patient-meta text-body">{patient.id} · {patient.age} YRS · {patient.location}</span>
      </span>
      <span className="patient-flags">
        {patient.priority && <span className="flag flag--priority">PRIORITY</span>}
        {patient.flare && <span className="flag flag--flare">FLARE SIGNAL</span>}
      </span>
      <span className="patient-trend">
        <MiniTrend series={patient.biomarker.series} direction={patient.biomarker.trend} />
        <span className={`patient-delta patient-delta--${patient.biomarker.trend}`}>{patient.biomarker.delta}</span>
      </span>
      <span className="patient-score">
        <strong>{patient.riskScore}</strong>
        <span className="text-body">RISK / 100</span>
      </span>
      <span className="patient-status"><StatusMark status={patient.status} /></span>
    </button>
  );
}

function DetailCard({ patient }) {
  return (
    <section className="card clinician-card detail-card">
      <div className="card-head">
        <span className="card-title">EXPLAINABLE SIGNALS</span>
        <span className="card-tag">{patient.id}</span>
      </div>
      <div className="detail-heading">
        <span className={`patient-avatar patient-avatar--${patient.status}`}>{patient.initials}</span>
        <div>
          <h2>{patient.name}</h2>
          <span className="text-body">{patient.age} YRS · {patient.location}</span>
        </div>
      </div>
      <div className="detail-status">
        <StatusMark status={patient.status} />
        <span className="detail-updated text-body">UPDATED {patient.updated.toUpperCase()}</span>
      </div>
      <div className="signal-list">
        {patient.reasons.map((reason) => (
          <div className="signal-item" key={reason}>
            <span className="signal-check">↗</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>
      <div className="detail-footer">
        <span className="text-body">BIOMARKER · {patient.biomarker.label}</span>
        <strong>{patient.biomarker.value}</strong>
      </div>
      <button className="detail-action" type="button">OPEN PATIENT TIMELINE <span>→</span></button>
    </section>
  );
}

function SummaryCard({ summary, count }) {
  return (
    <div className={`summary-card summary-card--${summary.key}`}>
      <div className="summary-top">
        <span className={`summary-dot summary-dot--${summary.key}`} />
        <span className="text-body">{summary.label}</span>
      </div>
      <strong>{count}</strong>
      <span className="summary-description">{summary.description}</span>
    </div>
  );
}

export default function ClinicianDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(clinicianPatients[0]);

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return clinicianPatients
      .filter((patient) => filter === 'all' || patient.status === filter)
      .filter((patient) => !normalizedQuery
        || patient.name.toLowerCase().includes(normalizedQuery)
        || patient.id.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [filter, query]);

  if (getCurrentRole() !== 'clinician') return <Navigate to="/login" replace />;

  const onSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <main className="page clinician-page">
      <div className="clinician-column">
        <header className="clinician-masthead">
          <div>
            <span className="brand">TWINMS</span>
            <span className="clinician-service text-body">{clinicianProfile.service}</span>
          </div>
          <div className="clinician-user">
            <span className="text-body">{clinicianProfile.name}</span>
            <button type="button" onClick={onSignOut}>SIGN OUT</button>
          </div>
        </header>

        <nav className="clinician-nav" aria-label="Clinician dashboard sections">
          <span className="clinician-nav-active text-body">PATIENT OVERVIEW</span>
          <span className="text-body">BIOMARKER DETAILS</span>
          <span className="text-body">LUNG FUNCTION</span>
          <span className="text-body">ANALYTICS</span>
          <span className="text-body">RISK SIMULATOR</span>
          <span className="text-body">PATIENT HISTORY</span>
        </nav>

        <section className="clinician-title-row">
          <div>
            <p className="eyebrow text-body">CLINICAL COMMAND CENTER · {clinicianProfile.reviewWindow}</p>
            <h1>Patient risk overview</h1>
            <p className="clinician-subtitle">Prioritized signals across your MS cohort, ready for specialist review.</p>
          </div>
          <div className="live-session"><span /> LIVE TRIAGE FEED</div>
        </section>

        <section className="summary-grid" aria-label="Triage summary">
          {triageSummary.map((summary) => (
            <SummaryCard
              key={summary.key}
              summary={summary}
              count={clinicianPatients.filter((patient) => patient.status === summary.key).length}
            />
          ))}
          <div className="summary-card summary-card--total">
            <div className="summary-top"><span className="summary-icon">⌁</span><span className="text-body">COHORT COVERAGE</span></div>
            <strong>{clinicianPatients.length}</strong>
            <span className="summary-description">Patients reporting in</span>
          </div>
        </section>

        <section className="clinician-layout">
          <section className="card clinician-card queue-card">
            <div className="card-head queue-head">
              <div>
                <span className="card-title">RISK-RANKED PATIENTS</span>
                <p className="text-body">Sorted by composite risk score · latest first</p>
              </div>
              <span className="card-tag">{filteredPatients.length} PATIENTS</span>
            </div>
            <div className="queue-tools">
              <div className="filter-group" role="group" aria-label="Filter patients by triage status">
                <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')} type="button">ALL</button>
                {triageSummary.map((summary) => (
                  <button className={filter === summary.key ? `is-active filter-${summary.key}` : ''} key={summary.key} onClick={() => setFilter(summary.key)} type="button">
                    {summary.label.replace(' TODAY', '')}
                  </button>
                ))}
              </div>
              <label className="patient-search">
                <span className="sr-only">Search patients</span>
                <span>⌕</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SEARCH PATIENTS" />
              </label>
            </div>
            <div className="patient-list">
              {filteredPatients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  selected={selectedPatient.id === patient.id}
                  onSelect={setSelectedPatient}
                />
              ))}
              {!filteredPatients.length && <p className="empty-state text-body">NO PATIENTS MATCH THIS FILTER</p>}
            </div>
          </section>

          <DetailCard patient={selectedPatient} />

          <section className="card clinician-card analytics-card analytics-card--trend">
            <div className="card-head">
              <span className="card-title">COHORT RISK TREND</span>
              <span className="card-tag">30 DAYS</span>
            </div>
            <div className="analytics-number"><strong>+18%</strong><span className="text-body">VS PREVIOUS PERIOD</span></div>
            <div className="cohort-bars" aria-label="Cohort risk trend over 30 days">
              {[22, 28, 25, 33, 39, 37, 46, 52, 58, 63, 68, 72].map((height, index) => (
                <span style={{ height: `${height}%` }} key={index} />
              ))}
            </div>
            <div className="analytics-caption text-body"><span>01 JUL</span><span>18 JUL</span></div>
          </section>

          <section className="card clinician-card analytics-card analytics-card--signals">
            <div className="card-head">
              <span className="card-title">LEADING INDICATORS</span>
              <span className="card-tag">COHORT</span>
            </div>
            <div className="indicator-row">
              <span><i className="indicator-dot indicator-dot--high" /> SYMPTOM WORSENING</span>
              <strong>4</strong>
            </div>
            <div className="indicator-row">
              <span><i className="indicator-dot indicator-dot--elevated" /> BIOMARKER RISE</span>
              <strong>3</strong>
            </div>
            <div className="indicator-row">
              <span><i className="indicator-dot indicator-dot--normal" /> STABLE REPORTS</span>
              <strong>8</strong>
            </div>
            <p className="analytics-note text-body">REVIEW PATIENTS WITH 2+ CORROBORATING SIGNALS</p>
          </section>
        </section>

        <footer className="clinician-footer text-body">
          <span>TWINMS CLINICIAN VIEW · DEMO DATA · FOR SPECIALIST REVIEW ONLY</span>
          <span>LAST SYNC {clinicianProfile.reviewWindow}</span>
        </footer>
      </div>
    </main>
  );
}
