import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelAppointment, getMyAppointments, rescheduleAppointment } from '../../../api/appointmentApi'
import CustomerLayout from '../../../layout/CustomerLayout'
import { toastService } from '../../../services/toastService'

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'scheduled'])

function toDateTimeLocalValue(value) {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000)
  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function CustomerAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')
  const [actionId, setActionId] = useState(null)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')

  useEffect(() => {
    void loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getMyAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (loadError) {
      const message = loadError.message || 'Failed to load appointments.'
      setError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  const groupedAppointments = useMemo(() => {
    const now = new Date()
    const upcoming = []
    const past = []

    appointments.forEach((appointment) => {
      const date = new Date(appointment.date)
      const status = String(appointment.status || '').toLowerCase()
      const isUpcoming = ACTIVE_STATUSES.has(status) && !Number.isNaN(date.getTime()) && date >= now

      if (isUpcoming) {
        upcoming.push(appointment)
      } else {
        past.push(appointment)
      }
    })

    return {
      upcoming,
      past,
    }
  }, [appointments])

  const visibleAppointments = groupedAppointments[activeTab]

  const handleCancel = async (appointment) => {
    if (!window.confirm('Cancel this appointment?')) return

    try {
      setActionId(appointment.appointmentId)
      const updated = await cancelAppointment(appointment.appointmentId)
      setAppointments((current) => current.map((item) => (item.appointmentId === updated.appointmentId ? updated : item)))
      toastService.success('Appointment cancelled successfully.')
    } catch (cancelError) {
      toastService.error(cancelError.message || 'Failed to cancel appointment.')
    } finally {
      setActionId(null)
    }
  }

  const startReschedule = (appointment) => {
    setRescheduleId(appointment.appointmentId)
    setRescheduleDate(toDateTimeLocalValue(appointment.date))
  }

  const handleReschedule = async (appointment) => {
    const nextDate = new Date(rescheduleDate)
    if (!rescheduleDate || Number.isNaN(nextDate.getTime()) || nextDate <= new Date()) {
      toastService.error('Choose a valid future date and time.')
      return
    }

    try {
      setActionId(appointment.appointmentId)
      const updated = await rescheduleAppointment(appointment.appointmentId, {
        date: nextDate.toISOString(),
      })
      setAppointments((current) => current.map((item) => (item.appointmentId === updated.appointmentId ? updated : item)))
      setRescheduleId(null)
      setRescheduleDate('')
      toastService.success('Appointment rescheduled successfully.')
    } catch (rescheduleError) {
      toastService.error(rescheduleError.message || 'Failed to reschedule appointment.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <CustomerLayout>
      <div className="w-full p-6 pb-24 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-5xl font-black tracking-tight text-on-surface">My Appointments</h1>
              <p className="mt-2 text-body-base text-on-surface-variant">Manage your vehicle service schedule from your customer account.</p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
              to="/customer/book-appointment"
            >
              Book Appointment
            </Link>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex border-b border-slate-200">
              <TabButton active={activeTab === 'upcoming'} count={groupedAppointments.upcoming.length} label="Upcoming" onClick={() => setActiveTab('upcoming')} />
              <TabButton active={activeTab === 'past'} count={groupedAppointments.past.length} label="Past" onClick={() => setActiveTab('past')} />
            </div>

            <div className="p-6">
              {loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} onRetry={() => void loadAppointments()} />
              ) : visibleAppointments.length === 0 ? (
                <EmptyState activeTab={activeTab} />
              ) : (
                <div className="space-y-4">
                  {visibleAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.appointmentId}
                      appointment={appointment}
                      actionId={actionId}
                      isRescheduling={rescheduleId === appointment.appointmentId}
                      rescheduleDate={rescheduleDate}
                      onCancel={() => void handleCancel(appointment)}
                      onStartReschedule={() => startReschedule(appointment)}
                      onRescheduleDateChange={setRescheduleDate}
                      onSubmitReschedule={() => void handleReschedule(appointment)}
                      onCloseReschedule={() => {
                        setRescheduleId(null)
                        setRescheduleDate('')
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </CustomerLayout>
  )
}

function TabButton({ active, count, label, onClick }) {
  return (
    <button
      className={`inline-flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-semibold transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-slate-500 hover:text-slate-900'
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-primary-container text-on-primary-container' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  )
}

function AppointmentCard({
  appointment,
  actionId,
  isRescheduling,
  rescheduleDate,
  onCancel,
  onStartReschedule,
  onRescheduleDateChange,
  onSubmitReschedule,
  onCloseReschedule,
}) {
  const date = new Date(appointment.date)
  const canModify = canModifyAppointment(appointment)
  const isBusy = actionId === appointment.appointmentId

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <DateBadge date={date} />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{appointment.vehicleName || 'Vehicle appointment'}</h2>
              <StatusBadge status={appointment.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base">directions_car</span>
                {appointment.vehicleNumber || `Vehicle ID #${appointment.vehicleId}`}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base">schedule</span>
                {formatDateTime(appointment.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base">build</span>
                {appointment.serviceType || 'General service'}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base">tag</span>
                Appointment #{appointment.appointmentId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg border border-secondary px-4 text-sm font-semibold text-secondary transition-colors hover:bg-secondary-fixed disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!canModify || isBusy}
            onClick={onStartReschedule}
          >
            Reschedule
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-error transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!canModify || isBusy}
            onClick={onCancel}
          >
            {isBusy ? 'Working...' : 'Cancel'}
          </button>
        </div>
      </div>

      {isRescheduling ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            New Date and Time
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              min={toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000))}
              type="datetime-local"
              value={rescheduleDate}
              onChange={(event) => onRescheduleDateChange(event.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={isBusy}
                onClick={onSubmitReschedule}
              >
                Save
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                type="button"
                onClick={onCloseReschedule}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function DateBadge({ date }) {
  if (Number.isNaN(date.getTime())) {
    return (
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
        <span className="text-xs font-bold uppercase text-slate-400">N/A</span>
      </div>
    )
  }

  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
      <span className="text-[10px] font-bold uppercase text-slate-500">{date.toLocaleString(undefined, { month: 'short' })}</span>
      <span className="text-2xl font-black leading-none text-primary">{date.getDate()}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toLowerCase()
  const className =
    normalizedStatus === 'cancelled'
      ? 'bg-error-container text-error'
      : normalizedStatus === 'completed'
        ? 'bg-green-100 text-green-700'
        : normalizedStatus === 'confirmed'
          ? 'bg-primary-container text-on-primary-container'
          : 'bg-slate-200 text-slate-700'

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {status || 'Pending'}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-700">Loading appointments...</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{message}</p>
      <button className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm" type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function EmptyState({ activeTab }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-lg font-bold text-slate-900">
        {activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {activeTab === 'upcoming'
          ? 'Book a new service appointment when your vehicle needs attention.'
          : 'Completed and cancelled appointments will appear here.'}
      </p>
    </div>
  )
}

function canModifyAppointment(appointment) {
  const status = String(appointment.status || '').toLowerCase()
  const date = new Date(appointment.date)

  return ACTIVE_STATUSES.has(status) && !Number.isNaN(date.getTime()) && date > new Date()
}

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default CustomerAppointmentsPage
