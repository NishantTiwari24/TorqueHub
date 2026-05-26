import Navbar from './Navbar'
import Footer from './Footer'
import Preloader from '../components/common/Preloader'

function MainLayout({ children, loading = false }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      {loading && <Preloader />}
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

export default MainLayout
