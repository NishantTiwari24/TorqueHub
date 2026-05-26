import { apiRequest } from './client'

export function createReview(data) {
  return apiRequest('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getMyReviews() {
  return apiRequest('/api/reviews/my')
}

export function getAllReviews() {
  return apiRequest('/api/reviews')
}

export function updateReview(id, data) {
  return apiRequest(`/api/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteReview(id) {
  return apiRequest(`/api/reviews/${id}`, {
    method: 'DELETE',
  })
}
