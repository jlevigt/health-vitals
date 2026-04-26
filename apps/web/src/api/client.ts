/**
 * Native Fetch-based API Client
 * Includes automatic Bearer token injection and transparent token refresh.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined");
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  data?: any;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<{ data: T; status: number; headers: Headers }> {
  const { params, data, ...fetchOptions } = options;
  
  // Construct URL
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  }

  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  const token = localStorage.getItem("accessToken");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (data) {
    if (data instanceof FormData) {
      fetchOptions.body = data;
      // Do not set Content-Type, browser will set it with boundary
    } else if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
      fetchOptions.body = JSON.stringify(data);
    }
  }

  const performFetch = () => fetch(url.toString(), {
    ...fetchOptions,
    headers,
  });

  let response = await performFetch();

  // Handle 401 Unauthorized (Token Refresh)
  if (response.status === 401 && !path.includes("/auth/refresh")) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          headers.set("Authorization", `Bearer ${token}`);
          return performFetch().then(res => handleResponse<T>(res));
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!refreshResponse.ok) {
        throw new Error("Refresh failed");
      }

      const { accessToken } = await refreshResponse.json();
      localStorage.setItem("accessToken", accessToken);
      
      processQueue(null, accessToken);
      
      // Retry original request
      headers.set("Authorization", `Bearer ${accessToken}`);
      response = await performFetch();
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T = any>(response: Response): Promise<{ data: T; status: number; headers: Headers }> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Mimic Axios error structure for compatibility
    const error = new Error(data?.message || response.statusText) as any;
    error.response = {
      status: response.status,
      data,
    };
    throw error;
  }

  return { data, status: response.status, headers: response.headers };
}

export const api = {
  get: <T = any>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T = any>(path: string, data?: any, options?: RequestOptions) => request<T>(path, { ...options, method: "POST", data }),
  put: <T = any>(path: string, data?: any, options?: RequestOptions) => request<T>(path, { ...options, method: "PUT", data }),
  delete: <T = any>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};
