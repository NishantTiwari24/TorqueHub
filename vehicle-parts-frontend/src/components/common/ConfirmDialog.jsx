function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null

  const confirmClass =
    confirmVariant === 'danger'
      ? 'bg-error text-white hover:opacity-90'
      : 'bg-primary text-on-primary hover:bg-primary-container'

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-[min(92vw,440px)] rounded-xl border border-outline-variant bg-white shadow-2xl p-6">
        <h3 className="font-h3 text-h3 text-on-surface mb-2">{title}</h3>
        <p className="text-body-base text-on-surface-variant mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-slate-50"
            onClick={onCancel}
            type="button"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${confirmClass}`}
            onClick={onConfirm}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
