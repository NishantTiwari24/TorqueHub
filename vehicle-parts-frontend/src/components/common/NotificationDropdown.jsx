import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLowStockNotifications, getMyNotifications, markNotificationAsRead } from '../../api/notificationApi'

const NotificationDropdown = ({ role = 'Admin' }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = role === 'Admin' ? await getLowStockNotifications() : await getMyNotifications()
      setNotifications(toNotificationList(data))
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadNotifications])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const toggleOpen = () => {
    if (!open) {
      void loadNotifications()
    }
    setOpen((current) => !current)
  }

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => notification.isRead === false || notification.isRead === undefined).length
  }, [notifications])

  const handleNotificationClick = async (notification) => {
    if (!notification) return

    if (notification.notificationId && !notification.isRead) {
      setNotifications((current) =>
        current.map((item) =>
          item.notificationId === notification.notificationId ? { ...item, isRead: true } : item,
        ),
      )

      try {
        await markNotificationAsRead(notification.notificationId)
      } catch {
        setNotifications((current) =>
          current.map((item) =>
            item.notificationId === notification.notificationId ? { ...item, isRead: false } : item,
          ),
        )
      }
    }

    if (isSafeAppRoute(notification.actionUrl)) {
      setOpen(false)
      navigate(notification.actionUrl)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="p-2 text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors relative"
        onClick={toggleOpen}
        aria-label="Notifications"
        type="button"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5 min-w-[18px] text-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 font-semibold">Notifications</div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No notifications</div>
            ) : (
              notifications.map((notification, idx) => (
                <button
                  key={notification.notificationId || idx}
                  className={`block w-full border-b border-gray-100 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700 ${
                    notification.isRead ? 'text-slate-500' : 'text-slate-800 dark:text-slate-100'
                  }`}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                >
                  <span className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] ${notification.isRead ? 'text-slate-400' : 'text-teal-600'}`}>
                    {role === 'Admin' ? 'Low Stock' : notification.isRead ? 'Read' : 'Unread'}
                  </span>
                  {notification.message || notification.partName || 'Notification'}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function toNotificationList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

function isSafeAppRoute(actionUrl) {
  return typeof actionUrl === 'string' && actionUrl.startsWith('/') && !actionUrl.startsWith('//')
}

export default NotificationDropdown
