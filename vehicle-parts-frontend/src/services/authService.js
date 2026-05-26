import { logout } from '../api/authApi'

const TOKEN_KEY = 'accessToken'
const ROLES_KEY = 'userRoles'
const USER_PROFILE_KEY = 'authUserProfile'

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function getUserRoles() {
  const raw = sessionStorage.getItem(ROLES_KEY) || localStorage.getItem(ROLES_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

export function hasAnyRole(allowedRoles = []) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true
  const userRoles = getUserRoles()
  return allowedRoles.some((role) => userRoles.includes(role))
}

export function clearAuthSession() {
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userId')
  sessionStorage.removeItem('userEmail')
  sessionStorage.removeItem('userRoles')
  sessionStorage.removeItem(USER_PROFILE_KEY)
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userId')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userRoles')
  localStorage.removeItem(USER_PROFILE_KEY)
}

export async function logoutUser() {
  await logout()
  clearAuthSession()
}

export function getRoleHomeRoute(roles = []) {
  if (roles.includes('Admin')) return '/admin'
  if (roles.includes('Staff')) return '/staff'
  if (roles.includes('Customer')) return '/customer'
  return '/public'
}

export function getAuthenticatedHomeRoute() {
  if (!isAuthenticated()) return '/login'
  return getRoleHomeRoute(getUserRoles())
}

function sanitizeProfile(profile = {}) {
  return {
    name: typeof profile.name === 'string' ? profile.name : '',
    email: typeof profile.email === 'string' ? profile.email : '',
    phoneNumber: typeof profile.phoneNumber === 'string' ? profile.phoneNumber : '',
    profileImageUrl: typeof profile.profileImageUrl === 'string' ? profile.profileImageUrl : '',
    roles: Array.isArray(profile.roles) ? profile.roles : [],
  }
}

function getPrimaryAuthStorage() {
  if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage
  if (localStorage.getItem(TOKEN_KEY)) return localStorage
  return sessionStorage
}

export function getStoredUserProfile() {
  const raw = sessionStorage.getItem(USER_PROFILE_KEY) || localStorage.getItem(USER_PROFILE_KEY)
  if (!raw) return null

  try {
    return sanitizeProfile(JSON.parse(raw))
  } catch {
    return null
  }
}

export function setStoredUserProfile(profile = {}) {
  const existing = getStoredUserProfile() || {}
  const normalized = sanitizeProfile({
    ...existing,
    ...profile,
    roles: Array.isArray(profile.roles) ? profile.roles : existing.roles || [],
  })
  const storage = getPrimaryAuthStorage()
  storage.setItem(USER_PROFILE_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent('auth-user-updated', { detail: normalized }))
  return normalized
}
