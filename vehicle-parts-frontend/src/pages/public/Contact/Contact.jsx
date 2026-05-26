import { useState } from 'react'
import MainLayout from '../../../layout/MainLayout'
import Icon from '../../../components/common/Icon'

function Contact() {
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '' })

  return (
    <MainLayout>
      <section className="max-w-[1280px] mx-auto w-full px-6 lg:px-12 py-xl">
        <div className="mb-xl text-center md:text-left">
          <h1 className="font-h1 text-h1 text-on-surface mb-md">Get in Touch</h1>
          <p className="font-body-base text-body-base text-on-surface-variant max-w-2xl">
            Have questions about our high-performance components or need technical assistance? Our engineering support team is ready to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
            <form className="space-y-lg" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant">Full Name</label>
                  <input className="w-full h-[44px] px-md rounded-lg border border-outline-variant bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="John Doe" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant">Email Address</label>
                  <input className="w-full h-[44px] px-md rounded-lg border border-outline-variant bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="john@company.com" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Phone Number</label>
                <input className="w-full h-[44px] px-md rounded-lg border border-outline-variant bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="+1 (555) 000-0000" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
              </div>

              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Message</label>
                <textarea className="w-full px-md py-md rounded-lg border border-outline-variant bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" rows={6} placeholder="How can our technical team help you?" value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} />
              </div>

              <button className="w-full md:w-auto px-xl h-[44px] bg-primary text-on-primary font-button text-button rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2" type="submit">
                Send Message <Icon name="send" className="text-[20px]" />
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-gutter">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-md">
              <div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex items-start gap-md">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <Icon className="text-primary" name="location_on" />
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-primary mb-1">Our Headquarters</p>
                  <p className="font-body-base text-body-base text-on-surface">Informatics College Pokhara<br />Pokhara, Nepal</p>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex items-start gap-md">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <Icon className="text-primary" name="call" />
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-primary mb-1">Direct Support</p>
                  <p className="font-body-base text-body-base text-on-surface">+977 9800000000<br />Everyday, 8am-7pm</p>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex items-start gap-md">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <Icon className="text-primary" name="mail" />
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-primary mb-1">Technical Inquiries</p>
                  <p className="font-body-base text-body-base text-on-surface">support@torquehub.com<br />sales@torquehub.com</p>
                </div>
              </div>
            </div>

            <div className="flex-grow min-h-[300px] bg-surface-container-highest rounded-xl border border-outline-variant overflow-hidden relative group">
              <iframe
                src="https://maps.google.com/maps?q=Informatics%20College%20Pokhara&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full min-h-[300px] border-0 grayscale opacity-85 group-hover:grayscale-0 transition-all duration-500"
                allowFullScreen=""
                loading="lazy"
                title="Informatics College Pokhara Map"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default Contact
