// Mock auth — replace this storage layer with a real identity provider later.
import { patients } from './data/twinms-config.js';

const PATIENT_KEY = 'neurosense.patientId';
const ROLE_KEY = 'neurosense.role';

export function getCurrentPatientId() {
  const id = localStorage.getItem(PATIENT_KEY);
  return id && patients[id] ? id : null;
}

export function getCurrentRole() {
  return localStorage.getItem(ROLE_KEY);
}

// Any password is accepted; the email picks the mock patient.
// Unknown emails fall back to the first demo patient.
export function signIn(email) {
  const normalized = email.trim().toLowerCase();
  const match = Object.values(patients).find((p) => p.email === normalized);
  const id = match ? match.id : Object.keys(patients)[0];
  localStorage.setItem(PATIENT_KEY, id);
  localStorage.setItem(ROLE_KEY, 'patient');
  return id;
}

export function signInClinician() {
  localStorage.removeItem(PATIENT_KEY);
  localStorage.setItem(ROLE_KEY, 'clinician');
}

export function signOut() {
  localStorage.removeItem(PATIENT_KEY);
  localStorage.removeItem(ROLE_KEY);
}
