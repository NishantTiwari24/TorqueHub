import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSalesInvoices } from '../../../api/invoiceApi'
import StaffLayout from '../../../layout/StaffLayout'
import { formatCurrency, formatDate } from '../../../utils/invoiceUtils'
import { toastService } from '../../../services/toastService'

function SalesInvoiceListPage() {
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await getSalesInvoices()
        setInvoices(Array.isArray(data) ? data : [])
      } catch (error) {
        toastService.error(error.message || 'Failed to load sales invoices.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInvoices()
  }, [])

  const totalSales = useMemo(() => invoices.reduce((sum, invoice) => sum + Number(invoice.finalTotal || 0), 0), [invoices])
  const totalDiscount = useMemo(() => invoices.reduce((sum, invoice) => sum + Number(invoice.discount || 0), 0), [invoices])

  return (
    <StaffLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg">
          <div>
            <h2 className="text-5xl font-black tracking-tight text-on-surface">Sales Invoices</h2>
            <p className="text-body-sm text-on-surface-variant">Review customer sales, discounts, and invoice totals.</p>
          </div>
          <Link to="/staff/create-sales-invoice" className="inline-flex items-center px-lg py-sm bg-primary text-on-primary font-button text-button rounded-lg hover:bg-primary-container active:scale-95 transition-all shadow-md">
            <span className="material-symbols-outlined mr-2">add_circle</span>
            New Sales Invoice
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">Invoices</p>
            <p className="mt-3 font-h2 text-h2 text-on-surface">{invoices.length}</p>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">Final Sales</p>
            <p className="mt-3 font-h2 text-h2 text-on-surface">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">Discount Given</p>
            <p className="mt-3 font-h2 text-h2 text-on-surface">{formatCurrency(totalDiscount)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="p-lg border-b border-outline-variant bg-surface-container-low">
            <h3 className="font-h3 text-h3 text-on-surface">Invoice Registry</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase">Invoice</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase">Customer</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase">Date</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase text-right">Subtotal</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase text-right">Discount</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase text-right">Final</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase text-right">Credit</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase text-right">Status</th>
                  <th className="px-lg py-md font-label-caps text-label-caps uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {invoices.map((invoice) => (
                  <tr key={invoice.salesInvoiceId} className="hover:bg-surface-container-low">
                    <td className="px-lg py-md font-mono text-sm font-bold text-primary">{invoice.invoiceNumber}</td>
                    <td className="px-lg py-md font-semibold">{invoice.customerName}</td>
                    <td className="px-lg py-md text-on-surface-variant">{formatDate(invoice.saleDate)}</td>
                    <td className="px-lg py-md text-right">{formatCurrency(invoice.subtotal)}</td>
                    <td className="px-lg py-md text-right text-emerald-700 font-bold">-{formatCurrency(invoice.discount)}</td>
                    <td className="px-lg py-md text-right font-black">{formatCurrency(invoice.finalTotal)}</td>
                    <td className="px-lg py-md text-right font-bold text-error">{formatCurrency(invoice.creditAmount)}</td>
                    <td className="px-lg py-md text-right text-on-surface-variant">{invoice.paymentStatus || '-'}</td>
                    <td className="px-lg py-md text-right">
                      <Link to={`/staff/sales-invoices/${invoice.salesInvoiceId}`} className="inline-flex p-1.5 text-outline hover:text-primary" title="View invoice">
                        <span className="material-symbols-outlined">visibility</span>
                      </Link>
                    </td>
                  </tr>
                ))}
                {!isLoading && invoices.length === 0 && (
                  <tr><td colSpan="9" className="px-lg py-10 text-center text-on-surface-variant">No sales invoices found.</td></tr>
                )}
                {isLoading && (
                  <tr><td colSpan="9" className="px-lg py-10 text-center text-on-surface-variant">Loading invoices...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StaffLayout>
  )
}

export default SalesInvoiceListPage
