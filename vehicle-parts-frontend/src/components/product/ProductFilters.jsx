import { productCategories } from '../../data/products'

function ProductFilters({ filters, onChange }) {
  return (
    <aside className="w-full flex-shrink-0 lg:w-64">
      <div className="sticky top-24 rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
        <h3 className="mb-4 text-h3 text-on-surface">Filters</h3>
        <label className="mb-3 block text-label-caps text-outline">Category</label>
        <select value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })} className="mb-4 w-full rounded-lg border border-outline-variant bg-white text-body-sm focus:border-primary focus:ring-primary">
          {productCategories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <label className="mb-3 block text-label-caps text-outline">Search</label>
        <input value={filters.search} onChange={(e) => onChange({ ...filters, search: e.target.value })} placeholder="Search parts..." className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed" />
      </div>
    </aside>
  )
}

export default ProductFilters
