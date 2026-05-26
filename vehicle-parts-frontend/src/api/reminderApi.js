import { apiRequest } from './client'

export function runOverdueCreditReminders() {
  return apiRequest('/api/reminders/run', {
    method: 'POST',
  })
}

export function sendOverdueCreditReminders() {
  return apiRequest('/api/reminders/send-overdue-credit-reminders', {
    method: 'POST',
  })
}
