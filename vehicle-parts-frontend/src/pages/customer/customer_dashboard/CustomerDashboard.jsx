import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyAppointments } from '../../../api/appointmentApi'
import { getPurchaseHistory } from '../../../api/historyApi'
import { getMyVehicles } from '../../../api/vehicleApi'
import CustomerLayout from '../../../layout/CustomerLayout'
import { toastService } from '../../../services/toastService'
import { formatCurrency } from '../../../utils/invoiceUtils'

const UPCOMING_STATUSES = new Set(['pending', 'confirmed', 'scheduled'])
const LOYALTY_POINTS_PER_RS = 0.01
const LOYALTY_TIER_SIZE = 500

function CustomerDashboard() {
  const [vehicles, setVehicles] = useState([])
  const [appointments, setAppointments] = useState([])
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      setLoadError('')
      const [vehicleData, appointmentData, historyData] = await Promise.allSettled([
        getMyVehicles(),
        getMyAppointments(),
        getPurchaseHistory(),
      ])

      if (vehicleData.status === 'fulfilled') {
        setVehicles(Array.isArray(vehicleData.value) ? vehicleData.value : [])
      }

      if (appointmentData.status === 'fulfilled') {
        setAppointments(Array.isArray(appointmentData.value) ? appointmentData.value : [])
      }

      if (historyData.status === 'fulfilled') {
        setHistory(historyData.value || null)
      }

      const failedRequests = [vehicleData, appointmentData, historyData].filter((result) => result.status === 'rejected')
      if (failedRequests.length > 0) {
        const message = 'Some dashboard widgets could not be loaded. Showing available data.'
        setLoadError(message)
        toastService.error(message)
      }
    } catch (error) {
      const message = error.message || 'Failed to load dashboard data.'
      setLoadError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  const upcomingCount = useMemo(() => {
    const now = Date.now()
    return appointments.filter((item) => {
      const date = new Date(item.date).getTime()
      const status = String(item.status || '').toLowerCase()
      return UPCOMING_STATUSES.has(status) && !Number.isNaN(date) && date >= now
    }).length
  }, [appointments])

  const purchaseInvoices = useMemo(() => {
    const items = Array.isArray(history?.items) ? history.items : []
    const purchases = items.filter((item) => String(item.historyType || '').toLowerCase() === 'purchase')
    const grouped = new Map()

    purchases.forEach((item) => {
      const key = item.referenceNumber || `invoice-${item.historyId}`
      const existing = grouped.get(key)
      const eventDateUtc = item.eventDateUtc || existing?.eventDateUtc
      const finalTotal = Number(item.finalTotal ?? existing?.finalTotal ?? item.amount ?? 0)
      const paymentStatus = item.paymentStatus || existing?.paymentStatus || 'Unknown'

      if (!existing) {
        grouped.set(key, {
          key,
          eventDateUtc,
          finalTotal: Number.isFinite(finalTotal) ? finalTotal : 0,
          paymentStatus,
          parts: [item.description].filter(Boolean),
        })
        return
      }

      grouped.set(key, {
        ...existing,
        eventDateUtc,
        finalTotal: existing.finalTotal > 0 ? existing.finalTotal : finalTotal,
        paymentStatus,
        parts: item.description ? [...existing.parts, item.description] : existing.parts,
      })
    })

    return [...grouped.values()].sort((a, b) => new Date(b.eventDateUtc).getTime() - new Date(a.eventDateUtc).getTime())
  }, [history])

  const totalSpend = useMemo(
    () => purchaseInvoices.reduce((sum, invoice) => sum + Number(invoice.finalTotal || 0), 0),
    [purchaseInvoices],
  )

  const loyaltyPoints = Math.floor(totalSpend * LOYALTY_POINTS_PER_RS)
  const pointsInCurrentTier = loyaltyPoints % LOYALTY_TIER_SIZE
  const pointsToNextTier = LOYALTY_TIER_SIZE - pointsInCurrentTier
  const tierProgress = Math.min(100, Math.round((pointsInCurrentTier / LOYALTY_TIER_SIZE) * 100))

  const pendingCredits = purchaseInvoices.filter(
    (invoice) => String(invoice.paymentStatus || '').toLowerCase() !== 'paid',
  ).length

  return (
    <CustomerLayout>
      <div className="p-6 lg:p-xl w-full space-y-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div>
            <h2 className="text-5xl font-black tracking-tight text-on-surface">Customer Dashboard</h2>
            <p className="text-body-base text-on-surface-variant mt-2">Welcome back. Track your vehicles, appointments, and purchase history in real time.</p>
          </div>
          <div className="flex gap-md">
            <Link
              className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-button shadow-sm hover:bg-primary-container transition-all active:scale-[0.98] flex items-center gap-2"
              to="/customer/request-part"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Request Part
            </Link>
            <Link
              className="px-6 py-2.5 bg-surface-container-lowest border border-outline-variant text-primary rounded-lg font-button hover:bg-surface-container-low transition-all active:scale-[0.98] flex items-center gap-2"
              to="/customer/purchase-history"
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
              View History
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {loadError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <KpiCard
            badge="Active"
            badgeClass="text-primary bg-primary/5"
            helper="Live vehicle count from your account."
            icon="directions_car"
            iconClass="bg-primary-container/10 text-primary"
            label="My Vehicles"
            value={loading ? '...' : vehicles.length}
          />
          <KpiCard
            badge="Soon"
            badgeClass="text-secondary bg-secondary/5"
            helper="Upcoming appointments."
            icon="event"
            iconClass="bg-secondary-container/10 text-secondary"
            label="Upcoming"
            value={loading ? '...' : upcomingCount}
          />
          <KpiCard
            badge="Total"
            badgeClass="text-tertiary bg-tertiary/5"
            helper="Unique sales invoices from purchase history."
            icon="shopping_cart"
            iconClass="bg-tertiary-container/10 text-tertiary"
            label="Recent Purchases"
            value={loading ? '...' : purchaseInvoices.length}
          />

          <div className="bg-white p-lg rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-on-surface-variant group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-h3 text-primary font-bold">{formatCurrency(totalSpend)}</span>
                <span className="text-label-caps text-outline">Total Spent</span>
              </div>
            </div>
            <p className="text-label-caps text-outline uppercase tracking-wider">Loyalty Points</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-h1 text-on-surface">{loading ? '...' : loyaltyPoints}</h3>
              <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-tertiary-container h-full rounded-full" style={{ width: `${tierProgress}%` }}></div>
            </div>
            <p className="text-[10px] text-outline mt-2 italic">
              {loading ? 'Loading loyalty progress...' : `${pointsToNextTier} pts until next reward tier`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-h2 text-on-surface">Latest Purchases</h3>
              <Link className="text-primary font-button hover:underline text-body-sm" to="/customer/purchase-history">
                View full history
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-body-sm text-on-surface-variant">Loading purchase invoices...</p>
              ) : purchaseInvoices.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">No purchase invoices yet.</p>
              ) : (
                purchaseInvoices.slice(0, 4).map((invoice) => (
                  <div key={invoice.key} className="rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{invoice.key}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(invoice.eventDateUtc)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(invoice.finalTotal)}</p>
                        <p className="text-xs text-slate-500">{invoice.paymentStatus}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-lg shadow-sm space-y-4">
            <h3 className="font-h2 text-on-surface">Quick Insights</h3>
            <InsightRow icon="credit_card" label="Pending Credit Invoices" value={loading ? '...' : pendingCredits} />
            <InsightRow icon="event_upcoming" label="Upcoming Appointments" value={loading ? '...' : upcomingCount} />
            <InsightRow icon="directions_car" label="Registered Vehicles" value={loading ? '...' : vehicles.length} />
            <Link
              className="w-full inline-flex items-center justify-center py-2 border border-primary-container text-primary rounded-lg font-button hover:bg-primary-container/5 transition-colors"
              to="/customer/my-appointments"
            >
              Manage Appointments
            </Link>
          </section>
        </div>
      </div>
    </CustomerLayout>
  )
}

function KpiCard({ label, value, helper, icon, iconClass, badge, badgeClass }) {
  return (
    <div className="bg-white p-lg rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${iconClass}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`text-label-caps px-2 py-1 rounded ${badgeClass}`}>{badge}</span>
      </div>
      <p className="text-label-caps text-outline uppercase tracking-wider">{label}</p>
      <h3 className="text-h1 text-on-surface mt-1">{value}</h3>
      <p className="text-body-sm text-on-surface-variant mt-2">{helper}</p>
    </div>
  )
}

function InsightRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
        <p className="text-sm text-slate-700">{label}</p>
      </div>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  )
}

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default CustomerDashboard
