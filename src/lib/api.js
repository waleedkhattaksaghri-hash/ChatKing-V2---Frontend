const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const rawClientId = import.meta.env.VITE_CLIENT_ID?.trim();
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

const missingEnvVars = [!API_URL ? "VITE_API_URL" : null].filter(Boolean);

export const hasRequiredConfig = missingEnvVars.length === 0;

export function getConfigWarning() {
  if (hasRequiredConfig) return "";
  return `Missing frontend environment variables: ${missingEnvVars.join(", ")}.`;
}

if (import.meta.env.DEV && !hasRequiredConfig) {
  console.error(`${getConfigWarning()} Create a .env file from .env.example before running ChatKing.`);
}

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");
}

function dispatchUnauthorized() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("chatking:unauthorized"));
  }
}

export async function getAdminSessionStatus() {
  if (!API_URL) return { authenticated: false };
  try {
    const response = await fetch(`${API_URL}/api/admin/session`, {
      credentials: "include",
    });
    if (!response.ok) {
      return { authenticated: false };
    }
    return (await parseApiResponse(response)) || { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

export async function requestAdminLoginCode(email) {
  return apiJson("/api/admin/session/request-code", {
    method: "POST",
    body: { email },
  });
}

export async function verifyAdminLoginCode(email, code) {
  return apiJson("/api/admin/session/verify-code", {
    method: "POST",
    body: { email, code },
  });
}

export async function loginAdminSession(token) {
  return apiJson("/api/admin/session", {
    method: "POST",
    body: { token },
  });
}

export async function logoutAdminSession() {
  return apiJson("/api/admin/session", {
    method: "DELETE",
  });
}

export async function apiFetch(path, options = {}) {
  if (!API_URL) {
    console.error("Missing VITE_API_URL. API requests are disabled until the frontend environment is configured.");
    return null;
  }

  try {
    const url = path.startsWith("http") ? path : `${API_URL}${path}`;
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (response.status === 401) {
      dispatchUnauthorized();
    }

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `HTTP ${response.status}`);
    }

    return parseApiResponse(response);
  } catch (error) {
    console.error("API error:", path, error);
    return null;
  }
}

export async function apiJson(path, options = {}) {
  if (!API_URL) {
    throw new Error("Missing VITE_API_URL. API requests are disabled until the frontend environment is configured.");
  }

  const { body, headers, method = "GET", ...rest } = options;

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const finalHeaders = new Headers(headers || {});
  let finalBody = body;

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
      credentials: "include",
      ...rest,
    });

    const payload = await parseApiResponse(response);

    if (response.status === 401) {
      dispatchUnauthorized();
    }

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

