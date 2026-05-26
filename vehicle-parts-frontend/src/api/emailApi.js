import { apiRequest } from './client'

export function sendInvoiceEmail(data) {
  return apiRequest('/api/email/invoices/send', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getEmailLogs() {
  return apiRequest('/api/email/logs')
}

export function getEmailLogById(id) {
  return apiRequest(`/api/email/logs/${id}`)
}
