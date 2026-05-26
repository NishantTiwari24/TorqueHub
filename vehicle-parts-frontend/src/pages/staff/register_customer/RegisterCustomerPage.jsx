import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/common/PageHeader'
import StaffLayout from '../../../layout/StaffLayout'
import useCustomerManagement from '../../../hooks/useCustomerManagement'

function RegisterCustomerPage() {
  const {
    formValues,
    formErrors,
    isSubmitting,
    onFormValueChange,
    submitRegistration,
  } = useCustomerManagement()

  const fieldClassName = (field) =>
    `h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 ${
      formErrors[field] ? 'border-red-400' : 'border-slate-200'
    }`

  const vehiclePreviewUrl = useMemo(
    () => (formValues.vehicleImageFile ? URL.createObjectURL(formValues.vehicleImageFile) : null),
    [formValues.vehicleImageFile],
  )

  useEffect(() => {
    return () => {
      if (vehiclePreviewUrl) {
        URL.revokeObjectURL(vehiclePreviewUrl)
      }
    }
  }, [vehiclePreviewUrl])

  return (
    <StaffLayout mainClassName="ml-64 min-h-screen bg-slate-50 px-6 pb-20 pt-24 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Register Customer"
          subtitle="Create a customer profile and save one vehicle in a quick, clean workflow."
          actions={
            <Link
              to="/staff/customer-search"
              className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              View Customers
            </Link>
          }
        />

        <form className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" onSubmit={submitRegistration}>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Customer Information</h2>
              <p className="mt-1 text-sm text-slate-500">Basic contact details for the customer profile.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Full Name</label>
                <input className={fieldClassName('name')} placeholder="Enter customer name" type="text" value={formValues.name} onChange={onFormValueChange('name')} />
                {formErrors.name ? <p className="mt-2 text-xs text-red-500">{formErrors.name}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</label>
                <input className={fieldClassName('email')} placeholder="name@example.com" type="email" value={formValues.email} onChange={onFormValueChange('email')} />
                {formErrors.email ? <p className="mt-2 text-xs text-red-500">{formErrors.email}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Phone</label>
                <input className={fieldClassName('phone')} placeholder="9800000000" type="tel" value={formValues.phone} onChange={onFormValueChange('phone')} />
                {formErrors.phone ? <p className="mt-2 text-xs text-red-500">{formErrors.phone}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Address</label>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                  placeholder="Optional address"
                  rows="4"
                  value={formValues.address}
                  onChange={onFormValueChange('address')}
                ></textarea>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Vehicle Details</h2>
              <p className="mt-1 text-sm text-slate-500">Register one vehicle with the customer profile.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Plate Number</label>
                <input className={`${fieldClassName('plateNumber')} font-mono`} placeholder="BA-2-CHA-1234" type="text" value={formValues.plateNumber} onChange={onFormValueChange('plateNumber')} />
                {formErrors.plateNumber ? <p className="mt-2 text-xs text-red-500">{formErrors.plateNumber}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Brand</label>
                <input className={fieldClassName('make')} placeholder="Toyota" type="text" value={formValues.make} onChange={onFormValueChange('make')} />
                {formErrors.make ? <p className="mt-2 text-xs text-red-500">{formErrors.make}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Model</label>
                <input className={fieldClassName('model')} placeholder="Corolla" type="text" value={formValues.model} onChange={onFormValueChange('model')} />
                {formErrors.model ? <p className="mt-2 text-xs text-red-500">{formErrors.model}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Category</label>
                <select className={fieldClassName('category')} value={formValues.category} onChange={onFormValueChange('category')}>
                  <option value="">Select category</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="car">Car</option>
                </select>
                {formErrors.category ? <p className="mt-2 text-xs text-red-500">{formErrors.category}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Year</label>
                <input className={fieldClassName('year')} placeholder="2024" type="number" value={formValues.year} onChange={onFormValueChange('year')} />
                {formErrors.year ? <p className="mt-2 text-xs text-red-500">{formErrors.year}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vehicle Image</label>
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                    formErrors.vehicleImageFile
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Upload Image</p>
                    <p className="truncate text-xs text-slate-500">
                      {formValues.vehicleImageFile ? formValues.vehicleImageFile.name : 'JPG, PNG, or WEBP up to 5MB'}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary">Choose File</span>
                  <input
                    className="hidden"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={onFormValueChange('vehicleImageFile')}
                  />
                </label>
                {formValues.vehicleImageFile ? (
                  <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                    <img
                      src={vehiclePreviewUrl}
                      alt="Vehicle preview"
                      className="h-28 w-full rounded-md object-cover"
                    />
                  </div>
                ) : null}
                {formErrors.vehicleImageFile ? <p className="mt-2 text-xs text-red-500">{formErrors.vehicleImageFile}</p> : null}
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Quick summary</p>
              <p className="mt-2 text-sm text-slate-500">
                This will create one customer profile and attach one vehicle in a single submission.
              </p>
            </div>

            <button
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Customer'}
            </button>
          </section>
        </form>
      </div>
    </StaffLayout>
  )
}

export default RegisterCustomerPage

