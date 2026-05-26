const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5033'

function getAccessToken() {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
}

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function clearAuthStorage() {
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userId')
  sessionStorage.removeItem('userEmail')
  sessionStorage.removeItem('userRoles')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userId')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userRoles')
}

export async function apiRequest(path, options = {}) {
  const token = getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  let body
  if (contentType.includes('application/json')) {
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }
  } else {
    body = await response.text()
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    if (typeof body === 'object' && body !== null) {
      if (body.message) {
        message = body.message
      } else if (body.title) {
        message = body.title
      } else if (body.errors && typeof body.errors === 'object') {
        const firstEntry = Object.values(body.errors).find((entry) => Array.isArray(entry) && entry.length > 0)
        if (firstEntry) {
          message = firstEntry[0]
        }
      }
    } else if (body) {
      message = body
    }
    const error = new ApiError(message, response.status, body)

    if (response.status === 401) {
      clearAuthStorage()
      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }

    throw error
  }

  return body
}
