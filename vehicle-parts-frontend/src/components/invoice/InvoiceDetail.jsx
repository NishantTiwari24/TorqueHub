import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../utils/invoiceUtils'

function InvoiceDetail({ invoice, type, backTo }) {
  const isPurchase = type === 'purchase'
  const items = invoice?.items || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary uppercase">{isPurchase ? 'Purchase Invoice' : 'Sales Invoice'}</p>
          <h2 className="text-5xl font-black tracking-tight text-on-surface">{invoice.invoiceNumber}</h2>
          <p className="text-body-sm text-on-surface-variant">{formatDate(isPurchase ? invoice.invoiceDate : invoice.saleDate)}</p>
        </div>
        <Link to={backTo} className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 font-bold text-on-surface hover:bg-surface-container">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to list
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
          <div className="border-b border-outline-variant bg-surface-container-low p-lg">
            <h3 className="font-h3 text-on-surface">Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-caps text-on-surface-variant uppercase">
                <tr>
                  <th className="px-lg py-4">Part</th>
                  <th className="px-lg py-4">Qty</th>
                  <th className="px-lg py-4 text-right">{isPurchase ? 'Unit Cost' : 'Unit Price'}</th>
                  <th className="px-lg py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {items.map((item) => (
                  <tr key={isPurchase ? item.purchaseInvoiceItemId : item.salesInvoiceItemId}>
                    <td className="px-lg py-4 font-semibold text-on-surface">{item.partName}</td>
                    <td className="px-lg py-4 text-on-surface-variant">{item.quantity}</td>
                    <td className="px-lg py-4 text-right">{formatCurrency(isPurchase ? item.unitCost : item.unitPrice)}</td>
                    <td className="px-lg py-4 text-right font-bold">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden">
          <div className="bg-on-surface p-lg text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">{isPurchase ? 'Vendor' : 'Customer'}</p>
            <p className="mt-2 text-xl font-black">{isPurchase ? invoice.vendorName : invoice.customerName}</p>
            {!isPurchase && <p className="text-sm text-white/70">Staff: {invoice.staffName}</p>}
          </div>
          <div className="p-lg space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-bold">{formatCurrency(isPurchase ? invoice.totalAmount : invoice.subtotal)}</span>
            </div>
            {!isPurchase && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Discount</span>
                <span className="font-bold text-emerald-700">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {!isPurchase && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Paid Amount</span>
                <span className="font-bold">{formatCurrency(invoice.paidAmount)}</span>
              </div>
            )}
            {!isPurchase && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Credit Amount</span>
                <span className="font-bold text-error">{formatCurrency(invoice.creditAmount)}</span>
              </div>
            )}
            {!isPurchase && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Payment Status</span>
                <span className="font-bold">{invoice.paymentStatus || '-'}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-outline-variant pt-4 text-base font-black">
              <span>{isPurchase ? 'Total' : 'Final Payable'}</span>
              <span>{formatCurrency(isPurchase ? invoice.totalAmount : invoice.finalTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default InvoiceDetail
