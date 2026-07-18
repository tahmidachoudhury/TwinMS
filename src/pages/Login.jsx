import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { brand, patients } from '../data/twinms-config.js';
import { signIn, signInClinician } from '../auth.js';

export default function Login() {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const isClinician = role === 'clinician';

  const onSubmit = (e) => {
    e.preventDefault();
    if (isClinician) {
      signInClinician();
      navigate('/clinician');
      return;
    }
    const id = signIn(email);
    navigate(`/dashboard/${id}`);
  };

  return (
    <main className="login-page">
      <div className="login-column">
        <div className="login-brand">
          <div className="login-title">{brand.name}</div>
          <div className="login-tagline">{brand.tagline.toUpperCase()}</div>
        </div>

        <form className="login-card" onSubmit={onSubmit}>
          <div className="card-head">
            <span className="card-title">SIGN IN</span>
            <span className="card-tag">SECURE</span>
          </div>

          <div className="role-toggle" role="radiogroup" aria-label="Sign in as">
            <button type="button" className={`role-btn${role === 'patient' ? ' is-on' : ''}`} onClick={() => setRole('patient')}>
              PATIENT
            </button>
            <button type="button" className={`role-btn${isClinician ? ' is-on' : ''}`} onClick={() => setRole('clinician')}>
              CLINICIAN
            </button>
          </div>

          <label className="field">
            <span className="field-label">EMAIL</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span className="field-label">PASSWORD</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn-signin">
            SIGN IN &rarr;
          </button>
          {isClinician && <p className="login-note">DEMO CLINICIAN ACCOUNT · ANY EMAIL OR PASSWORD</p>}
        </form>

        <p className="login-hint">
          DEMO — ANY PASSWORD ·{' '}
          {Object.values(patients)
            .map((p) => p.email.toUpperCase())
            .join(' · ')}
        </p>
        <p className="login-disclaimer">
          TWINMS SURFACES TRENDS FOR SPECIALIST REVIEW. IT DOES NOT DIAGNOSE RELAPSES OR RECOMMEND TREATMENT.
        </p>
      </div>
    </main>
  );
}
