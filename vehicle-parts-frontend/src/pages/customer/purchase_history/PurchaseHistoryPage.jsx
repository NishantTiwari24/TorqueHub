import { useEffect, useMemo, useState } from 'react'
import { getCustomerHistory } from '../../../api/historyApi'
import CustomerLayout from '../../../layout/CustomerLayout'
import { toastService } from '../../../services/toastService'

function PurchaseHistoryPage() {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    void loadHistory()
  }, [])

  async function loadHistory() {
    try {
      setLoading(true)
      setError('')
      const data = await getCustomerHistory()
      setHistory(data)
    } catch (loadError) {
      const message = loadError.message || 'Failed to load customer history.'
      setError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  const items = useMemo(() => history?.items ?? [], [history])

  const filteredItems = useMemo(() => {
    if (activeFilter === 'All') return items
    return items.filter((item) => item.historyType?.toLowerCase() === activeFilter.toLowerCase())
  }, [activeFilter, items])

  const totalSpend = Number(history?.totalAmount ?? 0)
  const purchaseCount = items.filter((item) => item.historyType?.toLowerCase() === 'purchase').length
  const serviceCount = items.filter((item) => item.historyType?.toLowerCase() === 'service').length
  const lastService = items
    .filter((item) => item.historyType?.toLowerCase() === 'service')
    .sort((first, second) => new Date(second.eventDateUtc) - new Date(first.eventDateUtc))[0]

  return (
    <CustomerLayout>
      <div className="w-full p-6 pb-24 lg:p-10">
        <section className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="material-symbols-outlined text-sm">history</span>
                Customer Portal
              </div>
              <h1 className="text-5xl font-black tracking-tight text-on-surface">Purchase History</h1>
              <p className="mt-2 max-w-2xl text-body-base text-on-surface-variant">
                View your combined purchase and service history from backend records.
              </p>
            </div>
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled={loading}
              onClick={() => void loadHistory()}
            >
              Refresh
            </button>
          </header>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon="payments" label="Total Amount" value={formatCurrency(totalSpend)} helper="Purchases and services" />
            <StatCard icon="shopping_bag" label="Purchases" value={purchaseCount} helper="Part order records" />
            <StatCard icon="build" label="Services" value={serviceCount} helper="Service history records" />
            <StatCard icon="event_available" label="Last Service" value={lastService ? formatShortDate(lastService.eventDateUtc) : 'N/A'} helper={lastService?.description || 'No service record'} />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{history?.customerName || 'My History'}</h2>
                <p className="mt-1 text-sm text-slate-500">Combined records from purchases and service history.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', 'Purchase', 'Service'].map((filter) => (
                  <button
                    key={filter}
                    className={`h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${
                      activeFilter === filter
                        ? 'bg-primary text-on-primary'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} onRetry={() => void loadHistory()} />
              ) : filteredItems.length === 0 ? (
                <EmptyState activeFilter={activeFilter} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Date</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Reference</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Details</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((item) => (
                        <HistoryRow key={`${item.historyType}-${item.historyId}-${item.referenceNumber || ''}`} item={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </CustomerLayout>
  )
}

function StatCard({ icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

function HistoryRow({ item }) {
  const type = item.historyType || 'History'
  const amount = item.amount
  const hasDiscount = Number(item.discount || 0) > 0

  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-4 align-top">
        <p className="text-sm font-semibold text-slate-900">{formatHistoryDate(item.eventDateUtc)}</p>
      </td>
      <td className="px-4 py-4 align-top">
        <span className="font-mono text-sm font-semibold text-secondary">{item.referenceNumber || `HIST-${item.historyId}`}</span>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-primary">
            <span className="material-symbols-outlined">{type.toLowerCase() === 'purchase' ? 'shopping_bag' : 'build'}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{item.description || 'History item'}</p>
            <p className="mt-1 text-sm text-slate-500">Record #{item.historyId}</p>
            {type.toLowerCase() === 'purchase' ? (
              <p className="mt-1 text-xs text-slate-500">
                Qty: {item.quantity ?? '-'} • Unit: {formatCurrency(item.unitPrice || 0)} • Final: {formatCurrency(item.finalTotal || 0)}
              </p>
            ) : null}
            {hasDiscount ? (
              <span className="mt-2 inline-flex rounded-full bg-teal-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                Loyalty Discount Applied
              </span>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex justify-center">
          <TypeBadge type={type} />
        </div>
      </td>
      <td className="px-4 py-4 align-top text-right">
        <span className={`text-lg font-bold ${Number(amount ?? 0) < 0 ? 'text-error' : 'text-slate-900'}`}>
          {amount === null || amount === undefined ? 'N/A' : formatCurrency(amount)}
        </span>
      </td>
    </tr>
  )
}

function TypeBadge({ type }) {
  const normalized = type.toLowerCase()
  const className =
    normalized === 'purchase'
      ? 'bg-primary-container text-on-primary-container'
      : normalized === 'service'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-slate-100 text-slate-700'

  return <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}>{type}</span>
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-700">Loading history...</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{message}</p>
      <button className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm" type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function EmptyState({ activeFilter }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-lg font-bold text-slate-900">No {activeFilter === 'All' ? '' : activeFilter.toLowerCase()} history found</p>
      <p className="mt-2 text-sm text-slate-500">Purchase and service records will appear here when they are available.</p>
    </div>
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'NPR',
  }).format(Number(value || 0))
}

function formatShortDate(value) {
  const date = new Date(value)
  if (isPlaceholderDate(date)) return 'N/A'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatHistoryDate(value) {
  const date = new Date(value)
  if (isPlaceholderDate(date)) return 'Date unavailable'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function isPlaceholderDate(date) {
  return Number.isNaN(date.getTime()) || date.getFullYear() <= 1
}

export default PurchaseHistoryPage
