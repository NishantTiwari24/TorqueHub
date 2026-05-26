const TOAST_EVENT = 'app:toast'

export function showToast({ type = 'info', message = '', duration = 3000 }) {
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { type, message, duration },
    }),
  )
}

export const toastService = {
  success: (message, duration) => showToast({ type: 'success', message, duration }),
  error: (message, duration) => showToast({ type: 'error', message, duration }),
  info: (message, duration) => showToast({ type: 'info', message, duration }),
}

export { TOAST_EVENT }

