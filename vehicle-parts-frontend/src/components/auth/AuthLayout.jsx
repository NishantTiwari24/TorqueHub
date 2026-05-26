import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'

function AuthLayout({ title, subtitle, children, altText, altLink, altTo }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-grow items-center justify-center p-6 lg:p-12">
        <div className="grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg lg:grid-cols-2">
          <div className="relative hidden bg-primary lg:block">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4_qEnKiyDAPouTTXJgdRFKuGlQxSYMKXTcS6WgUs7SZ48OourSk7LeUumFG9VfrVk42gO2eMFkdPIuRgaWJuGpPY0lm3pntIr3Pka0t_7_X2AeI_Oqm7rOx4LsZ1KxaM9r4bxbt-u8luFkFreM8f05-MzEzCocEq5aO7FKT_gC4_mNWyEBFBx-uGzooXQA1UyKWmKh5G7aO4t5Y1__61A0iSB5xCBYVWWNEDUuZPhrGk7cKxvfSwMa7ILG2kzzeKIDdHvhcfDhCyl" alt="Industrial environment" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
          <div className="flex min-h-[600px] flex-col justify-center p-8 lg:p-16">
            <h1 className="mb-2 text-h2 text-on-surface">{title}</h1>
            <p className="mb-8 text-body-sm text-on-surface-variant">{subtitle}</p>
            {children}
            {altText ? (
              <p className="mt-6 text-center text-body-sm text-on-surface-variant">
                {altText} <Link to={altTo} className="font-bold text-primary hover:underline">{altLink}</Link>
              </p>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default AuthLayout
