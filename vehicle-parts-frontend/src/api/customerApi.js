import { apiRequest } from './client'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5033'

export function getCustomers() {
  return apiRequest('/api/customers/search')
}

export function searchCustomers(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query}` : ''
  return apiRequest(`/api/customers/search${suffix}`)
}

export function getCustomerById(customerId) {
  return apiRequest(`/api/customers/${customerId}`)
}

export function registerCustomer(payload) {
  return apiRequest('/api/customers/register-with-vehicle', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function patchMyCustomerProfile(payload) {
  return apiRequest('/api/customers/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function uploadVehicleImage(file) {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/media/vehicle-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body?.message || 'Failed to upload vehicle image.')
  }

  return body
}
