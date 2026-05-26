function PageHeader({ title, subtitle, breadcrumb = null, actions = null, className = '' }) {
  return (
    <header className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 ${className}`.trim()}>
      <div>
        {breadcrumb}
        <h1 className="text-5xl font-black tracking-tight text-on-surface">{title}</h1>
        {subtitle ? <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </header>
  )
}

export default PageHeader
