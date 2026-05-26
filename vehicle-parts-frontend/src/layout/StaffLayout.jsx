import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { logoutUser } from '../services/authService'
import { toastService } from '../services/toastService'
import { useAuthUserProfile } from '../hooks/useAuthUserProfile'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Preloader from '../components/common/Preloader'
import NotificationDropdown from '../components/common/NotificationDropdown'

function StaffLayout({ children, mainClassName = 'md:ml-64 min-h-screen bg-background px-4 md:px-6 lg:px-10 pt-24 lg:pt-28 pb-24 lg:pb-10', loading = false }) {
  const navigate = useNavigate()
  const { profile, roleLabel } = useAuthUserProfile()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = profile.name || 'Staff User'
  const avatarUrl = profile.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`

  const handleLogout = (e) => {
    e.preventDefault()
    setIsLogoutDialogOpen(true)
  }

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logoutUser()
      toastService.success('Logged out successfully.')
      navigate('/login', { replace: true })
    } finally {
      setIsLoggingOut(false)
      setIsLogoutDialogOpen(false)
    }
  }

  const cancelLogout = () => {
    if (isLoggingOut) return
    setIsLogoutDialogOpen(false)
  }

  return (
    <>
      {loading && <Preloader />}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 border-r border-slate-800 bg-slate-900 dark:bg-black flex-col py-6 shadow-2xl z-50">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-black text-white tracking-wider uppercase">TorqueHub</h1>
          <p className="text-xs font-medium text-teal-500 uppercase tracking-widest mt-1">Staff Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
          <NavLink
            to="/staff"
            end
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span className="font-button text-button">Dashboard</span>
          </NavLink>
          <NavLink
            to="/staff/appointments"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">event_available</span>
            <span className="font-button text-button">Appointments</span>
          </NavLink>
          <NavLink
            to="/staff/customer-search"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">group</span>
            <span className="font-button text-button">Customers</span>
          </NavLink>
          <NavLink
            to="/staff/register-customer"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">person_add</span>
            <span className="font-button text-button">Register Customer</span>
          </NavLink>
          <NavLink
            to="/staff/create-sales-invoice"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">receipt_long</span>
            <span className="font-button text-button">Sales</span>
          </NavLink>
          <NavLink
            to="/staff/sales-invoices"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">list_alt</span>
            <span className="font-button text-button">Invoice List</span>
          </NavLink>
          <NavLink
            to="/staff/customer-reports"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">analytics</span>
            <span className="font-button text-button">Reports</span>
          </NavLink>
          <NavLink
            to="/staff/part-requests"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">inventory_2</span>
            <span className="font-button text-button">Part Requests</span>
          </NavLink>
        </nav>
        <div className="px-4 mb-6">
          <Link to="/staff/create-sales-invoice" className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="font-button text-button uppercase tracking-tight">New Invoice</span>
          </Link>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <a className="flex items-center px-6 py-3 text-slate-400 font-medium hover:text-slate-100 hover:bg-slate-800 transition-all duration-200" href="#" onClick={handleLogout}>
            <span className="material-symbols-outlined mr-3">logout</span>
            <span className="font-button text-button">Logout</span>
          </a>
        </div>
      </aside>

      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center w-1/3">
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <NotificationDropdown role="Staff" />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
          <Link to="/staff/my-profile" className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-100 transition-colors">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 leading-none">{displayName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{roleLabel}</p>
            </div>
            <img alt="Staff Profile Avatar" className="h-10 w-10 rounded-full border-2 border-teal-500/20 object-cover" src={avatarUrl} />
          </Link>
        </div>
      </header>

      <main className={mainClassName}>{children}</main>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        confirmVariant="danger"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
        isLoading={isLoggingOut}
      />
    </>
  )
}

export default StaffLayout
