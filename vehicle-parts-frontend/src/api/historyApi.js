import { apiRequest } from './client'

export function getCustomerHistory() {
  return apiRequest('/api/customer/history')
}

export function getPurchaseHistory() {
  return apiRequest('/api/customer/purchase-history')
}

export function getServiceHistory() {
  return apiRequest('/api/customer/service-history')
}

export function getCustomerHistoryById(id) {
  return apiRequest(`/api/customers/${id}/history`)
}

export function getCustomerPurchaseHistoryById(id) {
  return apiRequest(`/api/customers/${id}/purchase-history`)
}
