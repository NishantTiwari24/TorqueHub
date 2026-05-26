import { apiRequest } from './client'

export function getMyAppointments() {
  return apiRequest('/api/appointments/my')
}

export function createAppointment(data) {
  return apiRequest('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function rescheduleAppointment(id, data) {
  return apiRequest(`/api/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function cancelAppointment(id) {
  return apiRequest(`/api/appointments/${id}/cancel`, {
    method: 'PATCH',
  })
}

export function getAllAppointments() {
  return apiRequest('/api/appointments')
}

export function updateAppointmentStatus(id, data) {
  return apiRequest(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
