function AdminFormModal({
  isOpen,
  title,
  onClose,
  children,
  maxWidthClassName = 'max-w-[820px]',
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className={`w-full ${maxWidthClassName} rounded-xl border border-outline-variant bg-white shadow-2xl overflow-hidden`}>
        <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <h3 className="text-[1.6rem] font-bold text-on-surface">{title}</h3>
          <button className="p-2 rounded-lg hover:bg-slate-100" onClick={onClose} type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AdminFormModal
