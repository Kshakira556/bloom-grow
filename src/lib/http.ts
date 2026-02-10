type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const http = async <T>(
  url: string,
  method: HttpMethod,
  body?: unknown
): Promise<T | null> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const API_URL = import.meta.env.VITE_API_URL; 
  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setAuthToken(null);
    window.location.href = "/dashboard";
    throw new Error("Unauthorized");
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
};
