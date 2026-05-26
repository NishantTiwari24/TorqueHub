import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MainLayout from '../../../layout/MainLayout'
import Icon from '../../../components/common/Icon'
import { getPublicPartById, getPublicPartList } from '../../../api/partApi'
import { toastService } from '../../../services/toastService'

function ProductDetails() {
  const { id } = useParams()
  const [part, setPart] = useState(null)
  const [relatedParts, setRelatedParts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  useEffect(() => {
    const loadPartDetails = async () => {
      try {
        setIsLoading(true)
        const [detail, list] = await Promise.all([
          getPublicPartById(id),
          getPublicPartList(),
        ])

        setPart(detail?.data || detail)
        setActiveImageIndex(0)
        const partsList = list?.data || list
        const related = (Array.isArray(partsList) ? partsList : [])
          .filter((item) => String(item.partId) !== String(id))
          .slice(0, 4)
        setRelatedParts(related)
      } catch (error) {
        setPart(null)
        toastService.error(error.message || 'Failed to load part details.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPartDetails()
  }, [id])

  const mappedPart = useMemo(() => {
    if (!part) return null
    const images = Array.isArray(part.imageUrls) && part.imageUrls.length > 0
      ? part.imageUrls
      : ['https://via.placeholder.com/640x480?text=No+Image']

    return {
      id: String(part.partId),
      name: part.name || 'Unnamed Part',
      description: part.descriptions || 'No description available.',
      category: part.category || 'General',
      condition: part.condition || 'New',
      price: Number(part.price || 0),
      stockQuantity: Number(part.stockQuantity || 0),
      vendorName: part.vendorName || 'Unknown Vendor',
      images,
      image: images[0],
    }
  }, [part])

  const mappedRelated = useMemo(() => {
    return relatedParts.map((item) => {
      const images = Array.isArray(item.imageUrls) && item.imageUrls.length > 0
        ? item.imageUrls
        : ['https://via.placeholder.com/640x480?text=No+Image']

      return {
        id: String(item.partId),
        name: item.name || 'Unnamed Part',
        category: item.category || 'General',
        price: Number(item.price || 0),
        image: images[0],
      }
    })
  }, [relatedParts])

  if (isLoading) {
    return (
      <MainLayout loading={isLoading}>
        <section className="max-w-[1280px] mx-auto px-6 lg:px-12 py-16 text-on-surface-variant">Loading part details...</section>
      </MainLayout>
    )
  }

  if (!mappedPart) {
    return (
      <MainLayout>
        <section className="max-w-[1280px] mx-auto px-6 lg:px-12 py-16">Product not found. <Link className="text-primary" to="/public/products">Back to products</Link></section>
      </MainLayout>
    )
  }

  const totalImages = mappedPart.images.length
  const activeImage = mappedPart.images[activeImageIndex] || mappedPart.images[0]
  const goToPreviousImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + totalImages) % totalImages)
  }
  const goToNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % totalImages)
  }
  const openLightbox = () => setIsLightboxOpen(true)
  const closeLightbox = () => setIsLightboxOpen(false)

  return (
    <MainLayout>
      <section className="max-w-[1280px] mx-auto w-full px-6 lg:px-12 py-xl">
        <nav className="flex items-center space-x-2 text-body-sm text-on-surface-variant mb-lg">
          <Link className="hover:text-primary transition-colors" to="/public/products">Catalog</Link>
          <Icon className="text-[16px]" name="chevron_right" />
          <span className="hover:text-primary transition-colors">{mappedPart.category}</span>
          <Icon className="text-[16px]" name="chevron_right" />
          <span className="font-medium text-on-surface">{mappedPart.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7 space-y-md">
            <div className="bg-surface-container-lowest border border-gray-200 rounded-xl overflow-hidden aspect-[4/3] relative group shadow-sm">
              <button
                className="absolute inset-0 z-10 cursor-zoom-in"
                onClick={openLightbox}
                type="button"
                aria-label="Open full-size image"
              />
              <img alt={mappedPart.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={activeImage} />
              {totalImages > 1 ? (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors flex items-center justify-center"
                    onClick={goToPreviousImage}
                    type="button"
                    aria-label="Previous image"
                  >
                    <Icon name="chevron_left" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors flex items-center justify-center"
                    onClick={goToNextImage}
                    type="button"
                    aria-label="Next image"
                  >
                    <Icon name="chevron_right" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-md">
              {mappedPart.images.map((image, index) => (
                <button
                  className={`${index === activeImageIndex ? 'border-2 border-primary ring-2 ring-primary/15' : 'border border-gray-200 hover:border-primary'} bg-surface-container-lowest rounded-lg overflow-hidden aspect-square transition-colors`}
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Show image ${index + 1}`}
                >
                  <img alt="Product view" className="w-full h-full object-cover" src={image} />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-lg sticky top-24">
            <div className="bg-surface-container-lowest border border-gray-200 rounded-xl p-lg shadow-sm">
              <div className="flex justify-between items-start mb-sm">
                <span className="text-label-caps text-primary bg-primary-fixed/20 px-2 py-0.5 rounded">SKU: PART-{mappedPart.id}</span>
                <span className="text-label-caps text-on-surface-variant">{mappedPart.condition}</span>
              </div>

              <h1 className="font-h1 text-on-surface mb-xs">{mappedPart.name}</h1>
              <p className="font-body-base text-on-surface-variant mb-md leading-relaxed">
                {mappedPart.description}
              </p>

              <div className="flex items-baseline gap-2 mb-lg">
                <span className="font-h1 text-primary">Rs. {mappedPart.price.toFixed(2)}</span>
              </div>

              <div className="space-y-md">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant">
                  <Icon className="text-primary text-[20px]" name="inventory_2" />
                  <span className="text-body-sm font-semibold text-on-surface">Stock: {mappedPart.stockQuantity} units</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container border border-gray-200 rounded-xl p-md">
              <h3 className="text-label-caps text-on-surface-variant mb-md">Vendor</h3>
              <div className="font-bold text-on-surface">{mappedPart.vendorName}</div>
            </div>
          </div>
        </div>

        <section className="mt-xl py-xl border-t border-gray-200">
          <div className="flex justify-between items-end mb-lg">
            <div>
              <span className="text-label-caps text-secondary uppercase tracking-widest">More Options</span>
              <h2 className="font-h2 text-on-surface mt-1">Related Parts</h2>
            </div>
            <Link className="text-primary font-button flex items-center gap-1 hover:underline" to="/public/products">
              View All <Icon name="arrow_forward" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {mappedRelated.map((item) => (
              <article className="bg-surface-container-lowest border border-gray-200 rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300" key={item.id}>
                <Link className="h-48 overflow-hidden bg-surface-container block" to={`/public/products/${item.id}`}>
                  <img alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" src={item.image} />
                </Link>
                <div className="p-md">
                  <h5 className="font-bold text-on-surface text-body-base mb-1 truncate">{item.name}</h5>
                  <p className="text-on-surface-variant text-body-sm mb-4">{item.category}</p>
                  <div className="flex items-center">
                    <span className="font-bold text-on-surface">Rs. {item.price.toFixed(2)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {isLightboxOpen ? (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
            onClick={closeLightbox}
            type="button"
            aria-label="Close image preview"
          >
            <Icon name="close" />
          </button>

          {totalImages > 1 ? (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
              onClick={goToPreviousImage}
              type="button"
              aria-label="Previous image"
            >
              <Icon name="chevron_left" />
            </button>
          ) : null}

          <img
            src={activeImage}
            alt={mappedPart.name}
            className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg"
          />

          {totalImages > 1 ? (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
              onClick={goToNextImage}
              type="button"
              aria-label="Next image"
            >
              <Icon name="chevron_right" />
            </button>
          ) : null}
        </div>
      ) : null}
    </MainLayout>
  )
}

export default ProductDetails
