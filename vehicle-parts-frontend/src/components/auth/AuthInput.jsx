function AuthInput({ label, error, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-label-caps text-on-surface-variant">{label}</label>
      <input {...props} className={`h-[44px] w-full rounded-lg border px-4 text-body-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed ${error ? 'border-error' : 'border-outline-variant'}`} />
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  )
}

export default AuthInput
