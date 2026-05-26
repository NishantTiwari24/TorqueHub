import { apiRequest } from './client'

export function getDailyFinancialReport(date) {
  return apiRequest(`/api/reports/financial/daily?date=${encodeURIComponent(date)}`)
}

export function getMonthlyFinancialReport(year, month) {
  return apiRequest(`/api/reports/financial/monthly?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`)
}

export function getYearlyFinancialReport(year) {
  return apiRequest(`/api/reports/financial/yearly?year=${encodeURIComponent(year)}`)
}

export function getRegularCustomersReport() {
  return apiRequest('/api/reports/customers/regulars')
}

export function getHighSpendersReport() {
  return apiRequest('/api/reports/customers/high-spenders')
}

export function getPendingCreditsReport() {
  return apiRequest('/api/reports/customers/pending-credits')
}

export function getOverdueCreditsReport() {
  return apiRequest('/api/reports/customers/overdue-credits')
}
