import { apiRequest } from './client'

export function getPurchaseInvoices() {
  return apiRequest('/api/admin/purchase-invoices')
}

export function getPurchaseInvoiceById(purchaseInvoiceId) {
  return apiRequest(`/api/admin/purchase-invoices/${purchaseInvoiceId}`)
}

export function createPurchaseInvoice(payload) {
  return apiRequest('/api/admin/purchase-invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getNextPurchaseInvoiceNumber(invoiceDate) {
  const query = invoiceDate ? `?invoiceDate=${encodeURIComponent(invoiceDate)}` : ''
  return apiRequest(`/api/admin/purchase-invoices/next-number${query}`)
}

export function getSalesInvoices() {
  return apiRequest('/api/staff/sales-invoices')
}

export function getSalesInvoiceById(salesInvoiceId) {
  return apiRequest(`/api/staff/sales-invoices/${salesInvoiceId}`)
}

export function getNextSalesInvoiceNumber(saleDate) {
  const query = saleDate ? `?saleDate=${encodeURIComponent(saleDate)}` : ''
  return apiRequest(`/api/staff/sales-invoices/next-number${query}`)
}

export function createSalesInvoice(payload) {
  return apiRequest('/api/staff/sales-invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
