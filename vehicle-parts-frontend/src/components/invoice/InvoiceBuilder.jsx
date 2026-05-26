import { useMemo } from 'react'
import { calculateLoyaltyDiscount, calculateSubtotal, formatCurrency, loyaltyDiscountThreshold } from '../../utils/invoiceUtils'

function getCurrentLocalDateValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function InvoiceBuilder({
  mode,
  invoiceNumber,
  onInvoiceNumberChange,
  partyLabel,
  partyValue,
  onPartyChange,
  parties = [],
  dateLabel,
  dateValue,
  onDateChange,
  parts = [],
  items = [],
  onAddItem,
  onRemoveItem,
  onItemChange,
  onSubmit,
  isSubmitting = false,
  disableInvoiceNumberEdit = false,
  paymentMode = 'full',
  onPaymentModeChange,
  paidAmount = '',
  onPaidAmountChange,
  creditDueDate = '',
  onCreditDueDateChange,
  hasAttemptedSubmit = false,
}) {
  const priceKey = mode === 'purchase' ? 'unitCost' : 'unitPrice'
  const subtotal = useMemo(() => calculateSubtotal(items, priceKey), [items, priceKey])
  const discount = mode === 'sales' ? calculateLoyaltyDiscount(subtotal) : 0
  const finalTotal = subtotal - discount
  const normalizedPaidAmount = paidAmount === '' ? null : Number(paidAmount)
  const creditAmount = Math.max(finalTotal - Number(normalizedPaidAmount ?? finalTotal), 0)
  const hasItems = items.length > 0
  const hasInvalidStock = mode === 'sales' && items.some((item) => {
    const part = parts.find((entry) => String(entry.partId) === String(item.partId))
    return part && Number(item.quantity || 0) > Number(part.stockQuantity || 0)
  })
  const hasInvalidItems = items.some((item) => {
    const invalidBase = !item.partId || Number(item.quantity) <= 0 || Number(item[priceKey]) < 0
    if (invalidBase) return true
    if (mode === 'purchase') {
      return !['New', 'Refurbished'].includes(item.condition || 'New')
    }
    return false
  })
  const hasInvalidPayment = mode === 'sales' && (
    (normalizedPaidAmount !== null && (Number.isNaN(normalizedPaidAmount) || normalizedPaidAmount < 0 || normalizedPaidAmount > finalTotal)) ||
    (paymentMode === 'credit' && !creditDueDate)
  )
  const cannotSubmit = isSubmitting || !invoiceNumber.trim() || !partyValue || !hasItems || hasInvalidItems || hasInvalidStock || hasInvalidPayment

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_340px] gap-gutter items-start">
      <form onSubmit={onSubmit} className="space-y-gutter">
        <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <label className="space-y-2">
              <span className="text-label-caps text-on-surface-variant uppercase">Invoice number</span>
              <input value={invoiceNumber} onChange={(e) => onInvoiceNumberChange(e.target.value)} readOnly={disableInvoiceNumberEdit} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed read-only:bg-slate-50 read-only:text-on-surface-variant" />
            </label>
            <label className="space-y-2">
              <span className="text-label-caps text-on-surface-variant uppercase">{partyLabel}</span>
              <select value={partyValue} onChange={(e) => onPartyChange(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed">
                <option value="">Select {partyLabel.toLowerCase()}</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>{party.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-label-caps text-on-surface-variant uppercase">{dateLabel}</span>
              <input type="date" max={getCurrentLocalDateValue()} value={dateValue} onChange={(e) => onDateChange(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed" />
            </label>
          </div>
          {mode === 'sales' ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-md">
              <label className="space-y-2">
                <span className="text-label-caps text-on-surface-variant uppercase">Payment mode</span>
                <select
                  value={paymentMode}
                  onChange={(e) => onPaymentModeChange?.(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed"
                >
                  <option value="full">Full Payment</option>
                  <option value="credit">Credit</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-label-caps text-on-surface-variant uppercase">Paid amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => onPaidAmountChange?.(e.target.value)}
                  placeholder={formatCurrency(finalTotal)}
                  className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed"
                />
              </label>
              <label className="space-y-2">
                <span className="text-label-caps text-on-surface-variant uppercase">Credit due date</span>
                <input
                  type="date"
                  value={creditDueDate}
                  onChange={(e) => onCreditDueDateChange?.(e.target.value)}
                  disabled={paymentMode !== 'credit'}
                  className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed disabled:bg-slate-50 disabled:text-on-surface-variant"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="p-lg border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-4">
            <div>
              <h3 className="font-h3 text-on-surface">Invoice Items</h3>
              <p className="text-body-sm text-on-surface-variant">Add each part as a separate line item.</p>
            </div>
            <button type="button" onClick={onAddItem} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm hover:bg-primary-container active:scale-95 transition-all">
              <span className="material-symbols-outlined text-base">add</span>
              Add Item
            </button>
          </div>

          <div className="w-full">
            <table className="w-full text-left table-fixed">
              <thead className="bg-surface-container-low text-label-caps text-on-surface-variant uppercase">
                <tr>
                  <th className="px-lg py-4">Part</th>
                  {mode === 'sales' && <th className="px-lg py-4">Available</th>}
                  <th className="px-lg py-4">Qty</th>
                  {mode === 'purchase' && <th className="px-lg py-4">Condition</th>}
                  <th className="px-lg py-4">{mode === 'purchase' ? 'Unit Cost' : 'Unit Price'}</th>
                  <th className="px-lg py-4 text-right">Line Total</th>
                  <th className="px-lg py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {items.map((item, index) => {
                  const part = parts.find((entry) => String(entry.partId) === String(item.partId))
                  const requested = Number(item.quantity || 0)
                  const available = Number(part?.stockQuantity || 0)
                  const insufficient = mode === 'sales' && part && requested > available

                  return (
                    <tr key={item.rowId} className={insufficient ? 'bg-red-50' : 'hover:bg-primary/5'}>
                      <td className="px-lg py-4">
                        <select value={item.partId} onChange={(e) => onItemChange(index, 'partId', e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed">
                          <option value="">Select part</option>
                          {parts.map((entry) => (
                            <option key={entry.partId} value={entry.partId}>
                              {entry.name} ({entry.condition || 'New'}) - {entry.stockQuantity ?? 0} in stock
                            </option>
                          ))}
                        </select>
                      </td>
                      {mode === 'sales' && (
                        <td className="px-lg py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${insufficient ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {part ? `${available} in stock` : 'Select part'}
                          </span>
                        </td>
                      )}
                      <td className="px-lg py-4">
                        <input
                          type="number"
                          min="1"
                          max={mode === 'sales' && part ? Math.max(1, available) : undefined}
                          value={item.quantity}
                          onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                          className="w-full max-w-[86px] rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed"
                        />
                        {insufficient && <p className="mt-1 text-xs font-semibold text-red-600">Insufficient stock</p>}
                      </td>
                      {mode === 'purchase' && (
                        <td className="px-lg py-4">
                          <select value={part?.condition || item.condition || 'New'} onChange={(e) => onItemChange(index, 'condition', e.target.value)} disabled={Boolean(part)} className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed disabled:bg-slate-50 disabled:text-on-surface-variant">
                            <option value="New">New</option>
                            <option value="Refurbished">Refurbished</option>
                          </select>
                        </td>
                      )}
                      <td className="px-lg py-4">
                        {mode === 'sales' ? (
                          <div className="w-full max-w-[160px] rounded-lg border border-outline-variant bg-slate-50 px-3 py-2">
                            <p className="text-sm font-semibold text-on-surface">{formatCurrency(Number(item[priceKey] || 0))}</p>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item[priceKey]}
                            onChange={(e) => onItemChange(index, priceKey, e.target.value)}
                            readOnly={mode === 'purchase'}
                            className="w-full max-w-[130px] rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed read-only:bg-slate-50 read-only:text-on-surface-variant"
                          />
                        )}
                      </td>
                      <td className="px-lg py-4 text-right font-bold text-on-surface">{formatCurrency(requested * Number(item[priceKey] || 0))}</td>
                      <td className="px-lg py-4 text-right">
                        <button type="button" onClick={() => onRemoveItem(index)} className="rounded-lg p-2 text-outline hover:bg-red-50 hover:text-red-600" title="Remove item">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {!items.length && (
                  <tr>
                    <td colSpan={mode === 'sales' ? 6 : 7} className="px-lg py-10 text-center text-body-sm text-on-surface-variant">No items added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      <aside className="2xl:sticky 2xl:top-24 rounded-xl border border-outline-variant bg-white shadow-lg overflow-hidden self-start">
        <div className="bg-on-surface p-lg text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">Invoice Summary</p>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-white/80">Final total</span>
            <span className="text-3xl font-black">{formatCurrency(finalTotal)}</span>
          </div>
        </div>
        <div className="p-lg space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="font-bold">{formatCurrency(subtotal)}</span>
          </div>
          {mode === 'sales' && (
            <div className={`rounded-lg border p-3 ${discount > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-outline-variant bg-surface-container-low'}`}>
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined text-lg ${discount > 0 ? 'text-emerald-700' : 'text-outline'}`}>auto_awesome</span>
                <div>
                  <p className="text-xs font-bold uppercase text-on-surface">Loyalty Discount</p>
                  <p className="text-xs text-on-surface-variant">10% applies when subtotal is above {formatCurrency(loyaltyDiscountThreshold)}.</p>
                  <p className={`mt-1 text-sm font-black ${discount > 0 ? 'text-emerald-700' : 'text-on-surface-variant'}`}>-{formatCurrency(discount)}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between border-t border-outline-variant pt-4 text-base font-black">
            <span>Payable</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>
          {mode === 'sales' ? (
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Credit Amount</span>
              <span className="font-bold text-error">{formatCurrency(creditAmount)}</span>
            </div>
          ) : null}
          {hasAttemptedSubmit && hasInvalidPayment ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Fix payment details before submitting.</p> : null}
          {hasAttemptedSubmit && hasInvalidStock ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Resolve insufficient stock before submitting.</p> : null}
          <button type="button" onClick={onSubmit} disabled={cannotSubmit} className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? 'Saving...' : mode === 'purchase' ? 'Create Purchase Invoice' : 'Create Sales Invoice'}
          </button>
        </div>
      </aside>
    </div>
  )
}

export default InvoiceBuilder
