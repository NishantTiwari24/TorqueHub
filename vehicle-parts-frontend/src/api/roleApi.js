import { apiRequest } from './client'

export function getStaffRoles(staffId) {
  return apiRequest(`/api/admin/staff/${staffId}/roles`)
}

export function assignStaffRoles(staffId, roles) {
  return apiRequest(`/api/admin/staff/${staffId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roles }),
  })
}

export function revokeStaffRole(staffId, role) {
  return apiRequest(`/api/admin/staff/${staffId}/roles/${encodeURIComponent(role)}`, {
    method: 'DELETE',
  })
}
