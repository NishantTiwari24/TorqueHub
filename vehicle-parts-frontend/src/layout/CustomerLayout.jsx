import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { logoutUser } from '../services/authService'
import { toastService } from '../services/toastService'
import { useAuthUserProfile } from '../hooks/useAuthUserProfile'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Preloader from '../components/common/Preloader'
import NotificationDropdown from '../components/common/NotificationDropdown'

function CustomerLayout({ children, mainClassName = '', loading = false }) {
  const navigate = useNavigate()
  const { profile, roleLabel } = useAuthUserProfile()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = profile.name || 'Customer User'
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
          <p className="text-xs font-medium text-teal-500 uppercase tracking-widest mt-1">Customer Portal</p>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink
            to="/customer"
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
            to="/customer/my-vehicles"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">directions_car</span>
            <span className="font-button text-button">My Vehicles</span>
          </NavLink>
          <NavLink
            to="/customer/my-appointments"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">event</span>
            <span className="font-button text-button">Appointments</span>
          </NavLink>
          <NavLink
            to="/customer/purchase-history"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">receipt_long</span>
            <span className="font-button text-button">Purchase History</span>
          </NavLink>
          <NavLink
            to="/customer/request-part"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">handyman</span>
            <span className="font-button text-button">Request Part</span>
          </NavLink>
          <NavLink
            to="/customer/my-reviews"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3">rate_review</span>
            <span className="font-button text-button">My Reviews</span>
          </NavLink>
        </nav>

        <div className="px-4 mb-6">
          <NavLink className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95" to="/customer/book-appointment">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="font-button text-button uppercase tracking-tight">Book Appointment</span>
          </NavLink>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <a className="flex items-center px-6 py-3 text-slate-400 font-medium hover:text-slate-100 hover:bg-slate-800 transition-all duration-200" href="#" onClick={handleLogout}>
            <span className="material-symbols-outlined mr-3">logout</span>
            <span className="font-button text-button">Logout</span>
          </a>
        </div>
      </aside>

      <main className={`md:ml-64 min-h-screen bg-background pt-16 ${mainClassName}`.trim()}>
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center w-1/3">
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <NotificationDropdown role="Customer" />
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <Link to="/customer/profile" className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-100 transition-colors">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-none">{displayName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{roleLabel}</p>
              </div>
              <img alt="Customer Avatar" className="h-10 w-10 rounded-full border-2 border-teal-500/20 object-cover" src={avatarUrl} />
            </Link>
          </div>
        </header>

        {children}
      </main>

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

export default CustomerLayout
