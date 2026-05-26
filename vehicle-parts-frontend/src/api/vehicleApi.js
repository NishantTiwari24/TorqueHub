import { apiRequest } from './client'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5033'

export function getMyVehicles() {
  return apiRequest('/api/vehicles/my')
}

export function createVehicle(payload) {
  return apiRequest('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateVehicle(vehicleId, payload) {
  return apiRequest(`/api/vehicles/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteVehicle(vehicleId) {
  return apiRequest(`/api/vehicles/${vehicleId}`, {
    method: 'DELETE',
  })
}

export async function uploadVehicleImage(file, vehicleId = null) {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
  const formData = new FormData()
  formData.append('file', file)
  if (vehicleId !== null && vehicleId !== undefined) {
    formData.append('vehicleId', String(vehicleId))
  }

  const response = await fetch(`${API_BASE_URL}/api/media/vehicle-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof body === 'object' && body?.message ? body.message : 'Failed to upload vehicle image.'
    throw new Error(message)
  }

  return body
}
