import { request } from './apiClient';

export function getSuppliers(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
  const queryString = query.toString();
  return request(`/suppliers${queryString ? `?${queryString}` : ''}`);
}

export function createSupplier(supplier) {
  return request('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
}

export function updateSupplier(id, supplier) {
  return request(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplier),
  });
}

export function deleteSupplier(id) {
  return request(`/suppliers/${id}`, {
    method: 'DELETE',
  });
}
