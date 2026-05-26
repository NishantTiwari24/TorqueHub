export const loyaltyDiscountThreshold = 5000
export const loyaltyDiscountRate = 0.1

export function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`
}

export function formatDate(value) {
  if (!value) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function getTodayInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateSubtotal(items = [], priceKey = 'unitPrice') {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item[priceKey] || 0), 0)
}

export function calculateLoyaltyDiscount(subtotal) {
  return subtotal > loyaltyDiscountThreshold ? Math.round(subtotal * loyaltyDiscountRate * 100) / 100 : 0
}

export function createInvoiceNumber(prefix) {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `${prefix}-${date}-${String(now.getTime()).slice(-5)}`
}
