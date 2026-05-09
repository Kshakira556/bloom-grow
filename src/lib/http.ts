type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const http = async <T>(
  url: string,
  method: HttpMethod,
  body?: unknown
): Promise<T> => {
  const headers: HeadersInit = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!API_URL) {
    throw new Error("API is not configured. Set VITE_API_URL.");
  }
  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("has_session");

    // Prefer backend-provided message (e.g., wrong password vs no account).
    const errorJson = await res.json().catch(() => ({}));
    const message =
      typeof (errorJson as any)?.error === "string"
        ? (errorJson as any).error
        : "Unauthorized";

    throw new Error(message);
  }

  if (res.status === 404) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `Endpoint not found: ${url}`);
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");

    let errorJson: any = null;
    try {
      errorJson = errorText ? JSON.parse(errorText) : null;
    } catch {
      errorJson = null;
    }

    const raw = errorJson?.error ?? errorJson ?? null;
    const message =
      typeof raw === "string"
        ? raw
        : raw
          ? JSON.stringify(raw)
          : errorText || "Request failed";

    throw new Error(message);
  }

  const data = await res.json();
  return data as T;
};
