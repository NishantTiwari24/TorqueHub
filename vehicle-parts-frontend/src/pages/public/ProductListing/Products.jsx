import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../../../layout/MainLayout'
import Icon from '../../../components/common/Icon'
import { getPublicPartList } from '../../../api/partApi'
import { toastService } from '../../../services/toastService'

function Products() {
  const [parts, setParts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    categories: [],
    condition: '',
    search: '',
    maxPrice: '',
    sortBy: 'Relevance',
  })

  useEffect(() => {
    const loadParts = async () => {
      try {
        setIsLoading(true)
        const response = await getPublicPartList()
        const partsData = response?.data || response
        setParts(Array.isArray(partsData) ? partsData : [])
      } catch (error) {
        toastService.error(error.message || 'Failed to load parts.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadParts()
  }, [])

  const products = useMemo(() => {
    return parts.map((part) => {
      const images = Array.isArray(part.imageUrls) ? part.imageUrls.filter(Boolean) : []
      const mainImage = images[0] || 'https://via.placeholder.com/640x480?text=No+Image'
      const stock = Number(part.stockQuantity || 0)

      return {
        id: String(part.partId),
        name: part.name || 'Unnamed Part',
        category: part.category || 'General',
        condition: part.condition || 'New',
        price: Number(part.price || 0),
        status: stock <= 10 ? 'Low Stock' : 'In Stock',
        description: part.descriptions || 'No description available.',
        image: mainImage,
        images,
      }
    })
  }, [parts])

  const filtered = useMemo(() => {
    return products.filter((item) => {
      const categoryOk = !filters.categories.length || filters.categories.includes(item.category)
      const conditionOk = !filters.condition || item.condition === filters.condition
      const searchOk = item.name.toLowerCase().includes(filters.search.toLowerCase())
      const priceOk = filters.maxPrice === '' || item.price <= filters.maxPrice
      return categoryOk && conditionOk && searchOk && priceOk
    })
  }, [filters, products])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (filters.sortBy === 'Price: Low to High') list.sort((a, b) => a.price - b.price)
    if (filters.sortBy === 'Price: High to Low') list.sort((a, b) => b.price - a.price)
    return list
  }, [filtered, filters.sortBy])

  const categories = useMemo(() => ['All', ...new Set(products.map((part) => part.category).filter(Boolean))], [products])
  const maxAvailablePrice = useMemo(() => {
    const highestPrice = products.reduce((max, product) => Math.max(max, product.price), 0)
    return Math.max(1200, Math.ceil(highestPrice))
  }, [products])
  const selectedMaxPrice = filters.maxPrice === '' ? maxAvailablePrice : filters.maxPrice

  const toggleCategory = (category) => {
    if (category === 'All') {
      setFilters((prev) => ({ ...prev, categories: [] }))
      return
    }

    setFilters((prev) => {
      const has = prev.categories.includes(category)
      return {
        ...prev,
        categories: has ? prev.categories.filter((c) => c !== category) : [...prev.categories, category],
      }
    })
  }

  return (
    <MainLayout loading={isLoading}>
      <section className="max-w-[1280px] mx-auto w-full px-6 lg:px-12 py-8">
        <nav className="flex items-center space-x-2 text-body-sm text-on-surface-variant mb-lg">
          <Link className="hover:text-primary transition-colors" to="/public">Catalog</Link>
          <Icon className="text-[16px]" name="chevron_right" />
          <span className="hover:text-primary transition-colors">Products</span>
          <Icon className="text-[16px]" name="chevron_right" />
          <span className="font-medium text-on-surface">Vehicle Parts</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-gutter">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg sticky top-24">
              <div className="mb-8">
                <h3 className="font-h3 text-h3 mb-4 text-on-surface">Filters</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-label-caps text-label-caps text-outline mb-3">Category</h4>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label key={category} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            checked={category === 'All' ? filters.categories.length === 0 : filters.categories.includes(category)}
                            className="rounded border-outline text-primary focus:ring-primary h-4 w-4"
                            onChange={() => toggleCategory(category)}
                            type="checkbox"
                          />
                          <span className="font-body-sm text-on-surface group-hover:text-primary">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-label-caps text-label-caps text-outline mb-3">Price Range</h4>
                    <input
                      className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                      max={maxAvailablePrice}
                      min="0"
                      onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
                      type="range"
                      value={selectedMaxPrice}
                    />
                    <div className="flex justify-between mt-2 text-label-caps text-on-surface-variant">
                      <span>Rs. 0</span>
                      <span>Rs. {selectedMaxPrice}+</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-label-caps text-label-caps text-outline mb-3">Condition</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`px-3 py-1 rounded-full border text-label-caps ${filters.condition === '' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline text-outline hover:border-primary hover:text-primary transition-colors'}`}
                        onClick={() => setFilters((prev) => ({ ...prev, condition: '' }))}
                        type="button"
                      >
                        All
                      </button>
                      <button
                        className={`px-3 py-1 rounded-full border text-label-caps ${filters.condition === 'New' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline text-outline hover:border-primary hover:text-primary transition-colors'}`}
                        onClick={() => setFilters((prev) => ({ ...prev, condition: 'New' }))}
                        type="button"
                      >
                        New
                      </button>
                      <button
                        className={`px-3 py-1 rounded-full border text-label-caps ${filters.condition === 'Refurbished' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline text-outline hover:border-primary hover:text-primary transition-colors'}`}
                        onClick={() => setFilters((prev) => ({ ...prev, condition: 'Refurbished' }))}
                        type="button"
                      >
                        Refurbished
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-button text-button hover:bg-teal-600 transition-colors shadow-sm" type="button">
                Apply Filters
              </button>
            </div>
          </aside>

          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="font-h2 text-h2 text-on-surface">
                Industrial Parts <span className="text-outline font-normal text-body-base">({sorted.length} Results)</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-outline">Sort By:</span>
                <select
                  className="h-10 min-w-[220px] bg-surface-container border border-outline-variant rounded-lg px-3 pr-10 text-body-sm focus:ring-primary focus:border-primary"
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                  value={filters.sortBy}
                >
                  <option>Relevance</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Top Rated</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-on-surface-variant">
                  Loading parts...
                </div>
              ) : null}
              {sorted.map((product) => (
                <article key={product.id} className="group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                  <Link className="aspect-[4/3] bg-surface-container relative overflow-hidden block" to={`/public/products/${product.id}`}>
                    <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image} />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {product.status ? (
                        <span className={`text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.status === 'Low Stock' ? 'bg-amber-500' : 'bg-teal-600'}`}>
                          {product.status}
                        </span>
                      ) : null}
                      <span className="bg-white/95 text-primary border border-primary/20 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {product.condition}
                      </span>
                    </div>
                  </Link>
                  {Array.isArray(product.images) && product.images.length > 1 ? (
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-outline-variant bg-white">
                      {product.images.slice(0, 4).map((imageUrl, index) => (
                        <img
                          key={`${product.id}-thumb-${index}`}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="h-10 w-10 rounded-md border border-outline-variant object-cover"
                          src={imageUrl}
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="p-md flex flex-col flex-grow">
                    <div className="mb-1">
                      <span className="font-label-caps text-primary">{product.category}</span>
                    </div>
                    <h3 className="font-body-base font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-4">{product.description}</p>
                    <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center">
                      <span className="text-h3 font-h3 text-on-surface">Rs. {product.price.toFixed(2)}</span>
                      <Link className="flex items-center gap-1 font-button text-primary hover:underline underline-offset-4" to={`/public/products/${product.id}`}>
                        View Details
                        <Icon className="text-[18px]" name="arrow_forward" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 flex justify-center items-center gap-2">
              <button className="p-2 border border-outline-variant rounded-lg text-outline hover:bg-surface-container transition-colors" type="button">
                <Icon name="chevron_left" />
              </button>
              <button className="w-10 h-10 bg-primary text-on-primary rounded-lg font-bold" type="button">1</button>
              <button className="w-10 h-10 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button">2</button>
              <button className="w-10 h-10 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button">3</button>
              <span className="text-outline mx-1">...</span>
              <button className="w-10 h-10 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button">8</button>
              <button className="p-2 border border-outline-variant rounded-lg text-outline hover:bg-surface-container transition-colors" type="button">
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default Products
