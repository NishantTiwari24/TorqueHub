import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/public', label: 'Home', end: true },
  { to: '/public/products', label: 'Products' },
  { to: '/public/about', label: 'About' },
  { to: '/public/contact', label: 'Contact' },
]

function Navbar() {
  return (
    <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex justify-between items-center h-16 px-6 lg:px-12 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/public" className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
            TorqueHub
          </Link>
          <nav className="hidden md:flex gap-6">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `font-inter text-sm font-medium tracking-tight ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 pb-1'
                      : 'text-gray-600 dark:text-gray-400 hover:text-teal-600'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <NavLink to="/login" className="font-inter text-sm font-medium tracking-tight text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all active:scale-[0.98]">
            Login
          </NavLink>
          <NavLink to="/register" className="font-inter text-sm font-medium tracking-tight bg-primary text-on-primary px-4 py-2 rounded-lg transition-all hover:bg-primary-container active:scale-[0.98]">
            Register
          </NavLink>
        </div>
      </div>
    </header>
  )
}

export default Navbar
