import { apiRequest } from './client'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5033'

export function getPartList() {
  return apiRequest('/api/admin/parts')
}

export function getPublicPartList() {
  return apiRequest('/api/parts')
}

export function getPublicPartById(partId) {
  return apiRequest(`/api/parts/${partId}`)
}

export function getStaffPartList() {
  return apiRequest('/api/staff/parts')
}

export function createPart(payload) {
  return apiRequest('/api/admin/parts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePart(partId, payload) {
  return apiRequest(`/api/admin/parts/${partId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function purchasePartStock(partId, payload) {
  return apiRequest(`/api/admin/parts/${partId}/purchase`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deletePart(partId) {
  return apiRequest(`/api/admin/parts/${partId}`, {
    method: 'DELETE',
  })
}

export async function uploadPartImage(file) {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/media/part-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body?.message || 'Failed to upload part image.')
  }

  return body
}
