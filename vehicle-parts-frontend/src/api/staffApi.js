import { apiRequest } from './client'

export function getStaffList() {
  return apiRequest('/api/admin/staff')
}

export function createStaff(payload) {
  return apiRequest('/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateStaff(staffId, payload) {
  return apiRequest(`/api/admin/staff/${staffId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteStaff(staffId) {
  return apiRequest(`/api/admin/staff/${staffId}`, {
    method: 'DELETE',
  })
}
