const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  } catch (error) {
    throw new Error(
      `Could not connect to the backend at ${API_BASE_URL}. Start MongoDB and run "npm run server", or set REACT_APP_API_URL to your API server.`
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function createSample(sample) {
  return request("/samples", {
    method: "POST",
    body: JSON.stringify(sample),
  });
}

export function getSamples(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value)
  );
  const queryString = query.toString();
  return request(`/samples${queryString ? `?${queryString}` : ""}`);
}

export function getSample(id) {
  return request(`/samples/${id}`);
}

export function updateSample(id, sample) {
  return request(`/samples/${id}`, {
    method: "PUT",
    body: JSON.stringify(sample),
  });
}

export function deleteSample(id) {
  return request(`/samples/${id}`, {
    method: "DELETE",
  });
}
