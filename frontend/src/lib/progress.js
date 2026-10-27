const KEY = "bailina_progress_v1";
const PIN_KEY = "bailina_parent_pin_v1";
const UNLOCK_KEY = "bailina_parent_unlocked";

export const getProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

const save = (p) => localStorage.setItem(KEY, JSON.stringify(p));

const worldOf = (p, slug) => p[slug] || { games: {}, words: [], heard: {} };

export function recordGame(slug, game, wordIds = []) {
  const p = getProgress();
  const w = worldOf(p, slug);
  const g = w.games[game] || { plays: 0 };
  w.games[game] = { plays: g.plays + 1, last: new Date().toISOString() };
  w.words = [...new Set([...(w.words || []), ...wordIds])];
  p[slug] = w;
  save(p);
}

export function markHeard(slug, what) {
  const p = getProgress();
  const w = worldOf(p, slug);
  w.heard = { ...(w.heard || {}), [what]: true };
  p[slug] = w;
  save(p);
}

export const resetProgress = () => localStorage.removeItem(KEY);

const toB64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pin, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, key, 256);
  return toB64(new Uint8Array(bits));
}

export const hasPin = () => !!localStorage.getItem(PIN_KEY);

export async function setPin(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt);
  localStorage.setItem(PIN_KEY, JSON.stringify({ salt: toB64(salt), hash }));
}

export async function checkPin(pin) {
  try {
    const { salt, hash } = JSON.parse(localStorage.getItem(PIN_KEY));
    return (await derive(pin, fromB64(salt))) === hash;
  } catch {
    return false;
  }
}

export function clearPinAndProgress() {
  localStorage.removeItem(PIN_KEY);
  resetProgress();
  sessionStorage.removeItem(UNLOCK_KEY);
}

export const isUnlocked = () => sessionStorage.getItem(UNLOCK_KEY) === "1";
export const setUnlocked = (v) => (v ? sessionStorage.setItem(UNLOCK_KEY, "1") : sessionStorage.removeItem(UNLOCK_KEY));
