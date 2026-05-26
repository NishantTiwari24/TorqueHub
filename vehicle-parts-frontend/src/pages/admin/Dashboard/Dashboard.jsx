import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getStaffList } from '../../../api/staffApi'
import { getVendorList } from '../../../api/vendorApi'
import { getPartList } from '../../../api/partApi'
import { getSalesInvoices } from '../../../api/invoiceApi'
import { getStockTransactions } from '../../../api/stockTransactionApi'
import {
  getDailyFinancialReport,
  getMonthlyFinancialReport,
  getOverdueCreditsReport,
  getYearlyFinancialReport,
} from '../../../api/reportsApi'
import { checkLowStockNotifications, getLowStockNotifications } from '../../../api/notificationApi'
import { runOverdueCreditReminders } from '../../../api/reminderApi'
import AdminLayout from '../../../layout/AdminLayout'
import { toastService } from '../../../services/toastService'
import { formatCurrency } from '../../../utils/invoiceUtils'

const formatShortDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const getDateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const getCurrencyTick = (value) => {
  const amount = Number(value || 0)
  if (amount >= 100000) return `${Math.round(amount / 1000)}k`
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`
  return String(amount)
}

const REMINDER_SENT_DATE_KEY = 'adminCreditReminderSentDate'

const Dashboard = () => {
  const [staff, setStaff] = useState([])
  const [vendors, setVendors] = useState([])
  const [parts, setParts] = useState([])
  const [salesInvoices, setSalesInvoices] = useState([])
  const [stockTransactions, setStockTransactions] = useState([])
  const [lowStockNotifications, setLowStockNotifications] = useState([])
  const [overdueCredits, setOverdueCredits] = useState([])
  const [dailyFinancial, setDailyFinancial] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [reportMode, setReportMode] = useState('daily')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isRunningReminders, setIsRunningReminders] = useState(false)
  const [lastReminderSentDate, setLastReminderSentDate] = useState(() => localStorage.getItem(REMINDER_SENT_DATE_KEY) || '')
  const dateInputRef = useRef(null)
  const todayKey = getDateKey(new Date())
  const hasSentRemindersToday = lastReminderSentDate === todayKey

  const loadFinancialReport = async (dateValue) => {
    try {
      setIsReportLoading(true)
      let report = null
      if (reportMode === 'daily') {
        report = await getDailyFinancialReport(dateValue)
      } else if (reportMode === 'monthly') {
        report = await getMonthlyFinancialReport(selectedYear, selectedMonth)
      } else {
        report = await getYearlyFinancialReport(selectedYear)
      }
      setDailyFinancial(report ?? null)
    } catch {
      setDailyFinancial(null)
    } finally {
      setIsReportLoading(false)
    }
  }

  useEffect(() => {
    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        getStaffList(),
        getVendorList(),
        getPartList(),
        getSalesInvoices(),
        getStockTransactions(),
        getLowStockNotifications(),
        getOverdueCreditsReport(),
      ])

      if (results[0].status === 'fulfilled') setStaff(Array.isArray(results[0].value) ? results[0].value : [])
      if (results[1].status === 'fulfilled') setVendors(Array.isArray(results[1].value) ? results[1].value : [])
      if (results[2].status === 'fulfilled') setParts(Array.isArray(results[2].value) ? results[2].value : [])
      if (results[3].status === 'fulfilled') setSalesInvoices(Array.isArray(results[3].value) ? results[3].value : [])
      if (results[4].status === 'fulfilled') {
        setStockTransactions(Array.isArray(results[4].value) ? results[4].value : [])
      }
      if (results[5].status === 'fulfilled') {
        setLowStockNotifications(Array.isArray(results[5].value) ? results[5].value : [])
      }
      if (results[6].status === 'fulfilled') {
        setOverdueCredits(Array.isArray(results[6].value) ? results[6].value : [])
      }
    }

    void loadDashboard()
  }, [])

  useEffect(() => {
    void loadFinancialReport(selectedDate)
  }, [selectedDate, reportMode, selectedMonth, selectedYear])

  const lowStockCount = useMemo(() => {
    if (lowStockNotifications.length > 0) return lowStockNotifications.length
    return parts.filter((part) => Number(part.stockQuantity || 0) < 10).length
  }, [lowStockNotifications, parts])
  const hasLowStock = lowStockCount > 0
  const todaySales = useMemo(
    () => salesInvoices.reduce((sum, invoice) => sum + Number(invoice.finalTotal || 0), 0),
    [salesInvoices],
  )
  const pendingCredits = useMemo(
    () => salesInvoices.reduce((sum, invoice) => sum + Math.max(Number(invoice.creditAmount || 0), 0), 0),
    [salesInvoices],
  )
  const stockByCategory = useMemo(() => {
    const grouped = new Map()
    parts.forEach((part) => {
      const category = part.category || 'Other'
      const current = grouped.get(category) || 0
      grouped.set(category, current + Number(part.stockQuantity || 0))
    })

    return [...grouped.entries()]
      .map(([category, quantity]) => ({ category, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [parts])

  const salesTrendData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const key = getDateKey(date)
      const sales = salesInvoices
        .filter((invoice) => getDateKey(invoice.saleDate || invoice.createdAtUtc) === key)
        .reduce((sum, invoice) => sum + Number(invoice.finalTotal || 0), 0)
      const paid = salesInvoices
        .filter((invoice) => getDateKey(invoice.saleDate || invoice.createdAtUtc) === key)
        .reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0)

      return {
        date: key,
        label: formatShortDate(date),
        sales,
        paid,
      }
    })
  }, [salesInvoices])

  const salesTrendSummary = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const previousStart = new Date(today)
    previousStart.setDate(today.getDate() - 13)
    const previousEnd = new Date(today)
    previousEnd.setDate(today.getDate() - 7)

    const currentTotal = salesTrendData.reduce((sum, item) => sum + item.sales, 0)
    const previousTotal = salesInvoices
      .filter((invoice) => {
        const date = new Date(invoice.saleDate || invoice.createdAtUtc)
        if (Number.isNaN(date.getTime())) return false
        date.setHours(0, 0, 0, 0)
        return date >= previousStart && date <= previousEnd
      })
      .reduce((sum, invoice) => sum + Number(invoice.finalTotal || 0), 0)

    if (previousTotal <= 0) {
      return {
        label: currentTotal > 0 ? 'New sales this week' : 'No sales this week',
        isPositive: currentTotal > 0,
      }
    }

    const change = ((currentTotal - previousTotal) / previousTotal) * 100
    return {
      label: `${Math.abs(change).toFixed(1)}% ${change >= 0 ? 'up' : 'down'} vs last week`,
      isPositive: change >= 0,
    }
  }, [salesInvoices, salesTrendData])

  const stockStatusData = useMemo(() => stockByCategory.map((item) => ({
    category: item.category.length > 10 ? `${item.category.slice(0, 10)}...` : item.category,
    fullCategory: item.category,
    quantity: item.quantity,
  })), [stockByCategory])

  const topCategoryQuantity = stockByCategory[0]?.quantity || 0
  const topCategoryName = stockByCategory[0]?.category || 'N/A'
  const totalStockQuantity = useMemo(
    () => parts.reduce((sum, part) => sum + Number(part.stockQuantity || 0), 0),
    [parts],
  )
  const issuedTodayCount = useMemo(() => {
    const todayKey = getDateKey(new Date())
    return stockTransactions
      .filter((item) => getDateKey(item.createdAtUtc) === todayKey && Number(item.quantityChange || 0) < 0)
      .reduce((sum, item) => sum + Math.abs(Number(item.quantityChange || 0)), 0)
  }, [stockTransactions])
  const receivedTodayCount = useMemo(() => {
    const todayKey = getDateKey(new Date())
    return stockTransactions
      .filter((item) => getDateKey(item.createdAtUtc) === todayKey && Number(item.quantityChange || 0) > 0)
      .reduce((sum, item) => sum + Number(item.quantityChange || 0), 0)
  }, [stockTransactions])
  const overdueCreditAmount = useMemo(
    () => overdueCredits.reduce((sum, customer) => sum + Number(customer.overdueCreditAmount || 0), 0),
    [overdueCredits],
  )
  const creditInvoiceCount = Number(dailyFinancial?.creditSalesInvoiceCount ?? salesInvoices.filter((invoice) => Number(invoice.creditAmount || 0) > 0).length)
  const profitValue = Number(dailyFinancial?.totalProfit ?? 0)
  const paidSalesValue = Number(dailyFinancial?.paidSales ?? 0)
  const creditSalesValue = Number(dailyFinancial?.creditSales ?? pendingCredits)
  const salesMetricLabel = reportMode === 'daily' ? "TODAY'S SALES" : reportMode === 'monthly' ? 'MONTHLY SALES' : 'YEARLY SALES'
  const reportPeriodLabel = reportMode === 'daily'
    ? selectedDate
    : reportMode === 'monthly'
      ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
      : String(selectedYear)

  const recentMoves = useMemo(
    () => [...stockTransactions].sort((a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc)).slice(0, 3),
    [stockTransactions],
  )

  const toRelativeTime = (value) => {
    const ms = Date.now() - new Date(value).getTime()
    if (Number.isNaN(ms) || ms < 0) return 'Just now'

    const mins = Math.floor(ms / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`

    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  const moveStyle = (item) => {
    const decrease = Number(item.quantityChange || 0) < 0
    if (decrease) {
      return {
        iconWrap: 'h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mr-4',
        icon: 'remove_circle',
        badge: 'text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full',
        badgeText: 'Issued',
        title: 'Stock Issued',
      }
    }

    return {
      iconWrap: 'h-10 w-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mr-4',
      icon: 'add_circle',
      badge: 'text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full',
      badgeText: 'Added',
      title: 'Stock Received',
    }
  }

  const handleDateButtonClick = () => {
    const input = dateInputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }
    input.click()
  }

  const handleDateChange = (event) => {
    const value = event.target.value
    if (!value) return
    setSelectedDate(value)
  }

  const handleRunReminders = async () => {
    try {
      setIsRunningReminders(true)
      const result = await runOverdueCreditReminders()
      const sent = Number(result?.remindersSent ?? 0)
      const unsent = Number(result?.remindersLoggedAsUnsent ?? 0)
      const skippedRecent = Number(result?.remindersSkippedRecentlySent ?? 0)
      const skippedMissingEmail = Number(result?.remindersSkippedMissingEmail ?? 0)

      if (sent > 0) {
        localStorage.setItem(REMINDER_SENT_DATE_KEY, todayKey)
        setLastReminderSentDate(todayKey)
        toastService.success(`${sent} reminder email${sent === 1 ? '' : 's'} sent.`)
      } else if (unsent > 0) {
        toastService.error(`${unsent} reminder email${unsent === 1 ? '' : 's'} could not be sent. Check SMTP settings.`)
      } else if (skippedRecent > 0) {
        toastService.info(`${skippedRecent} reminder${skippedRecent === 1 ? '' : 's'} skipped because they were sent recently.`)
      } else if (skippedMissingEmail > 0) {
        toastService.error(`${skippedMissingEmail} reminder${skippedMissingEmail === 1 ? '' : 's'} skipped because customer email is missing.`)
      } else {
        toastService.info('No overdue credit reminders to send.')
      }
    } finally {
      setIsRunningReminders(false)
    }
  }

  const handleRefreshLowStock = async () => {
    await checkLowStockNotifications()
    const refreshed = await getLowStockNotifications()
    setLowStockNotifications(Array.isArray(refreshed) ? refreshed : [])
  }

  const handleExportReport = () => {
    if (!dailyFinancial) return

    setIsExporting(true)
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Report Period', reportPeriodLabel],
        ['Sales Income', Number(dailyFinancial.salesIncome ?? 0).toFixed(2)],
        ['Purchase Cost', Number(dailyFinancial.purchaseCost ?? 0).toFixed(2)],
        ['Total Revenue', Number(dailyFinancial.totalRevenue ?? 0).toFixed(2)],
        ['Total Expenses', Number(dailyFinancial.totalExpenses ?? 0).toFixed(2)],
        ['Total Profit', Number(dailyFinancial.totalProfit ?? 0).toFixed(2)],
        ['Paid Sales', Number(dailyFinancial.paidSales ?? 0).toFixed(2)],
        ['Credit Sales', Number(dailyFinancial.creditSales ?? 0).toFixed(2)],
        ['Discount Total', Number(dailyFinancial.discountTotal ?? 0).toFixed(2)],
        ['Sales Invoice Count', Number(dailyFinancial.salesInvoiceCount ?? 0)],
        ['Purchase Invoice Count', Number(dailyFinancial.purchaseInvoiceCount ?? 0)],
        ['Total Invoice Count', Number(dailyFinancial.totalInvoiceCount ?? 0)],
        ['Paid Sales Invoice Count', Number(dailyFinancial.paidSalesInvoiceCount ?? 0)],
        ['Credit Sales Invoice Count', Number(dailyFinancial.creditSalesInvoiceCount ?? 0)],
        ['Average Sales Invoice Value', Number(dailyFinancial.averageSalesInvoiceValue ?? 0).toFixed(2)],
      ]

      const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `admin-financial-report-${reportPeriodLabel}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AdminLayout>
      <header className="mb-8 flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="max-w-3xl 2xl:flex-none">
          <h2 className="text-5xl font-black tracking-tight text-on-surface 2xl:whitespace-nowrap">Admin Dashboard</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Monitor operations, inventory performance, and financial activity from one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:flex-nowrap 2xl:flex-none 2xl:justify-end">
          <select value={reportMode} onChange={(e) => setReportMode(e.target.value)} className="h-12 w-36 flex-none px-3 bg-white border border-outline-variant text-on-surface rounded-lg text-sm">
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {reportMode !== 'daily' ? (
            <>
              <input value={selectedYear} type="number" className="h-12 w-28 flex-none px-3 bg-white border border-outline-variant rounded-lg text-sm" onChange={(e) => setSelectedYear(Number(e.target.value) || new Date().getFullYear())} />
              {reportMode === 'monthly' ? (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="h-12 w-20 flex-none px-3 bg-white border border-outline-variant rounded-lg text-sm">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : null}
            </>
          ) : null}
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="sr-only"
            aria-hidden="true"
          />
          {reportMode === 'daily' ? (
            <button onClick={handleDateButtonClick} className="h-12 w-44 flex-none px-4 bg-white border border-outline-variant text-on-surface rounded-lg text-button flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span>{selectedDate}</span>
            </button>
          ) : null}
          <button onClick={handleExportReport} disabled={isExporting || !dailyFinancial} className="h-12 w-44 flex-none px-4 bg-primary text-on-primary rounded-lg text-button flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="whitespace-nowrap">{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-gutter mb-xl">

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between mb-md">
            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-lg">groups</span>
            <span className="text-teal-600 text-[10px] font-bold">Live</span>
          </div>
          <p className="text-outline text-label-caps mb-1">TOTAL STAFF</p>
          <h3 className="font-h3 text-on-surface">{staff.length}</h3>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between mb-md">
            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-lg">inventory_2</span>
          </div>
          <p className="text-outline text-label-caps mb-1">TOTAL VENDORS</p>
          <h3 className="font-h3 text-on-surface">{vendors.length}</h3>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between mb-md">
            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-lg">settings_input_component</span>
          </div>
          <p className="text-outline text-label-caps mb-1">TOTAL PARTS</p>
          <h3 className="font-h3 text-on-surface">{parts.length}</h3>
        </div>

        <div className={`${hasLowStock ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-outline-variant'} p-lg rounded-xl border shadow-sm hover:translate-y-[-2px] transition-transform`}>
          <div className="flex items-center justify-between mb-md">
            <span className={`${hasLowStock ? 'text-amber-600 bg-amber-100' : 'text-teal-600 bg-teal-50'} material-symbols-outlined p-2 rounded-lg`} data-weight="fill">warning</span>
            <span className={`${hasLowStock ? 'text-amber-700' : 'text-teal-600'} text-[10px] font-bold`}>{hasLowStock ? 'Urgent' : 'Healthy'}</span>
          </div>
          <p className={`${hasLowStock ? 'text-amber-800' : 'text-outline'} text-label-caps mb-1`}>LOW STOCK</p>
          <h3 className={`${hasLowStock ? 'text-amber-900' : 'text-on-surface'} font-h3`}>{lowStockCount}</h3>
          <button onClick={() => void handleRefreshLowStock()} className="mt-2 text-[11px] font-semibold underline">Refresh Feed</button>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between mb-md">
            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-lg">payments</span>
          </div>
          <p className="text-outline text-label-caps mb-1">{salesMetricLabel}</p>
          <h3 className="font-h3 text-on-surface">{isReportLoading ? 'Loading...' : formatCurrency(dailyFinancial?.salesIncome ?? todaySales)}</h3>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between mb-md">
            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-lg">account_balance_wallet</span>
          </div>
          <p className="text-outline text-label-caps mb-1">PENDING CREDITS</p>
          <h3 className="font-h3 text-on-surface">{isReportLoading ? 'Loading...' : formatCurrency(dailyFinancial?.creditSales ?? pendingCredits)}</h3>
          <p className="text-[11px] text-on-surface-variant mt-2">Overdue Accounts: {overdueCredits.length}</p>
          <button
            onClick={() => void handleRunReminders()}
            disabled={isRunningReminders || hasSentRemindersToday}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-outline-variant px-3 text-[11px] font-semibold text-on-surface hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            title={hasSentRemindersToday ? 'Reminder emails were already sent today.' : 'Send overdue credit reminder emails'}
          >
            {isRunningReminders ? 'Sending...' : hasSentRemindersToday ? 'Sent Today' : 'Send Reminders'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-gutter">

        <section className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-center mb-lg">
            <div>
              <h4 className="font-h3 text-on-surface">Sales Trend</h4>
              <p className="text-body-sm text-outline">Revenue performance from real sales invoices</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`${salesTrendSummary.isPositive ? 'text-teal-600 bg-teal-50' : 'text-amber-700 bg-amber-50'} flex items-center text-xs font-semibold px-2 py-1 rounded`}>
                <span className="material-symbols-outlined text-sm mr-1">{salesTrendSummary.isPositive ? 'trending_up' : 'trending_down'}</span>
                {salesTrendSummary.label}
              </span>
            </div>
          </div>

          <div className="h-64 relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesTrendFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5a4" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#0ea5a4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={getCurrencyTick} width={38} />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(Number(value || 0)), name === 'sales' ? 'Sales' : 'Paid']}
                  labelClassName="text-on-surface"
                  contentStyle={{ borderRadius: 8, borderColor: '#cbd5e1' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#006a69" strokeWidth={3} fill="url(#salesTrendFill)" dot={{ r: 3, fill: '#006a69' }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="paid" stroke="#14b8a6" strokeWidth={2} fill="transparent" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col">
          <div className="mb-lg">
            <h4 className="font-h3 text-on-surface">Stock Status</h4>
            <p className="text-body-sm text-outline">Live quantity by category</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockStatusData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${Number(value || 0)} units`, 'Stock']}
                  labelFormatter={(_, items) => items?.[0]?.payload?.fullCategory || ''}
                  contentStyle={{ borderRadius: 8, borderColor: '#cbd5e1' }}
                />
                <Bar dataKey="quantity" fill="#009689" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-lg border-t border-gray-100 mt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-on-surface-variant">Highest Stock</span>
              <span className="font-bold text-teal-600">{topCategoryName} ({topCategoryQuantity} units)</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-600 h-full" style={{ width: totalStockQuantity > 0 ? `${Math.round((topCategoryQuantity / totalStockQuantity) * 100)}%` : '0%' }}></div>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-lg">
            <h4 className="font-h3 text-on-surface">Recent Inventory Moves</h4>
            <a className="text-teal-600 text-button hover:underline">View All</a>
          </div>
          <div className="space-y-4">
            {recentMoves.map((item) => {
              const style = moveStyle(item)

              return (
                <div key={item.stockTransactionId} className="group flex items-center p-3 rounded-lg hover:bg-surface transition-colors">
                  <div className={style.iconWrap}>
                    <span className="material-symbols-outlined">{style.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{style.title}</p>
                    <p className="text-[11px] text-outline">
                      Ref: {item.referenceNumber || 'N/A'} • {Math.abs(Number(item.quantityChange || 0))} {item.partName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-on-surface">{toRelativeTime(item.createdAtUtc)}</p>
                    <span className={style.badge}>{style.badgeText}</span>
                  </div>
                </div>
              )
            })}
            {recentMoves.length === 0 && (
              <div className="group flex items-center p-3 rounded-lg hover:bg-surface transition-colors">
                <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mr-4">
                  <span className="material-symbols-outlined">inventory</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">No Recent Moves</p>
                  <p className="text-[11px] text-outline">Stock movements will appear here once transactions are created.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-h3 text-on-surface mb-1">Financial Snapshot</h4>
                <p className="text-body-sm text-outline">Paid, credit, and profit for the selected report period.</p>
              </div>
              <span className={`${profitValue >= 0 ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'} rounded-full px-3 py-1 text-[11px] font-bold`}>
                {profitValue >= 0 ? 'Profitable' : 'Loss'}
              </span>
            </div>
            <div className="mt-lg grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-teal-50 p-3">
                <p className="text-[10px] font-bold uppercase text-teal-700">Paid Sales</p>
                <p className="mt-1 text-sm font-bold text-on-surface">{formatCurrency(paidSalesValue)}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-[10px] font-bold uppercase text-amber-700">Credit Sales</p>
                <p className="mt-1 text-sm font-bold text-on-surface">{formatCurrency(creditSalesValue)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-600">Profit</p>
                <p className="mt-1 text-sm font-bold text-on-surface">{formatCurrency(profitValue)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-outline-variant px-3 py-2">
              <span className="text-xs text-on-surface-variant">Overdue receivables</span>
              <span className="text-xs font-bold text-on-surface">{formatCurrency(overdueCreditAmount)}</span>
            </div>
          </div>

          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-teal-600 mb-2">sync_alt</span>
            <h5 className="text-sm font-bold text-on-surface">Stock Flow Today</h5>
            <p className="text-[11px] text-outline mb-4">Issued {issuedTodayCount} units, received {receivedTodayCount} units</p>
            <Link to="/admin/stock-transactions" className="block text-center w-full py-2 bg-slate-50 text-on-surface rounded border border-gray-100 text-[11px] font-bold hover:bg-gray-100">VIEW MOVES</Link>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-amber-600 mb-2">priority_high</span>
            <h5 className="text-sm font-bold text-on-surface">Low Stock Watch</h5>
            <p className="text-[11px] text-outline mb-4">{lowStockCount} parts need restock attention</p>
            <Link to="/admin/manage-part" className="block text-center w-full py-2 bg-slate-50 text-on-surface rounded border border-gray-100 text-[11px] font-bold hover:bg-gray-100">MANAGE PARTS</Link>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-teal-600 mb-2">add_shopping_cart</span>
            <h5 className="text-sm font-bold text-on-surface">New Order</h5>
            <p className="text-[11px] text-outline mb-4">Procure new parts</p>
            <Link to="/admin/purchase-invoice/create" className="block text-center w-full py-2 bg-slate-50 text-on-surface rounded border border-gray-100 text-[11px] font-bold hover:bg-gray-100">OPEN CART</Link>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-teal-600 mb-2">receipt_long</span>
            <h5 className="text-sm font-bold text-on-surface">Credit Invoices</h5>
            <p className="text-[11px] text-outline mb-4">{creditInvoiceCount} invoices need payment follow-up</p>
            <Link to="/admin/purchase-invoice?tab=sales" className="block text-center w-full py-2 bg-slate-50 text-on-surface rounded border border-gray-100 text-[11px] font-bold hover:bg-gray-100">VIEW INVOICES</Link>
          </div>
        </section>
      </div>

    </AdminLayout>
  )
}

export default Dashboard
