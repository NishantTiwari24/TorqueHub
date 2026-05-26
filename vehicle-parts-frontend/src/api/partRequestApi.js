import { apiRequest } from './client'

export function createPartRequest(data) {
  return apiRequest('/api/part-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getMyPartRequests() {
  return apiRequest('/api/part-requests/my')
}

export function getPartRequestById(id) {
  return apiRequest(`/api/part-requests/${id}`)
}

export function deletePartRequest(id) {
  return apiRequest(`/api/part-requests/${id}`, {
    method: 'DELETE',
  })
}

export function getAllPartRequests() {
  return apiRequest('/api/part-requests')
}

export function updatePartRequestStatus(id, data) {
  return apiRequest(`/api/part-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
