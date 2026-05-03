type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let authToken: string | null = null;

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

  const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
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
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  const data = await res.json();
  return data as T;
};
