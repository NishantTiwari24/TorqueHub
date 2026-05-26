import MainLayout from '../../../layout/MainLayout'
import Icon from '../../../components/common/Icon'

function About() {
  const teamMembers = [
    {
      name: 'Nishant Tiwari',
      role: 'Team Leader',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCUkI5H_Qso-DZczwrjzf6BvMu7h9f9mnmRMMNOSfStZbTTrQfg3DoiMLscp81wi91R0_ReWkdQmsfEpctle_V3-cNvK_B_HgDeyehC-uzGUZrfQ3MIBUGzObl8VRS3OtA8mTFtwojzVeb1lT2VibMixHzJOmES9ZH8TY8qrv4DOV-e0szolrxCqi58foHld8vkf866Zdr6F9ccx6TB8tcT-BM57uBGhHZjIdKSAqe-KgOmgEv5NIstUiY-wKCViOPqhx9ODayUvh9r',
    },
    {
      name: 'Sakar Baniya',
      role: 'TorqueHub Member',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCUkI5H_Qso-DZczwrjzf6BvMu7h9f9mnmRMMNOSfStZbTTrQfg3DoiMLscp81wi91R0_ReWkdQmsfEpctle_V3-cNvK_B_HgDeyehC-uzGUZrfQ3MIBUGzObl8VRS3OtA8mTFtwojzVeb1lT2VibMixHzJOmES9ZH8TY8qrv4DOV-e0szolrxCqi58foHld8vkf866Zdr6F9ccx6TB8tcT-BM57uBGhHZjIdKSAqe-KgOmgEv5NIstUiY-wKCViOPqhx9ODayUvh9r',
    },
    {
      name: 'Sarrok Thapa',
      role: 'TorqueHub Member',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCUkI5H_Qso-DZczwrjzf6BvMu7h9f9mnmRMMNOSfStZbTTrQfg3DoiMLscp81wi91R0_ReWkdQmsfEpctle_V3-cNvK_B_HgDeyehC-uzGUZrfQ3MIBUGzObl8VRS3OtA8mTFtwojzVeb1lT2VibMixHzJOmES9ZH8TY8qrv4DOV-e0szolrxCqi58foHld8vkf866Zdr6F9ccx6TB8tcT-BM57uBGhHZjIdKSAqe-KgOmgEv5NIstUiY-wKCViOPqhx9ODayUvh9r',
    },
    {
      name: 'Dipen Khatri',
      role: 'TorqueHub Member',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBPz3yHMg50Lw9425oC9MoURAn-XHXaOS9pxQ36WCBrVBUqo0s72x3B4ffGOCTFwboF2dS5cpAGEOlTjuTS4q1H_IDvFi2tSFF7RSl4BEx1kqYn45S4Zj35dpspAnx9DlCI9akIPVS2PG3_Ppt0iJ0KayiXBd8IV5KztK6ukvVFkorWap8jnWzipmleFTNvHVWWybyMy8fTj87SFntfC_Jc75QzGkxSpIec0lhWOW1NCY3d8RCI2Wzu4RFIi8Gq1N-rCrQF9mwlS8Ux',
    },
    {
      name: 'Abhinav Bahadur Koirala',
      role: 'TorqueHub Member',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB0aY-FikTq44wSuKvKXmX1gDevX9jRo8-M2pmQbcUJDux9jk4H2TQIQxN2-6m-z9RR82lHUhdC9kINVtwkuRW3TjRXrkInNtg7S4-9J_f4BpFM03DcoSoCMDg1pSnyomct7MCnup37CIqieIIPse6K7_PQR5-e9gCRaYYjoMXVQ5OpE5tEPTyyVUJ51J5zTUdJ6JrksqW9QA4h6XEsWAa-5DUJCpXJErB_jlFKFWUflCiORyzqQylUy_2fjPd1akpZkeLmqpej3iKC',
    },
  ]

  return (
    <MainLayout>
      <section className="relative h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Industrial workspace"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQSnyBK3v5MhuMM8zWP1-Sq8LmktIA77CKacEn-9FUtFTKxnxHuVMYa35evGFADb25esaQiJwfTc8EzIq5O_IrZZXEz2F-3_VmT6ceRSPwKF8iFVI7Ez3foCuHC3aTMApEzYreZs5GGyQeshqTnn4XuadZg-j0Ns14XZAMe4W7c3xqEsjafUINa8qiEKaZN_ao0A-ItWA_1c7mFViJpYd9Owijco_XHueHi1Zz5CeuCuezx01r7bH0nn_YIuI-6H8zUEALkG-9U3si"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12 w-full">
          <div className="max-w-2xl w-full">
            <span className="font-label-caps text-primary-fixed-dim uppercase tracking-widest mb-4 block">Since 1998</span>
            <h1 className="font-h1 text-white text-5xl lg:text-6xl mb-6 leading-tight">Precision Engineered for the Modern Road.</h1>
            <p className="text-body-base text-gray-300 mb-8 max-w-[32rem] leading-relaxed">We provide the industrial-grade components and expert services that keep the world's most sophisticated fleets moving with uncompromising reliability.</p>
          </div>
        </div>
      </section>

      <section className="py-xl bg-surface">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
            <div className="space-y-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps uppercase">
                <Icon className="text-sm" name="rocket_launch" />
                Our Purpose
              </div>
              <h2 className="font-h2 text-on-surface">Pioneering the Future of Vehicle Performance.</h2>
              <p className="font-body-base text-on-surface-variant leading-relaxed">
                TorqueHub was founded on a simple principle: industrial-grade precision should be accessible to every fleet manager and performance enthusiast. We bridge the gap between heavy industry and digital logistics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-md">
                <div className="p-lg bg-surface-container-low rounded-xl border border-outline-variant">
                  <Icon className="text-primary mb-2 text-3xl" name="visibility" />
                  <h3 className="font-h3 text-xl mb-2">Our Vision</h3>
                  <p className="font-body-sm text-on-surface-variant">To be the global standard in high-performance parts distribution and predictive maintenance.</p>
                </div>
                <div className="p-lg bg-surface-container-low rounded-xl border border-outline-variant">
                  <Icon className="text-primary mb-2 text-3xl" name="track_changes" />
                  <h3 className="font-h3 text-xl mb-2">Our Mission</h3>
                  <p className="font-body-sm text-on-surface-variant">Empowering vehicle owners through superior engineering and transparent service ecosystems.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                <img
                  alt="Modern engineering"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWj_HafrpGsM6XHbAEGmMbMC6H88a0eFiJkoVxT4Fv2j45tGUQQjvJBy5l-C_jjQQHHPFCZ_8dJi7KhlXL3fIWCzpqHFmr4PrPuFQheM_u2Z23r-4KPf3GkXMujmJRRES6wuefQ9jkdLxDGbf0jIjph4rzWY_ScaBTcOEddcn1FpjNUXzVH0aTsfvZELZKrPBKOwVM8r-1y7rm5C8EtYj8bdMNekh6Vrxj5QlnzKXGeyX4XmcsetdojP6AzVQ4HMlahFNiqp94F5rv"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-lg rounded-xl shadow-lg border border-gray-100 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Icon className="text-primary" name="verified" />
                  </div>
                  <div>
                    <p className="font-h3 text-2xl text-on-surface">25+</p>
                    <p className="font-label-caps text-on-surface-variant">Years Excellence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl bg-surface-bright">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-xl">
            <h2 className="font-h2 text-on-surface mb-4">Why TorqueHub?</h2>
            <p className="font-body-base text-on-surface-variant max-w-2xl mx-auto">
              Engineered excellence is not just a tagline; it's our operational standard. Discover what sets our ecosystem apart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-gutter">
            <div className="md:col-span-2 row-span-2 p-xl bg-white rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
              <div>
                <Icon className="text-primary text-4xl mb-4" name="precision_manufacturing" />
                <h3 className="font-h1 mb-4">Quality Parts, Certified Reliability</h3>
                <p className="font-body-base text-on-surface-variant mb-6">
                  Every component in our warehouse undergoes a rigorous 48-point diagnostic check before it reaches your vehicle.
                </p>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden">
                <img
                  alt="Quality control"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNufnm2hnHbX_EJOa39WnrmpTQiNa6uUAqEPSX6lH86Q3E0Aowmg0sUGs_1CByvyLMDgtemIMs_gKJYYo872Fhd3deVJV1SgdZdqiDbFAkVr-Y2RQghyHrMV7RxFDZR-zLEkJHbzpKkxmrK47WbCEgLrc2LKisCJGs85u3pBi6c1HoMWFMEp_8Ub9O6Nun4zT2s3mFchNEK7-hEMciCmD0sULsrCYEAXbP41R1Km7BQh01QzJZiP8ks-zjecAFc-l-DBVHCz35G3D1"
                />
              </div>
            </div>

            <div className="p-lg bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
              <Icon className="text-secondary text-3xl mb-4" name="engineering" />
              <h3 className="font-h3 mb-2">Expert Staff</h3>
              <p className="font-body-sm text-on-surface-variant">Our technicians are ASE-certified masters with decades of combined experience.</p>
            </div>

            <div className="p-lg bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
              <Icon className="text-tertiary text-3xl mb-4" name="handshake" />
              <h3 className="font-h3 mb-2">Unwavering Trust</h3>
              <p className="font-body-sm text-on-surface-variant">Transparent pricing and real-time order tracking ensure confidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl bg-surface">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-xl">
            <div>
              <h2 className="font-h2 text-on-surface">Meet the Engineers</h2>
              <p className="font-body-base text-on-surface-variant">The minds behind the machinery.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
            {teamMembers.map((member) => (
              <div className="text-center group" key={member.name}>
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-surface-container">
                  <img alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" src={member.image} />
                </div>
                <h4 className="font-h3 text-lg mb-1">{member.name}</h4>
                <p className="font-label-caps text-primary uppercase">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default About
