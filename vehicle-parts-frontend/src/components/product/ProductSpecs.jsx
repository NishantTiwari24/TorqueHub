function ProductSpecs({ specs }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <h3 className="mb-3 text-body-base font-bold text-on-surface">Specifications</h3>
      <ul className="space-y-2 text-body-sm text-on-surface-variant">
        {specs.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  )
}

export default ProductSpecs
