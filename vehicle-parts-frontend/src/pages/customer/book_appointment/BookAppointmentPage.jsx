import { useEffect, useMemo, useState } from 'react'
import { createAppointment } from '../../../api/appointmentApi'
import { getMyVehicles } from '../../../api/vehicleApi'
import CustomerLayout from '../../../layout/CustomerLayout'
import { toastService } from '../../../services/toastService'

const SERVICE_OPTIONS = [
  { id: 'full-maintenance', name: 'Full Maintenance', description: 'Oil change, filters, and fluid check.', price: 149 },
  { id: 'tire-service', name: 'Tire Service', description: 'Rotation, balance, and alignment check.', price: 89 },
  { id: 'battery-diagnostics', name: 'Battery Diagnostics', description: 'Battery and charging system health check.', price: 115 },
  { id: 'general-inspection', name: 'General Inspection', description: 'Comprehensive 50-point inspection.', price: 50 },
]

function BookAppointmentPage() {
  const [vehicles, setVehicles] = useState([])
  const [vehicleId, setVehicleId] = useState('')
  const [serviceType, setServiceType] = useState(SERVICE_OPTIONS[0].name)
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await getMyVehicles()
        const list = Array.isArray(data) ? data : []
        setVehicles(list)
        if (list.length) {
          setVehicleId(String(list[0].vehicleId))
        }
      } catch (error) {
        toastService.error(error.message || 'Failed to load your vehicles.')
      } finally {
        setLoadingVehicles(false)
      }
    }

    loadVehicles()
  }, [])

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => String(vehicle.vehicleId) === String(vehicleId)) || null,
    [vehicles, vehicleId],
  )

  const selectedService = useMemo(
    () => SERVICE_OPTIONS.find((service) => service.name === serviceType) || SERVICE_OPTIONS[0],
    [serviceType],
  )

  const onSubmit = async (event) => {
    event.preventDefault()

    if (!vehicleId) {
      toastService.error('Please select a vehicle.')
      return
    }

    if (!date) {
      toastService.error('Please select appointment date and time.')
      return
    }

    const appointmentDate = new Date(date)
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
      toastService.error('Please select a valid future date and time.')
      return
    }

    try {
      setIsSubmitting(true)
      await createAppointment({
        vehicleId: Number(vehicleId),
        date: appointmentDate.toISOString(),
        serviceType,
        notes: notes.trim() || null,
      })
      toastService.success('Appointment booked successfully.')
      setNotes('')
      setDate('')
    } catch (error) {
      toastService.error(error.message || 'Failed to book appointment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerLayout>
      <div className="p-6 lg:p-10 w-full pb-24 lg:pb-10">
        <div className="w-full">
          <header className="mb-10">
            <h1 className="text-5xl font-black tracking-tight text-on-surface mb-2">Book Appointment</h1>
            <p className="text-body-base text-on-surface-variant max-w-2xl">
              Schedule your vehicle service in a few steps and confirm your preferred time slot.
            </p>
          </header>

          <form className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start" onSubmit={onSubmit}>
            <div className="lg:col-span-2 space-y-lg">
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-lg">
                <h2 className="font-h2 text-primary mb-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">directions_car</span>
                  Select Your Vehicle
                </h2>

                {loadingVehicles ? (
                  <p className="text-sm text-slate-500">Loading your vehicles...</p>
                ) : vehicles.length === 0 ? (
                  <p className="text-sm text-red-600">No registered vehicle found. Please contact staff to add your vehicle first.</p>
                ) : (
                  <div className="space-y-md">
                    <label className="block text-body-sm font-bold text-on-surface-variant">Choose registered vehicle</label>
                    <div className="relative">
                      <select
                        className="w-full h-11 px-4 bg-background border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none text-body-base"
                        value={vehicleId}
                        onChange={(event) => setVehicleId(event.target.value)}
                      >
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                            {vehicle.year} {vehicle.brand} {vehicle.model} ({vehicle.vehicleNumber})
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-outline">expand_more</span>
                    </div>
                    {selectedVehicle ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md p-md bg-surface-container-low rounded-lg border border-outline-variant/30">
                        <div>
                          <p className="text-[10px] uppercase text-outline font-bold">Vehicle ID</p>
                          <p className="text-body-sm font-medium">#{selectedVehicle.vehicleId}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-outline font-bold">Category</p>
                          <p className="text-body-sm font-medium">{selectedVehicle.category || 'N/A'}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-lg">
                <h2 className="font-h3 text-on-surface mb-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">build</span>
                  Choose Service Type
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  {SERVICE_OPTIONS.map((service) => {
                    const isSelected = service.name === serviceType
                    return (
                      <button
                        key={service.id}
                        type="button"
                        className={`text-left rounded-xl p-md transition-all border ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary'
                        }`}
                        onClick={() => setServiceType(service.name)}
                      >
                        <h4 className="font-bold text-body-base">{service.name}</h4>
                        <p className="text-body-sm text-on-surface-variant">{service.description}</p>
                        <p className="mt-2 text-primary font-bold">Rs. {service.price}</p>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-lg space-y-md">
                <h2 className="font-h3 text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined">calendar_month</span>
                  Select Date & Time
                </h2>
                <input
                  className="w-full h-11 px-4 bg-background border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  type="datetime-local"
                  min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
                <textarea
                  className="w-full min-h-24 px-4 py-3 bg-background border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Additional notes (optional)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                />
              </section>

              <div className="flex justify-end">
                <button
                  className="px-10 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                  type="submit"
                  disabled={isSubmitting || loadingVehicles || vehicles.length === 0}
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-lg sticky top-24">
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="bg-indigo-900 px-lg py-md">
                  <h3 className="text-white font-bold text-body-base">Booking Summary</h3>
                </div>
                <div className="p-lg space-y-md text-sm">
                  <p><strong>Vehicle:</strong> {selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.brand} ${selectedVehicle.model}` : 'Not selected'}</p>
                  <p><strong>Plate:</strong> {selectedVehicle?.vehicleNumber || 'N/A'}</p>
                  <p><strong>Service:</strong> {serviceType}</p>
                  <p><strong>Date:</strong> {date ? new Date(date).toLocaleString() : 'Not selected'}</p>
                  <p><strong>Estimated Total:</strong> Rs. {selectedService.price}</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default BookAppointmentPage
