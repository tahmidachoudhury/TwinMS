// Mock auth — a signed-in patient id in localStorage. Swap for a real
// identity provider without touching the pages: keep these three exports.
import { patients } from './data/twinms-config.js';

const KEY = 'twinms.patientId';

export function getCurrentPatientId() {
  const id = localStorage.getItem(KEY);
  return id && patients[id] ? id : null;
}

// Any password is accepted; the email picks the mock patient.
// Unknown emails fall back to the first demo patient.
export function signIn(email) {
  const normalized = email.trim().toLowerCase();
  const match = Object.values(patients).find((p) => p.email === normalized);
  const id = match ? match.id : Object.keys(patients)[0];
  localStorage.setItem(KEY, id);
  return id;
}

export function signOut() {
  localStorage.removeItem(KEY);
}
