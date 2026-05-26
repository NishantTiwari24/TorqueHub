import { NavLink } from 'react-router-dom'
import { theme } from '../styles/theme'

function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-6 md:grid-cols-4 lg:px-12">
        <div className="md:col-span-1">
          <span className="mb-4 block text-lg font-bold text-slate-800 dark:text-slate-200">{theme.productName}</span>
          <p className="mb-4 text-xs uppercase tracking-widest text-gray-500">© {new Date().getFullYear()} {theme.productName} Industrial Ecosystem. Engineered for Precision.</p>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="mb-2 text-sm font-bold text-on-background">Explore</h4>
          <NavLink className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" to="/public/products">Products</NavLink>
          <a className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" href="#">Services</a>
          <a className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" href="#">Bookings</a>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="mb-2 text-sm font-bold text-on-background">Legal</h4>
          <a className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" href="#">Privacy Policy</a>
          <a className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" href="#">Terms of Service</a>
          <a className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" href="#">Shipping Info</a>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="mb-2 text-sm font-bold text-on-background">Portals</h4>
          <a className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" href="#">Partner Portal</a>
          <a className="text-xs uppercase tracking-widest text-gray-500 transition-all hover:text-teal-600 hover:underline decoration-teal-500 underline-offset-4 dark:text-gray-400" href="#">Careers</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
