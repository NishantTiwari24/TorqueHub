import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/common/PageHeader'
import StaffLayout from '../../../layout/StaffLayout'
import { searchCustomers } from '../../../api/customerApi'
import { getSalesInvoices } from '../../../api/invoiceApi'
import { getPendingCreditsReport, getHighSpendersReport } from '../../../api/reportsApi'
import { getAllAppointments } from '../../../api/appointmentApi'
import { formatCurrency } from '../../../utils/invoiceUtils'

function StaffDashboardPage() {
  const [customers, setCustomers] = useState([])
  const [invoices, setInvoices] = useState([])
  const [pendingCredits, setPendingCredits] = useState([])
  const [appointments, setAppointments] = useState([])
  const [highSpenders, setHighSpenders] = useState([])

  useEffect(() => {
    const load = async () => {
      const [customerData, invoiceData, pendingData, appointmentData, highSpenderData] = await Promise.allSettled([
        searchCustomers(),
        getSalesInvoices(),
        getPendingCreditsReport(),
        getAllAppointments(),
        getHighSpendersReport(),
      ])
      if (customerData.status === 'fulfilled') setCustomers(Array.isArray(customerData.value) ? customerData.value : [])
      if (invoiceData.status === 'fulfilled') setInvoices(Array.isArray(invoiceData.value) ? invoiceData.value : [])
      if (pendingData.status === 'fulfilled') setPendingCredits(Array.isArray(pendingData.value) ? pendingData.value : [])
      if (appointmentData.status === 'fulfilled') setAppointments(Array.isArray(appointmentData.value) ? appointmentData.value : [])
      if (highSpenderData.status === 'fulfilled') setHighSpenders(Array.isArray(highSpenderData.value) ? highSpenderData.value : [])
    }
    void load()
  }, [])

  const todaySales = useMemo(
    () => invoices.reduce((sum, invoice) => sum + Number(invoice.finalTotal || 0), 0),
    [invoices],
  )
  const recentCustomers = useMemo(() => customers.slice(0, 5), [customers])

  // Workshop Status: Active Bays and Technician Load
  const workshopStatus = useMemo(() => {
    const totalBays = 10
    const activeAppointments = appointments.filter((apt) => {
      const status = String(apt.status || '').toLowerCase()
      return status === 'confirmed' || status === 'in-progress' || status === 'scheduled'
    })
    const activeBays = Math.min(activeAppointments.length, totalBays)
    const technicianLoad = totalBays > 0 ? Math.round((activeBays / totalBays) * 100) : 0

    return {
      activeBays,
      totalBays,
      technicianLoad,
      activeAppointments: activeAppointments.length,
    }
  }, [appointments])

  // Dynamic Performance Analysis
  const performanceAnalysis = useMemo(() => {
    const tips = []

    // High-value service trend
    const avgSaleValue = invoices.length > 0 ? todaySales / invoices.length : 0
    if (avgSaleValue > 5000) {
      tips.push({
        type: 'revenue',
        title: 'High-Value Services Detected',
        message: `Average transaction value is Rs. ${avgSaleValue.toFixed(0)}/sale. Ensure premium service quality standards for customer satisfaction.`,
        icon: 'trending_up',
        color: 'teal',
      })
    }

    // Technician Load Analysis
    if (workshopStatus.technicianLoad > 85) {
      tips.push({
        type: 'capacity',
        title: 'High Workshop Load',
        message: `Technicians at ${workshopStatus.technicianLoad}% capacity. Consider optimizing scheduling or requesting additional support.`,
        icon: 'warning',
        color: 'amber',
      })
    }

    // Pending Credits Alert
    if (pendingCredits.length > 5) {
      tips.push({
        type: 'credit',
        title: 'Pending Credits Alert',
        message: `${pendingCredits.length} customers with pending credits totaling Rs. ${pendingCredits.reduce((sum, c) => sum + Number(c.pendingAmount || 0), 0).toFixed(0)}. Schedule follow-ups.`,
        icon: 'payment',
        color: 'indigo',
      })
    }

    // High Spenders Opportunity
    if (highSpenders.length > 0) {
      tips.push({
        type: 'opportunity',
        title: 'Top Customer Engagement',
        message: `${highSpenders.length} high-value customers identified. Prioritize service quality and exclusive offers to maintain loyalty.`,
        icon: 'star',
        color: 'yellow',
      })
    }

    // Active Appointments Insight
    if (workshopStatus.activeAppointments > 5) {
      tips.push({
        type: 'activity',
        title: 'High Service Activity',
        message: `${workshopStatus.activeAppointments} active appointments. Ensure all required parts are in stock and teams are coordinated.`,
        icon: 'calendar_today',
        color: 'cyan',
      })
    }

    // Low Activity Alert
    if (invoices.length === 0 && appointments.length === 0) {
      tips.push({
        type: 'activity',
        title: 'Slow Activity Period',
        message: 'No active services or sales today. Consider outreach or promotional activities to boost engagement.',
        icon: 'info',
        color: 'slate',
      })
    }

    return tips.length > 0 ? tips[0] : {
      type: 'general',
      title: 'Operations Running Smoothly',
      message: 'All systems optimal. Continue monitoring workshop performance and customer satisfaction metrics.',
      icon: 'check_circle',
      color: 'teal',
    }
  }, [invoices, pendingCredits, highSpenders, workshopStatus, todaySales])

  return (
    <StaffLayout>
{/* Hero / Welcome Section */}
<PageHeader
  title="Staff Dashboard"
  subtitle="Monitoring live performance and customer flow."
  actions={
    <>
      <Link to="/staff/register-customer" className="px-lg py-sm bg-white border border-secondary text-secondary font-button text-button rounded-lg hover:bg-secondary-fixed transition-all flex items-center gap-2">
<span className="material-symbols-outlined text-sm">person_add</span>
          Register Customer
      </Link>
      <Link to="/staff/create-sales-invoice" className="px-lg py-sm bg-primary text-on-primary font-button text-button rounded-lg hover:bg-primary-container transition-all flex items-center gap-2 active:scale-95 shadow-sm">
<span className="material-symbols-outlined text-sm">point_of_sale</span>
          New Sale
      </Link>
    </>
  }
/>
{/* KPI Bento Grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-xl">
{/* KPI 1 */}
<div className="bg-white p-lg rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group">
<div className="flex justify-between items-start mb-4">
<div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
<span className="material-symbols-outlined">groups</span>
</div>
<span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2 py-1 rounded-full uppercase tracking-tighter">+12% vs LW</span>
</div>
<p className="font-label-caps text-label-caps text-outline uppercase">Today's Customers</p>
<p className="font-h1 text-h1 text-slate-900 mt-1">{customers.length}</p>
<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
<span className="material-symbols-outlined text-8xl">groups</span>
</div>
</div>
{/* KPI 2 */}
<div className="bg-white p-lg rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group">
<div className="flex justify-between items-start mb-4">
<div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
<span className="material-symbols-outlined">payments</span>
</div>
<span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full uppercase tracking-tighter">On Track</span>
</div>
<p className="font-label-caps text-label-caps text-outline uppercase">Today's Sales</p>
<p className="font-h1 text-h1 text-slate-900 mt-1">{formatCurrency(todaySales)}</p>
<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
<span className="material-symbols-outlined text-8xl">payments</span>
</div>
</div>
{/* KPI 3 */}
<div className="bg-white p-lg rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group">
<div className="flex justify-between items-start mb-4">
<div className="p-2 bg-tertiary-fixed text-tertiary rounded-lg">
<span className="material-symbols-outlined">priority_high</span>
</div>
<span className="text-[10px] font-bold text-error bg-error-container px-2 py-1 rounded-full uppercase tracking-tighter">Action Required</span>
</div>
<p className="font-label-caps text-label-caps text-outline uppercase">Pending Invoices</p>
<p className="font-h1 text-h1 text-slate-900 mt-1">{pendingCredits.length}</p>
<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
<span className="material-symbols-outlined text-8xl">assignment_late</span>
</div>
</div>
</div>
{/* Main Content Area: Top Customers & Recent Activity */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
{/* Top Customers Table (Left/Center Column) */}
<div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
<div className="px-lg py-md border-b border-slate-200 flex items-center justify-between">
<h3 className="font-h3 text-h3 text-slate-900">Recent Customers <span className="text-body-sm font-normal text-outline ml-2">Live</span></h3>
<Link to="/staff/customer-reports" className="text-teal-600 font-button text-button hover:underline flex items-center gap-1">
            View All Reports
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
</Link>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="bg-surface-container-low">
<th className="px-lg py-3 font-label-caps text-label-caps text-outline uppercase">Name</th>
<th className="px-lg py-3 font-label-caps text-label-caps text-outline uppercase">Email</th>
<th className="px-lg py-3 font-label-caps text-label-caps text-outline uppercase">Phone</th>
<th className="px-lg py-3 font-label-caps text-label-caps text-outline uppercase text-right">Type</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-100">
{recentCustomers.length === 0 ? (
  <tr>
    <td colSpan="4" className="px-lg py-6 text-body-sm text-outline">No customers found.</td>
  </tr>
) : recentCustomers.map((customer) => (
  <tr key={customer.id} className="hover:bg-teal-50/30 transition-colors group">
    <td className="px-lg py-4">
      <p className="font-body-base text-body-base font-semibold text-slate-900">{customer.name || 'Customer'}</p>
    </td>
    <td className="px-lg py-4 font-body-sm text-body-sm text-outline">{customer.email || '-'}</td>
    <td className="px-lg py-4 font-body-sm text-body-sm text-outline">{customer.phoneNumber || '-'}</td>
    <td className="px-lg py-4 text-right">
      <span className="inline-block px-2 py-1 rounded-full bg-slate-100 text-outline text-[10px] font-bold uppercase">Customer</span>
    </td>
  </tr>
))}
</tbody>
</table>
</div>
</div>
{/* Service Status / Sidebar (Right Column) */}
<div className="flex flex-col gap-gutter">
<div className="bg-white p-lg rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
<h3 className="font-label-caps text-label-caps text-outline uppercase mb-md">Workshop Status</h3>
<div className="space-y-4">
<div>
<div className="flex justify-between text-xs mb-1">
<span className="font-bold text-slate-700 uppercase tracking-tighter">Active Bays</span>
<span className="text-teal-600 font-bold">{workshopStatus.activeBays} / {workshopStatus.totalBays}</span>
</div>
<div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
<div className={`h-full rounded-full transition-all ${workshopStatus.activeBays > 8 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${(workshopStatus.activeBays / workshopStatus.totalBays) * 100}%` }}></div>
</div>
</div>
<div>
<div className="flex justify-between text-xs mb-1">
<span className="font-bold text-slate-700 uppercase tracking-tighter">Technician Load</span>
<span className={`font-bold ${workshopStatus.technicianLoad > 85 ? 'text-amber-600' : 'text-indigo-600'}`}>{workshopStatus.technicianLoad}%</span>
</div>
<div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
<div className={`h-full rounded-full transition-all ${workshopStatus.technicianLoad > 85 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${workshopStatus.technicianLoad}%` }}></div>
</div>
</div>
</div>
</div>
<div className={`p-lg rounded-xl relative overflow-hidden ${performanceAnalysis.type === 'activity' && performanceAnalysis.message.includes('Slow') ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
<div className="relative z-10">
<div className="flex items-center gap-2 mb-2">
<span className={`material-symbols-outlined text-lg ${performanceAnalysis.color === 'teal' ? 'text-teal-400' : performanceAnalysis.color === 'amber' ? 'text-amber-400' : performanceAnalysis.color === 'indigo' ? 'text-indigo-400' : performanceAnalysis.color === 'yellow' ? 'text-yellow-400' : performanceAnalysis.color === 'cyan' ? 'text-cyan-400' : 'text-green-400'}`}>
{performanceAnalysis.icon}
</span>
<h3 className={`font-label-caps text-label-caps uppercase ${performanceAnalysis.color === 'teal' ? 'text-teal-400' : performanceAnalysis.color === 'amber' ? 'text-amber-400' : performanceAnalysis.color === 'indigo' ? 'text-indigo-400' : performanceAnalysis.color === 'yellow' ? 'text-yellow-400' : performanceAnalysis.color === 'cyan' ? 'text-cyan-400' : 'text-green-400'}`}>
{performanceAnalysis.type === 'general' ? 'INSIGHTS' : 'PERFORMANCE ANALYSIS'}
</h3>
</div>
<h4 className="text-white font-semibold text-body-base mb-2">{performanceAnalysis.title}</h4>
<p className="text-white/90 font-body-sm text-body-sm mb-4 leading-relaxed">
{performanceAnalysis.message}
</p>
<button className={`text-[11px] font-bold flex items-center gap-1 group ${performanceAnalysis.color === 'teal' ? 'text-teal-400 hover:text-teal-300' : performanceAnalysis.color === 'amber' ? 'text-amber-400 hover:text-amber-300' : performanceAnalysis.color === 'indigo' ? 'text-indigo-400 hover:text-indigo-300' : performanceAnalysis.color === 'yellow' ? 'text-yellow-400 hover:text-yellow-300' : performanceAnalysis.color === 'cyan' ? 'text-cyan-400 hover:text-cyan-300' : 'text-green-400 hover:text-green-300'}`}>
VIEW RECOMMENDATIONS
<span className="material-symbols-outlined text-[12px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
{/* Decorative Background */}
<div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA_ICK6iIyTp1UEmjNSOE2T5CsWRvOClMnCiGa-e4H8z9dOTLFnk3LLy-zXvoPFl09j2zeP9S8JT0SztuA_RLPfD_8YBDdqp3IHuTv0FrtuOjRB5zOA5J5FX_u8Dbqj1yJQH891FCNWzojRr-ikvJQSXRNvIOuEzajapNmjbBn5P8wF_bnpRAA6vmn2P0YIE8eX1UqGrs_Up1Ihd8V8DbH8G20R74HJdedYu2GpPlQmDUayuek2AFOkbIkGRilF7diEi_plDGNLGh1Q')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
</div>
<div className="bg-white p-lg rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
<h3 className="font-label-caps text-label-caps text-outline uppercase mb-md">Quick Analytics</h3>
<div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg border border-slate-100">
<div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm">
<span className="material-symbols-outlined">trending_up</span>
</div>
<div>
<p className="text-xs text-outline uppercase font-bold tracking-tighter">Weekly Growth</p>
<p className="font-h3 text-h3 text-slate-900 leading-none mt-1">+18.4%</p>
</div>
</div>
</div>
</div>
</div>
    </StaffLayout>
  )
}

export default StaffDashboardPage

