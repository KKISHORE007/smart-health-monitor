// ─────────────────────────────────────────────────────────────────────────────
// api.js  — HealthWatch API service layer
// All calls go to the deployed backend.
// ─────────────────────────────────────────────────────────────────────────────

const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const BASE = isLocal ? "http://localhost:3000/api" : "https://healthwatch-backend-new.vercel.app/api";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken  = ()        => localStorage.getItem("hw_token");
export const setToken  = (t)       => localStorage.setItem("hw_token", t);
export const clearToken = ()       => localStorage.removeItem("hw_token");

function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  else Object.assign(headers, authHeader());

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Public ────────────────────────────────────────────────────────────────────
/** { state: boolean } map of all portals */
export const getPortals   = ()      => req("GET",  "/portals");
/** Array of hospitals. Pass state to filter. */
export const getHospitals = (state) => req("GET",  `/hospitals${state ? `?state=${encodeURIComponent(state)}` : ""}`);
/** All hospitals (no filter) — for SA dashboard */
export const getAllHospitals = ()   => req("GET",  "/hospitals");

// ── Auth ──────────────────────────────────────────────────────────────────────
/**
 * Login. Payload shapes:
 *   Superadmin  : { role:"superadmin", id:"SA-INDIA-2024", password }
 *   HM minister : { role:"minister",   id:"HM-TN-001",     password }
 *   Patient/Doc : { email, password }
 */
export const login  = (payload) => req("POST", "/auth/login",  payload);
export const signup = (payload) => req("POST", "/auth/signup", payload);

// ── Portals (minister / superadmin) ──────────────────────────────────────────
export const unlockPortal = (state, token) =>
  req("PATCH", "/portals", { state, unlock: true },  token);
export const lockPortal   = (state, token) =>
  req("PATCH", "/portals", { state, unlock: false }, token);

// ── Hospitals (minister / superadmin) ────────────────────────────────────────
export const addHospital    = (data,  token) => req("POST",   "/hospitals",       data,  token);
export const toggleHospital = (id,    token) => req("PATCH",  `/hospitals/${id}`, {},    token);
export const deleteHospital = (id,    token) => req("DELETE", `/hospitals/${id}`, {},    token);

// ── Symptoms (authenticated) ──────────────────────────────────────────────────
export const getSymptoms  = ()     => req("GET",  "/symptoms");
export const postSymptom  = (data) => req("POST", "/symptoms", data);

// ── Alerts (authenticated) ────────────────────────────────────────────────────
export const getAlerts = () => req("GET", "/alerts");
export const viewAlert = (id) => req("PATCH", "/alerts", { id, isViewedByAdmin: true });

// ── Users (authenticated) ─────────────────────────────────────────────────────
export const getUsers     = ()     => req("GET",  "/users");
export const updateProfile = (data) => req("PATCH", "/users/profile", data);
export const getProfile   = ()     => req("GET",   "/users/profile");

// ── Admin: Health Minister credentials ───────────────────────────────────────
export const getMinisters    = (token) => req("GET",    "/admin/ministers",      undefined, token);
export const createMinister  = (data, token)  => req("POST",   "/admin/ministers",      data,  token);
export const updateMinister  = (id, data, token) => req("PATCH", `/admin/ministers/${id}`, data, token);
export const deleteMinister  = (id, token) => req("DELETE", `/admin/ministers/${id}`, undefined, token);
export const bulkDeleteMinisters = (ids, token) => req("DELETE", "/admin/ministers", { ids }, token);

// ── Cases (resolution) ────────────────────────────────────────────────────────
export const resolveSymptom = (id, isResolved = true) => req("PATCH", `/symptoms?id=${id}`, { isResolved });
export const resolveCase    = resolveSymptom; // Alias
