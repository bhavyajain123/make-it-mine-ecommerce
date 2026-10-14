
const API_BASE_URL = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("mim_token");
}

async function apiRequest(endpoint, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export { API_BASE_URL, getToken, apiRequest };
