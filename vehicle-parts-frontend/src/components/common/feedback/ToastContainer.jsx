import { useEffect, useState } from 'react'
import { TOAST_EVENT } from '../../../services/toastService'

function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const onToast = (event) => {
      const { type = 'info', message = '', duration = 3000 } = event.detail || {}
      if (!message) return

      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, type, message }])

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, duration)
    }

    window.addEventListener(TOAST_EVENT, onToast)
    return () => window.removeEventListener(TOAST_EVENT, onToast)
  }, [])

  const tone = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white',
  }

  return (
    <div className="fixed right-4 top-4 z-[9999] flex w-[320px] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm shadow-lg ${tone[toast.type] || tone.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export default ToastContainer

