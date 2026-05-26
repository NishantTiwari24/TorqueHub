import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getPurchaseInvoices, getSalesInvoices } from '../../../api/invoiceApi'
import AdminLayout from '../../../layout/AdminLayout'
import AdminTable from '../../../components/admin/AdminTable'
import { formatCurrency, formatDate } from '../../../utils/invoiceUtils'
import { toastService } from '../../../services/toastService'

const PurchaseInvoice = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'sales' ? 'sales' : 'purchase'
  const [purchaseInvoices, setPurchaseInvoices] = useState([])
  const [salesInvoices, setSalesInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const [purchaseData, salesData] = await Promise.all([
        getPurchaseInvoices(),
        getSalesInvoices(),
      ])
      setPurchaseInvoices(Array.isArray(purchaseData) ? purchaseData : [])
      setSalesInvoices(Array.isArray(salesData) ? salesData : [])
    } catch (error) {
      toastService.error(error.message || 'Failed to load invoices.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadInvoices()
  }, [])

  const totalPurchaseAmount = useMemo(() => purchaseInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0), [purchaseInvoices])
  const totalSalesAmount = useMemo(() => salesInvoices.reduce((sum, invoice) => sum + Number(invoice.finalTotal || 0), 0), [salesInvoices])
  const totalCreditAmount = useMemo(() => salesInvoices.reduce((sum, invoice) => sum + Number(invoice.creditAmount || 0), 0), [salesInvoices])
  const totalPurchaseItems = useMemo(() => purchaseInvoices.reduce((sum, invoice) => sum + Number(invoice.items?.length || 0), 0), [purchaseInvoices])
  const filteredPurchaseInvoices = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return purchaseInvoices
    return purchaseInvoices.filter((invoice) => {
      const haystack = `${invoice.invoiceNumber || ''} ${invoice.vendorName || ''}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [purchaseInvoices, searchText])
  const filteredSalesInvoices = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return salesInvoices
    return salesInvoices.filter((invoice) => {
      const haystack = `${invoice.invoiceNumber || ''} ${invoice.customerName || ''} ${invoice.paymentStatus || ''}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [salesInvoices, searchText])

  const setActiveTab = (tab) => {
    setSearchText('')
    setSearchParams(tab === 'sales' ? { tab: 'sales' } : {})
  }

  return (
    <AdminLayout contentClassName="px-6 pb-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg">
          <div>
            <h2 className="text-5xl font-black tracking-tight text-on-surface">Invoices</h2>
            <p className="font-body-base text-body-base text-on-surface-variant mt-xs">Track sales invoices, purchase invoices, credits, and procurement totals.</p>
          </div>
          <Link to="/admin/purchase-invoice/create" className="inline-flex items-center px-lg py-sm bg-primary text-on-primary font-button text-button rounded-lg hover:bg-primary-container active:scale-95 transition-all shadow-md">
            <span className="material-symbols-outlined mr-2">add_circle</span>
            Create Purchase Invoice
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">Sales Invoices</p>
            <p className="mt-3 font-h2 text-h2 text-on-surface">{salesInvoices.length}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{formatCurrency(totalSalesAmount)} total sales</p>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">Purchase Invoices</p>
            <p className="mt-3 font-h2 text-h2 text-on-surface">{purchaseInvoices.length}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{formatCurrency(totalPurchaseAmount)} purchased</p>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">Credit Balance</p>
            <p className="mt-3 font-h2 text-h2 text-on-surface">{formatCurrency(totalCreditAmount)}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{totalPurchaseItems} purchase item lines</p>
          </div>
        </div>

        <div className="inline-flex w-fit rounded-xl border border-outline-variant bg-white p-1 shadow-sm">
          <button
            className={`h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${activeTab === 'purchase' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            onClick={() => setActiveTab('purchase')}
            type="button"
          >
            Purchase Invoices
          </button>
          <button
            className={`h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${activeTab === 'sales' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            onClick={() => setActiveTab('sales')}
            type="button"
          >
            Sales Invoices
          </button>
        </div>

        <AdminTable
          title={activeTab === 'purchase' ? 'Purchase Invoice Registry' : 'Sales Invoice Registry'}
          action={(
            <div className="flex items-center gap-2">
              <label className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  className="h-[38px] w-[220px] rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary"
                  placeholder="Search invoices..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </label>
              <button onClick={() => void loadInvoices()} className="flex items-center text-sm text-outline border border-outline-variant px-3 py-1.5 rounded-lg hover:bg-surface-variant transition-colors" type="button">
                <span className="material-symbols-outlined text-sm mr-2">refresh</span>
                Refresh
              </button>
            </div>
          )}
          columns={activeTab === 'purchase'
            ? [
                { key: 'invoice', label: 'Invoice', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
                { key: 'vendor', label: 'Vendor', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
                { key: 'date', label: 'Date', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
                { key: 'items', label: 'Items', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
                { key: 'total', label: 'Total', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
                { key: 'actions', label: 'Actions', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
              ]
            : [
                { key: 'invoice', label: 'Invoice', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
                { key: 'customer', label: 'Customer', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
                { key: 'date', label: 'Date', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
                { key: 'final', label: 'Final', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
                { key: 'credit', label: 'Credit', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
                { key: 'status', label: 'Status', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
                { key: 'actions', label: 'Actions', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
              ]}
          isLoading={isLoading}
          isEmpty={!isLoading && (activeTab === 'purchase' ? filteredPurchaseInvoices.length === 0 : filteredSalesInvoices.length === 0)}
          loadingText="Loading invoices..."
          emptyText={`No matching ${activeTab} invoices found.`}
        >
          {activeTab === 'purchase'
            ? filteredPurchaseInvoices.map((invoice) => (
                <tr key={invoice.purchaseInvoiceId} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-lg py-md font-mono text-sm font-bold text-primary">{invoice.invoiceNumber}</td>
                  <td className="px-lg py-md font-semibold text-on-surface">{invoice.vendorName}</td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">{formatDate(invoice.invoiceDate)}</td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">{invoice.items?.length || 0}</td>
                  <td className="px-lg py-md text-right font-bold">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="px-lg py-md text-right">
                    <Link to={`/admin/purchase-invoice/${invoice.purchaseInvoiceId}`} className="inline-flex p-1.5 text-outline hover:text-primary transition-colors" title="View invoice">
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                  </td>
                </tr>
              ))
            : filteredSalesInvoices.map((invoice) => (
                <tr key={invoice.salesInvoiceId} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-lg py-md font-mono text-sm font-bold text-primary">{invoice.invoiceNumber}</td>
                  <td className="px-lg py-md font-semibold text-on-surface">{invoice.customerName}</td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">{formatDate(invoice.saleDate)}</td>
                  <td className="px-lg py-md text-right font-bold">{formatCurrency(invoice.finalTotal)}</td>
                  <td className="px-lg py-md text-right font-bold text-error">{formatCurrency(invoice.creditAmount)}</td>
                  <td className="px-lg py-md text-right text-on-surface-variant">{invoice.paymentStatus || '-'}</td>
                  <td className="px-lg py-md text-right">
                    <Link to={`/admin/sales-invoices/${invoice.salesInvoiceId}`} className="inline-flex p-1.5 text-outline hover:text-primary transition-colors" title="View invoice">
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                  </td>
                </tr>
              ))}
        </AdminTable>
      </div>
    </AdminLayout>
  )
}

export default PurchaseInvoice

