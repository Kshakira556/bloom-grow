type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let authToken: string | null = null;

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const http = async <T>(
  url: string,
  method: HttpMethod,
  body?: unknown
): Promise<T> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (!API_URL) {
    throw new Error("API is not configured. Set VITE_API_URL.");
  }
  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setAuthToken(null);

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // Let React Router handle navigation instead of hard reload
    throw new Error("Unauthorized");
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
