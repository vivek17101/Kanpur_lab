export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function getStoredToken() {
  return localStorage.getItem('kanpurLabAdminToken');
}

export function setStoredToken(token) {
  localStorage.setItem('kanpurLabAdminToken', token);
}

export function clearStoredToken() {
  localStorage.removeItem('kanpurLabAdminToken');
}

export async function request(path, options = {}) {
  let response;
  const token = options.token || getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Could not connect to the backend at ${API_BASE_URL}. Start MongoDB and run "npm run server", or set REACT_APP_API_URL to your API server.`
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
