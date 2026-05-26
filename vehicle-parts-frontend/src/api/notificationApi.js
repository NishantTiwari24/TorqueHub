import { apiRequest } from './client'

export function getMyNotifications() {
  return apiRequest('/api/notifications/me')
}

export function markNotificationAsRead(notificationId) {
  return apiRequest(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}

export function getLowStockNotifications() {
  return apiRequest('/api/notifications/low-stock')
}

export function checkLowStockNotifications() {
  return apiRequest('/api/notifications/check-low-stock', {
    method: 'POST',
  })
}
