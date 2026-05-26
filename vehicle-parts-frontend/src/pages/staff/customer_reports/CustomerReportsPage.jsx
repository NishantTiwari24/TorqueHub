import { useEffect, useMemo, useState } from 'react'
import StaffLayout from '../../../layout/StaffLayout'
import PageHeader from '../../../components/common/PageHeader'
import {
  getHighSpendersReport,
  getOverdueCreditsReport,
  getPendingCreditsReport,
  getRegularCustomersReport,
} from '../../../api/reportsApi'
import { toastService } from '../../../services/toastService'

const tabs = [
  { key: 'high', label: 'Top Spenders' },
  { key: 'regular', label: 'Regular Customers' },
  { key: 'pending', label: 'Pending Credits' },
  { key: 'overdue', label: 'Overdue Credits' },
]

function CustomerReportsPage() {
  const [activeTab, setActiveTab] = useState('high')
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState({
    high: [],
    regular: [],
    pending: [],
    overdue: [],
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [high, regular, pending, overdue] = await Promise.all([
          getHighSpendersReport(),
          getRegularCustomersReport(),
          getPendingCreditsReport(),
          getOverdueCreditsReport(),
        ])
        setReports({
          high: Array.isArray(high) ? high : [],
          regular: Array.isArray(regular) ? regular : [],
          pending: Array.isArray(pending) ? pending : [],
          overdue: Array.isArray(overdue) ? overdue : [],
        })
      } catch (error) {
        toastService.error(error.message || 'Failed to load customer reports.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const rows = useMemo(() => reports[activeTab] || [], [reports, activeTab])
  const amountLabel = activeTab === 'pending' || activeTab === 'overdue' ? 'Credit Amount' : 'Total Spend'

  return (
    <StaffLayout mainClassName="md:ml-64 min-h-screen bg-background px-4 md:px-6 lg:px-10 pt-24 lg:pt-28 pb-24 lg:pb-10">
      <div className="w-full">
        <PageHeader
          title="Customer Insights"
          subtitle="Real-time data on spend patterns, loyalty, and outstanding balances."
        />

        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Top Spenders" value={reports.high.length} />
          <SummaryCard label="Regular Customers" value={reports.regular.length} />
          <SummaryCard label="Pending Credits" value={reports.pending.length} />
          <SummaryCard label="Overdue Credits" value={reports.overdue.length} />
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-wrap border-b border-outline-variant bg-surface-container-low px-md">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`px-lg py-4 text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.key
                    ? 'font-bold border-b-2 border-primary text-primary'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-highest/50">
                  <th className="px-lg py-4 text-label-caps text-on-surface-variant">Customer</th>
                  <th className="px-lg py-4 text-label-caps text-on-surface-variant">Email</th>
                  <th className="px-lg py-4 text-label-caps text-on-surface-variant">Invoices</th>
                  <th className="px-lg py-4 text-label-caps text-on-surface-variant">{amountLabel}</th>
                  <th className="px-lg py-4 text-label-caps text-on-surface-variant">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr><td colSpan="5" className="px-lg py-8 text-on-surface-variant">Loading report...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="5" className="px-lg py-8 text-on-surface-variant">No data available.</td></tr>
                ) : (
                  rows.map((item, index) => (
                    <tr key={`${item.customerId || index}-${item.email || ''}`} className="hover:bg-primary-container/5">
                      <td className="px-lg py-md font-semibold text-on-surface">{item.customerName || item.name || 'Customer'}</td>
                      <td className="px-lg py-md text-on-surface-variant">{item.email || '-'}</td>
                      <td className="px-lg py-md text-on-surface">{item.invoiceCount ?? item.pendingInvoiceCount ?? '-'}</td>
                      <td className="px-lg py-md text-on-surface">
                        Rs. {Number(resolveAmount(item, activeTab)).toFixed(2)}
                      </td>
                      <td className="px-lg py-md text-on-surface-variant">{formatDate(resolveLastActivity(item, activeTab))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StaffLayout>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
      <p className="text-label-caps text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-black text-on-surface">{value}</p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function resolveAmount(item, activeTab) {
  if (activeTab === 'pending') return item.totalCreditAmount ?? 0
  if (activeTab === 'overdue') return item.overdueCreditAmount ?? item.totalCreditAmount ?? 0
  return item.totalSpend ?? 0
}

function resolveLastActivity(item, activeTab) {
  if (activeTab === 'pending' || activeTab === 'overdue') {
    return item.lastCreditSaleDateUtc || item.oldestCreditDueDateUtc
  }
  return item.lastPurchaseDateUtc
}

export default CustomerReportsPage
