import Icon from '../common/Icon'
import { Link } from 'react-router-dom'

function ProductCard({ product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${product.status === 'Low Stock' ? 'bg-amber-500' : 'bg-teal-600'}`}>{product.status}</span>
      </div>
      <div className="flex flex-grow flex-col p-md">
        <span className="mb-1 text-label-caps text-primary">{product.category}</span>
        <h3 className="mb-2 text-body-base font-bold text-on-surface transition-colors group-hover:text-primary">{product.name}</h3>
        <p className="mb-4 line-clamp-2 text-body-sm text-on-surface-variant">{product.description}</p>
        <div className="mt-auto flex items-center justify-between border-t border-outline-variant pt-4">
          <span className="text-h3 text-on-surface">Rs. {product.price.toFixed(2)}</span>
          <Link to={`/products/${product.id}`} className="flex items-center gap-1 text-button text-primary hover:underline">
            View Details
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
