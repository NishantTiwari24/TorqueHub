import { apiRequest } from './client'

export function getVendorList() {
  return apiRequest('/api/admin/vendors')
}

export function createVendor(payload) {
  return apiRequest('/api/admin/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateVendor(vendorId, payload) {
  return apiRequest(`/api/admin/vendors/${vendorId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteVendor(vendorId) {
  return apiRequest(`/api/admin/vendors/${vendorId}`, {
    method: 'DELETE',
  })
}
