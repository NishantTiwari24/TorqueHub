import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../../../layout/MainLayout'
import Icon from '../../../components/common/Icon'
import { getPublicPartList } from '../../../api/partApi'

const fallbackProducts = [
  {
    name: 'Premium Brake Pads',
    stock: 'In Stock',
    stockClass: 'bg-primary-fixed text-on-primary',
    description: 'Heavy-duty heat-resistant ceramic coating for industrial vehicles.',
    price: 'Rs. 124.99',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDLdQRavMwXs6Xv40UZdfI8OAOOXQyE6EFw1VkUFuA2GXFVS_cuREWXZdyJMUEt3Ij_1u7_tN8pi7k04hQgopgg9zpLvs0TAJt8YqnzGcT1JP_mhwT_89cPxIj8ErP4I3tVhA4PzhvKIDSqVEbN8z_K5QbLnAFon2MGnsKPOR3lJU9BcuIugf_c1uhsV_Q0CNILtdzHLCkLv2s8SX-87UukucTyVXfmoHiP7u7hvaoG8UrVt6m87MHoipWNfpmzovr-C1srQn3TQTGl',
  },
  {
    name: 'High-Flow Oil Filter',
    stock: 'In Stock',
    stockClass: 'bg-primary-fixed text-on-primary',
    description: 'Extended life synthetic media for maximum engine protection.',
    price: 'Rs. 34.50',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB5C0hg__BxidZ6Lg-tyS5-Z0RDTczeN774QlnI1FxiY2Q2g_x4DczAJUAjVMedDDMADtRiRUa2vxq42GcA-Xh2JQZ8Fj6ufWbrLYEN9Qb81aO71oXac4Ou-xPr1rFCYSFw7nDkxNNYu_GGbYzEn0maAS1AmOJOOLHhJ66Nu0C_VV1V7ZRGTf0ao1O0l-q9EaMD4WXuW4bFtuH2nAIlGyX9rFUg8NyOY9AFNgYM5H0vLut0CKlpUOFxF3YD30DXSATYIfR01OucyCeZ',
  },
  {
    name: 'Pro LED Headlights',
    stock: 'Low Stock',
    stockClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
    description: 'Ultra-bright 6000K daylight visibility with adaptive beam pattern.',
    price: 'Rs. 289.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBt-6eTcN0QWT6AGCgnEeuaq9pZjyu4H0AmyAio0WDAEgVac2Drp41SIEx5fGIe-PyNF6xGENFJ94Wpu2AikmLKn7DGEuRkIMvGvGWySI3iTT9mpKVAT8AnObo-MrH6-X6A75V85CFsn-8UjByd59flDBbN57Ku5AJjfkVFNoECRH5vFdgHoK7kWZb6OS-N6aUuJCyC5AnGgTu9O7O4Xov85oDnL9fH5xzMxaXraBL6e9MOLLyyOaT7n8Cv3AKlkl9E0CB_FmM6h8-p',
  },
  {
    name: 'Titanium Series Battery',
    stock: 'In Stock',
    stockClass: 'bg-primary-fixed text-on-primary',
    description: 'Deep cycle performance with superior cold-cranking power.',
    price: 'Rs. 210.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBB5xU0Lt1QUJKKMDrGCrMKGNzyaof08tpyKuyW3jQOZQyUfx14V_rc8gTjB27dv1q6G-JcUve-rJXBfjkinffLwHRs6w3JVKfze7SdbFoveb6Vu7Q0hvt8IOyYMWyu7EmEYTCOH-t-x8Rp-5yQ8giBV6wiaask7EsnqRT97a7913CMTrz0HHIeIEkYRmtIVSku6exBEODY-KQUnTIJYqDvwMY_PEIHQ_ukJ3LcEk7mL4sE_vuAvaKFIIN_icIBs2rsBYVs9cFM-CW',
  },
]

const services = [
  {
    icon: 'build',
    title: 'Precision Repair',
    description: 'Comprehensive engine, transmission, and drivetrain repairs using only OEM-certified parts.',
  },
  {
    icon: 'settings_suggest',
    title: 'Scheduled Maintenance',
    description: 'Optimized maintenance plans to maximize vehicle longevity and prevent costly downtime.',
  },
  {
    icon: 'biotech',
    title: 'Digital Diagnostics',
    description: 'Advanced electronic scanning and sensor calibration for modern high-tech vehicle systems.',
  },
]

function Landing() {
  const [featuredParts, setFeaturedParts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedParts = async () => {
      try {
        setIsLoading(true)
        const response = await getPublicPartList()
        const partsData = response?.data || response
        if (Array.isArray(partsData) && partsData.length > 0) {
          const mapped = partsData.slice(0, 4).map((item) => ({
            name: item.name,
            stock: item.stockQuantity > 0 ? 'In Stock' : 'Out of Stock',
            stockClass: item.stockQuantity > 0 ? 'bg-primary-fixed text-on-primary' : 'bg-error-container text-on-error-container',
            description: item.descriptions || 'High quality precision industrial component.',
            price: `Rs. ${item.price}`,
            image: item.imageUrls?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
          }))
          setFeaturedParts(mapped)
        } else {
          setFeaturedParts(fallbackProducts)
        }
      } catch (error) {
        console.error('Failed to load featured parts:', error)
        setFeaturedParts(fallbackProducts)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFeaturedParts()
  }, [])

  return (
    <MainLayout loading={isLoading}>
      <section className="relative h-[870px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXn6ESxw2ztZAvCiaqoyP11a8Wx-QAXsgcEHgnc8RZy2XkE-xpdZLR5T85NyegDPatE0n9MweheAHFnrxdSTBo1HYAyfq5JSM0PJYwaneRXNgvWcpRJs3Tn6d_Mja6uxWA24tOrJ9umpzN79fHpC9jW-vKH3QrEHNQDcZIykPVKj-O-bFATSaVfENrYvonbwlyn_vaxHVj6ZwSu9XP0wj9VjNHaBs9NQOMViTdqndfixmD8KHiRBpcGVywbEsznMBY0ik9HnBbbj-T"
            alt="Industrial assembly line"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12 w-full">
          <div className="max-w-2xl">
            <h1 className="text-h1 font-bold text-on-background mb-lg leading-tight">
              Your One-Stop Vehicle Parts &amp; Service Center
            </h1>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              Engineered for precision. We provide top-tier industrial vehicle components and expert diagnostic services to keep your fleet in peak condition.
            </p>
            <div className="flex flex-wrap gap-md">
              <Link to="/public/products" className="bg-primary text-on-primary font-button text-button px-xl py-md rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center gap-2">
                Browse Parts
                <Icon name="shopping_cart" className="text-[20px]" />
              </Link>
              <Link to="/public/contact" className="bg-surface-container border border-outline-variant text-primary font-button text-button px-xl py-md rounded-lg hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center gap-2">
                Book Service
                <Icon name="calendar_today" className="text-[20px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl bg-surface-container-lowest">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-xl">
            <div>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-2 block">Premium Inventory</span>
              <h2 className="font-h2 text-h2 text-on-background">Featured Components</h2>
            </div>
            <Link to="/public/products" className="text-primary font-button text-button flex items-center gap-1 hover:underline">
              View All Parts <Icon name="chevron_right" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {featuredParts.map((item) => (
              <div key={item.name} className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="h-48 overflow-hidden bg-gray-100">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.image} alt={item.name} />
                </div>
                <div className="p-lg">
                  <div className="flex justify-between items-start mb-sm">
                    <h3 className="font-h3 text-body-base font-bold text-on-background">{item.name}</h3>
                    <span className={`${item.stockClass} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>{item.stock}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mb-md">{item.description}</p>
                  <div className="pt-md border-t border-gray-100 flex justify-between items-center">
                    <span className="font-h3 text-lg text-primary">{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-xl bg-background">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-xl">
            <h2 className="font-h2 text-h2 text-on-background mb-md">Expert Service Ecosystem</h2>
            <p className="font-body-base text-on-surface-variant max-w-2xl mx-auto">
              From routine maintenance to complex mechanical overhauls, our certified technicians use state-of-the-art equipment to ensure your safety and performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.title} className="bg-white p-xl rounded-xl border border-gray-200 shadow-sm hover:border-primary transition-colors group">
                <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center mb-lg group-hover:bg-primary-container transition-colors">
                  <Icon name={service.icon} className="text-primary group-hover:text-white" />
                </div>
                <h3 className="font-h3 text-on-background mb-sm">{service.title}</h3>
                <p className="text-body-base text-on-surface-variant mb-lg">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default Landing
