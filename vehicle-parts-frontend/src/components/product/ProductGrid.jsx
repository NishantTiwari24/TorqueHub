import ProductCard from './ProductCard'

function ProductGrid({ products }) {
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
}

export default ProductGrid
