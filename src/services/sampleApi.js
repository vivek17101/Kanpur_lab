import { request } from "./apiClient";

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

export function getSampleStats(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value)
  );
  const queryString = query.toString();
  return request(`/samples/stats/summary${queryString ? `?${queryString}` : ""}`);
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
