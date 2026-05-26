import { apiRequest } from './client'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5033'

export function login(payload) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerCustomer(payload) {
  return apiRequest('/api/auth/register-customer', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' })
  } catch {
    // Backend logout endpoint is optional for stateless JWT setups.
  }
}

export function getMe() {
  return apiRequest('/api/auth/me')
}

export function updateMe(payload) {
  return apiRequest('/api/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function changeMyPassword(payload) {
  return apiRequest('/api/auth/me/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function forgotPassword(payload) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resetPassword(payload) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyEmail(userId, token) {
  return apiRequest(`/api/auth/verify-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`)
}

export async function uploadProfileImage(file) {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/media/profile-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body?.message || 'Failed to upload profile image.')
  }

  return body
}
