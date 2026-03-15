const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const rawClientId = import.meta.env.VITE_CLIENT_ID?.trim();
const rawAdminApiToken = import.meta.env.VITE_ADMIN_API_TOKEN?.trim();
const ACTIVE_CLIENT_STORAGE_KEY = "chatking_active_client_id";

function normalizeClientId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readStoredClientId() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeClientId(window.localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY));
  } catch {
    return "";
  }
}

export const API_URL = rawApiUrl ? rawApiUrl.replace(/\/$/, "") : "";
export let CLIENT_ID = readStoredClientId() || normalizeClientId(rawClientId);
export const ADMIN_API_TOKEN = rawAdminApiToken || "";

export function getActiveClientId() {
  return CLIENT_ID;
}

export function setActiveClientId(nextClientId) {
  CLIENT_ID = normalizeClientId(nextClientId);
  if (typeof window !== "undefined") {
    try {
      if (CLIENT_ID) {
        window.localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, CLIENT_ID);
      } else {
        window.localStorage.removeItem(ACTIVE_CLIENT_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep the in-memory selection.
    }
  }
  return CLIENT_ID;
}

const missingEnvVars = [
  !API_URL ? "VITE_API_URL" : null,
  !CLIENT_ID ? "VITE_CLIENT_ID" : null,
].filter(Boolean);

export const hasRequiredConfig = missingEnvVars.length === 0;

if (typeof window !== "undefined" && ADMIN_API_TOKEN && !window.__chatKingPatchedFetch) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const requestUrl = typeof input === "string" ? input : input?.url || "";
    const isApiRequest = requestUrl.startsWith(`${API_URL}/`) || requestUrl.startsWith("/api/");

    if (!isApiRequest) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${ADMIN_API_TOKEN}`);
    }

    return originalFetch(input, {
      ...init,
      headers,
    });
  };

  window.__chatKingPatchedFetch = true;
}

export function getConfigWarning() {
  if (hasRequiredConfig) return "";
  return `Missing frontend environment variables: ${missingEnvVars.join(", ")}.`;
}

if (import.meta.env.DEV && !hasRequiredConfig) {
  console.error(`${getConfigWarning()} Create a .env file from .env.example before running ChatKing.`);
}

export async function apiFetch(path, options = {}) {
  if (!API_URL) {
    console.error("Missing VITE_API_URL. API requests are disabled until the frontend environment is configured.");
    return null;
  }

  try {
    const url = path.startsWith("http") ? path : `${API_URL}${path}`;
    const finalHeaders = new Headers(options.headers || {});
    if (ADMIN_API_TOKEN && !finalHeaders.has("Authorization")) {
      finalHeaders.set("Authorization", `Bearer ${ADMIN_API_TOKEN}`);
    }

    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  } catch (error) {
    console.error("API error:", path, error);
    return null;
  }
}

export async function apiJson(path, options = {}) {
  if (!API_URL) {
    throw new Error("Missing VITE_API_URL. API requests are disabled until the frontend environment is configured.");
  }

  const {
    body,
    headers,
    method = "GET",
    ...rest
  } = options;

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const finalHeaders = new Headers(headers || {});
  let finalBody = body;

  if (ADMIN_API_TOKEN && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${ADMIN_API_TOKEN}`);
  }

  if (body !== undefined && !(body instanceof FormData) && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (
    body !== undefined &&
    finalHeaders.get("Content-Type")?.includes("application/json") &&
    typeof body !== "string"
  ) {
    finalBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      ...rest,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      if (payload && typeof payload === "object") {
        throw new Error(payload.error || payload.details || `HTTP ${response.status}`);
      }
      throw new Error(payload || `HTTP ${response.status}`);
    }

    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Failed to fetch. Check that the backend is running and the API URL is reachable.");
    }
    throw error;
  }
}
