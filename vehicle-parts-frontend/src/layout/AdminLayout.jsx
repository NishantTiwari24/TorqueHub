import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { logoutUser } from '../services/authService'
import { toastService } from '../services/toastService'
import { useAuthUserProfile } from '../hooks/useAuthUserProfile'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Preloader from '../components/common/Preloader'
import NotificationDropdown from '../components/common/NotificationDropdown'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/manage-staff', label: 'Staff', icon: 'badge' },
  { to: '/admin/manage-vendor', label: 'Vendors', icon: 'storefront' },
  { to: '/admin/manage-part', label: 'Parts', icon: 'settings_input_component' },
  { to: '/admin/purchase-invoice', label: 'Invoices', icon: 'receipt_long' },
  { to: '/admin/stock-transactions', label: 'Stock Audit', icon: 'inventory' },
]

function AdminLayout({ children, contentClassName = 'p-8', loading = false }) {
  const navigate = useNavigate()
  const { profile, roleLabel } = useAuthUserProfile()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = profile.name || 'Admin User'
  const avatarUrl = profile.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`

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

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true)
  }

  const handleLogoutCancel = () => {
    if (isLoggingOut) return
    setIsLogoutDialogOpen(false)
  }

  return (
    <>
      {loading && <Preloader />}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 border-r border-slate-800 bg-slate-900 dark:bg-black flex-col py-6 shadow-2xl z-50">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-black text-white tracking-wider uppercase">TorqueHub</h1>
          <p className="text-xs font-medium text-teal-500 uppercase tracking-widest mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
              }
            >
              <span className="material-symbols-outlined mr-3">{link.icon}</span>
              <span className="font-button text-button">{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 mb-6">
          <Link to="/admin/purchase-invoice/create" className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="font-button text-button uppercase tracking-tight">New Invoice</span>
          </Link>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <button onClick={handleLogoutClick} className="w-full flex items-center px-6 py-3 text-slate-400 font-medium hover:text-slate-100 hover:bg-slate-800 transition-all duration-200">
            <span className="material-symbols-outlined mr-3">logout</span>
            <span className="font-button text-button">Logout</span>
          </button>
        </div>
      </aside>

      <div className="md:ml-64 min-h-screen bg-background">
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center flex-1">
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown role="Admin" />
            <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-1" />
            <Link to="/admin/my-profile" className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-100 transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{displayName}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{roleLabel}</p>
              </div>
              <img
                alt="Admin profile"
                className="h-9 w-9 rounded-full border border-slate-300 object-cover"
                src={avatarUrl}
              />
            </Link>
          </div>
        </header>

        <main className={`admin-panel pt-24 ${contentClassName}`.trim()}>{children}</main>
      </div>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        confirmVariant="danger"
        onConfirm={confirmLogout}
        onCancel={handleLogoutCancel}
        isLoading={isLoggingOut}
      />
    </>
  )
}

export default AdminLayout
