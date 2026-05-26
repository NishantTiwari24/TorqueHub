import { apiRequest } from './client'

export function getStockTransactions() {
  return apiRequest('/api/stock-transactions')
}
