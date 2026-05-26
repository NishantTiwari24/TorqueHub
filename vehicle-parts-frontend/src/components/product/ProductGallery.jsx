function ProductGallery({ image, title }) {
  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
      <img src={image} alt={title} className="h-full max-h-[520px] w-full object-cover" />
    </div>
  )
}

export default ProductGallery
