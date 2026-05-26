import { useEffect, useMemo, useState } from 'react'
import { getAllAppointments, updateAppointmentStatus } from '../../../api/appointmentApi'
import StaffLayout from '../../../layout/StaffLayout'
import { toastService } from '../../../services/toastService'

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'InService', label: 'In Service' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [actionId, setActionId] = useState(null)
  const [editState, setEditState] = useState({
    appointmentId: null,
    status: 'Pending',
  })

  useEffect(() => {
    void loadAppointments()
  }, [])

  async function loadAppointments() {
    try {
      setLoading(true)
      setError('')
      const data = await getAllAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (loadError) {
      const message = loadError.message || 'Failed to load appointments.'
      setError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    if (activeStatus === 'All') return sorted
    return sorted.filter((appointment) => normalize(appointment.status) === normalize(activeStatus))
  }, [activeStatus, appointments])

  const counts = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((appointment) => normalize(appointment.status) === 'pending').length,
      active: appointments.filter((appointment) => ['confirmed', 'inservice'].includes(normalize(appointment.status))).length,
      completed: appointments.filter((appointment) => normalize(appointment.status) === 'completed').length,
    }
  }, [appointments])

  const beginEdit = (appointment) => {
    setEditState({
      appointmentId: appointment.appointmentId,
      status: appointment.status || 'Pending',
    })
  }

  const cancelEdit = () => {
    setEditState({
      appointmentId: null,
      status: 'Pending',
    })
  }

  const saveStatus = async () => {
    if (!editState.appointmentId) return

    const currentAppointment = appointments.find((appointment) => appointment.appointmentId === editState.appointmentId)
    const isCompletionTransition = editState.status === 'Completed' && normalize(currentAppointment?.status) !== 'completed'

    try {
      setActionId(editState.appointmentId)
      const updated = await updateAppointmentStatus(editState.appointmentId, {
        status: editState.status,
      })
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.appointmentId === editState.appointmentId ? updated : appointment,
        ),
      )
      toastService.success(
        isCompletionTransition
          ? 'Appointment completed. Customer notification has been sent.'
          : 'Appointment status updated successfully.',
      )
      cancelEdit()
    } catch (updateError) {
      toastService.error(updateError.message || 'Failed to update appointment status.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <StaffLayout>
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-on-surface">Appointments</h1>
            <p className="mt-2 text-body-base text-on-surface-variant">
              Review booked services and update the service status for each customer appointment.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            disabled={loading}
            onClick={() => void loadAppointments()}
          >
            Refresh
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Total Bookings" value={counts.total} />
          <SummaryCard label="Pending" value={counts.pending} />
          <SummaryCard label="In Progress" value={counts.active} />
          <SummaryCard label="Completed" value={counts.completed} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-6 py-4">
            {['All', ...STATUS_OPTIONS.map((status) => status.value)].map((status) => (
              <button
                key={status}
                className={`h-9 rounded-full px-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeStatus === status
                    ? 'bg-primary text-on-primary'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                type="button"
                onClick={() => setActiveStatus(status)}
              >
                {status === 'All' ? 'All' : formatStatus(status)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <StateMessage message="Loading appointments..." />
            ) : error ? (
              <ErrorState message={error} onRetry={() => void loadAppointments()} />
            ) : filteredAppointments.length === 0 ? (
              <StateMessage message="No matching appointments found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Schedule</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Customer</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Vehicle</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Service</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((appointment) => {
                      const isEditing = editState.appointmentId === appointment.appointmentId
                      const isBusy = actionId === appointment.appointmentId
                      const isUnchanged = normalize(editState.status) === normalize(appointment.status)
                      return (
                        <tr key={appointment.appointmentId} className="align-top hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{formatDateTime(appointment.date)}</p>
                            <p className="text-xs text-slate-500">Appointment #{appointment.appointmentId}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{appointment.customerName || `Customer #${appointment.userId}`}</p>
                            <p className="text-xs text-slate-500">{appointment.customerEmail || `ID #${appointment.userId}`}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{appointment.vehicleName || 'Vehicle appointment'}</p>
                            <p className="text-xs text-slate-500">{appointment.vehicleNumber || `Vehicle ID #${appointment.vehicleId}`}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{appointment.serviceType || 'General service'}</p>
                            {appointment.notes ? <p className="mt-1 max-w-xs text-xs text-slate-500">{appointment.notes}</p> : null}
                          </td>
                          <td className="px-4 py-4">
                            {isEditing ? (
                              <select
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
                                value={editState.status}
                                onChange={(event) => setEditState((current) => ({ ...current, status: event.target.value }))}
                              >
                                {STATUS_OPTIONS.map((statusOption) => (
                                  <option key={statusOption.value} value={statusOption.value}>
                                    {statusOption.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <StatusBadge status={appointment.status} />
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                                  type="button"
                                  disabled={isBusy}
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
                                  type="button"
                                  disabled={isBusy || isUnchanged}
                                  onClick={() => void saveStatus()}
                                >
                                  {isBusy ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            ) : (
                              <button
                                className="h-9 rounded-lg border border-primary px-3 text-xs font-semibold text-primary hover:bg-primary/5"
                                type="button"
                                onClick={() => beginEdit(appointment)}
                              >
                                Update
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </StaffLayout>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const normalizedStatus = normalize(status)
  const className =
    normalizedStatus === 'completed'
      ? 'bg-green-100 text-green-700'
      : normalizedStatus === 'cancelled'
        ? 'bg-red-100 text-red-700'
        : normalizedStatus === 'inservice'
          ? 'bg-blue-100 text-blue-700'
          : normalizedStatus === 'confirmed'
            ? 'bg-teal-100 text-teal-700'
            : 'bg-amber-100 text-amber-700'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {formatStatus(status)}
    </span>
  )
}

function StateMessage({ message }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-700">{message}</p>
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

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatStatus(value) {
  const match = STATUS_OPTIONS.find((status) => normalize(status.value) === normalize(value))
  return match?.label || value || 'Pending'
}

function normalize(value) {
  return String(value || '').toLowerCase()
}

export default StaffAppointmentsPage
