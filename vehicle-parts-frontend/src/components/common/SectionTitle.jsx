function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-h2 text-on-surface">{title}</h1>
      {subtitle ? <p className="mt-2 text-body-sm text-on-surface-variant">{subtitle}</p> : null}
    </div>
  )
}

export default SectionTitle
