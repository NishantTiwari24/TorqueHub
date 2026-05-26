import { useEffect, useMemo, useState } from 'react'
import { createPartRequest, deletePartRequest, getMyPartRequests } from '../../../api/partRequestApi'
import { getMyVehicles } from '../../../api/vehicleApi'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import CustomerLayout from '../../../layout/CustomerLayout'
import { toastService } from '../../../services/toastService'

const initialForm = {
  vehicleId: '',
  partName: '',
  quantity: '1',
  description: '',
}

function RequestPartPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [requests, setRequests] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [vehicleLoadError, setVehicleLoadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [requestToCancel, setRequestToCancel] = useState(null)

  useEffect(() => {
    void loadRequests()
    void loadVehicles()
  }, [])

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((first, second) => {
        const firstDate = new Date(first.requestedAtUtc).getTime()
        const secondDate = new Date(second.requestedAtUtc).getTime()
        return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate)
      }),
    [requests],
  )

  const pendingCount = requests.filter((request) => isPending(request.status)).length

  async function loadRequests() {
    try {
      setLoading(true)
      setLoadError('')
      const data = await getMyPartRequests()
      setRequests(Array.isArray(data) ? data : [])
    } catch (error) {
      const message = error.message || 'Failed to load part requests.'
      setLoadError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function loadVehicles() {
    try {
      setVehiclesLoading(true)
      setVehicleLoadError('')
      const data = await getMyVehicles()
      setVehicles(Array.isArray(data) ? data.map(normalizeVehicle) : [])
    } catch (error) {
      const message = error.message || 'Failed to load your vehicles.'
      setVehicleLoadError(message)
      toastService.error(message)
    } finally {
      setVehiclesLoading(false)
    }
  }

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSuccessMessage('')
  }

  const validateForm = () => {
    const nextErrors = {}
    const partName = form.partName.trim()
    const quantity = Number(form.quantity)
    const vehicleId = form.vehicleId.trim() ? Number(form.vehicleId) : null

    if (!partName) {
      nextErrors.partName = 'Part name is required.'
    } else if (partName.length > 100) {
      nextErrors.partName = 'Part name must be 100 characters or fewer.'
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      nextErrors.quantity = 'Quantity must be at least 1.'
    }

    if (vehicleId !== null && (!Number.isInteger(vehicleId) || vehicleId < 1 || !vehicles.some((vehicle) => vehicle.vehicleId === vehicleId))) {
      nextErrors.vehicleId = 'Choose one of your registered vehicles.'
    }

    if (form.description.length > 500) {
      nextErrors.description = 'Description must be 500 characters or fewer.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) {
      toastService.error('Please fix the highlighted fields.')
      return
    }

    const vehicleId = form.vehicleId.trim() ? Number(form.vehicleId) : null

    try {
      setIsSubmitting(true)
      const createdRequest = await createPartRequest({
        vehicleId,
        partName: form.partName.trim(),
        quantity: Number(form.quantity),
        description: form.description.trim(),
      })

      setRequests((current) => [createdRequest, ...current])
      setForm(initialForm)
      setErrors({})
      setSuccessMessage('Part request submitted successfully.')
      toastService.success('Part request submitted successfully.')
    } catch (error) {
      toastService.error(error.message || 'Failed to submit part request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!requestToCancel) return
    try {
      setActionId(requestToCancel.partRequestId)
      await deletePartRequest(requestToCancel.partRequestId)
      setRequests((current) => current.filter((item) => item.partRequestId !== requestToCancel.partRequestId))
      toastService.success('Part request cancelled successfully.')
      setRequestToCancel(null)
    } catch (error) {
      toastService.error(error.message || 'Failed to cancel part request.')
    } finally {
      setActionId(null)
    }
  }

  const fieldClassName = (field) =>
    `w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 ${
      errors[field] ? 'border-red-400' : 'border-slate-200'
    }`

  return (
    <CustomerLayout>
      <div className="w-full p-6 pb-24 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-5xl font-black tracking-tight text-on-surface">Request Part</h1>
              <p className="mt-2 max-w-3xl text-body-base text-on-surface-variant">
                Cannot find a specific component? Submit an unavailable part request and track staff updates here.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Pending Requests</p>
              <p className="mt-1 text-2xl font-black text-primary">{pendingCount}</p>
            </div>
          </header>

          {successMessage ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">build_circle</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Request Specification</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Use only the fields supported by the backend request DTO.
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Part Name
                    </label>
                    <input
                      className={`${fieldClassName('partName')} h-12`}
                      maxLength="100"
                      placeholder="Example: brake caliper"
                      type="text"
                      value={form.partName}
                      onChange={handleChange('partName')}
                    />
                    {errors.partName ? <p className="mt-2 text-xs text-red-500">{errors.partName}</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Quantity
                    </label>
                    <input
                      className={`${fieldClassName('quantity')} h-12`}
                      min="1"
                      type="number"
                      value={form.quantity}
                      onChange={handleChange('quantity')}
                    />
                    {errors.quantity ? <p className="mt-2 text-xs text-red-500">{errors.quantity}</p> : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Vehicle Optional
                    </label>
                    <select
                      className={`${fieldClassName('vehicleId')} h-12 disabled:cursor-not-allowed disabled:opacity-70`}
                      disabled={vehiclesLoading}
                      value={form.vehicleId}
                      onChange={handleChange('vehicleId')}
                    >
                      <option value="">
                        {vehiclesLoading ? 'Loading your vehicles...' : 'No vehicle attached'}
                      </option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                          {formatVehicleOption(vehicle)}
                        </option>
                      ))}
                    </select>
                    {errors.vehicleId ? <p className="mt-2 text-xs text-red-500">{errors.vehicleId}</p> : null}
                    {vehicleLoadError ? <p className="mt-2 text-xs text-red-500">{vehicleLoadError}</p> : null}
                    {!vehiclesLoading && !vehicleLoadError && vehicles.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No registered vehicles found. You can still submit without attaching a vehicle.</p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Description and Technical Details
                      </label>
                      <span className="text-xs text-slate-400">{form.description.length}/500</span>
                    </div>
                    <textarea
                      className={`${fieldClassName('description')} min-h-[130px] resize-y py-3`}
                      maxLength="500"
                      placeholder="Describe model compatibility, dimensions, material, or urgency."
                      rows="5"
                      value={form.description}
                      onChange={handleChange('description')}
                    ></textarea>
                    {errors.description ? <p className="mt-2 text-xs text-red-500">{errors.description}</p> : null}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    type="button"
                    onClick={() => {
                      setForm(initialForm)
                      setErrors({})
                      setSuccessMessage('')
                    }}
                  >
                    Clear
                  </button>
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                <h2 className="text-xl font-bold">Request Status Flow</h2>
                <div className="mt-5 space-y-4">
                  <StatusStep icon="pending_actions" title="Pending" text="Your request is waiting for staff review." />
                  <StatusStep icon="manage_search" title="Sourcing" text="Staff can update status after checking availability." />
                  <StatusStep icon="fact_check" title="Resolved" text="Final status appears in your request history." />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Submission Tips</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-500">
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                    Include the exact part name or part number when possible.
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                    Choose a registered vehicle when the part request is vehicle-specific.
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                    Pending requests can be cancelled from the list below.
                  </li>
                </ul>
              </section>
            </aside>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Requests</h2>
                <p className="mt-1 text-sm text-slate-500">Track unavailable part requests submitted from your customer account.</p>
              </div>
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={loading}
                onClick={() => void loadRequests()}
              >
                Refresh
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <LoadingState />
              ) : loadError ? (
                <ErrorState message={loadError} onRetry={() => void loadRequests()} />
              ) : sortedRequests.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[840px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Part</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Vehicle</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Requested</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedRequests.map((request) => (
                        <PartRequestRow
                          key={request.partRequestId}
                          request={request}
                          isBusy={actionId === request.partRequestId}
                          onDelete={() => setRequestToCancel(request)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <ConfirmDialog
        isOpen={Boolean(requestToCancel)}
        title="Cancel Request"
        message="Cancel this pending part request?"
        confirmLabel="Cancel Request"
        cancelLabel="Keep Request"
        confirmVariant="danger"
        isLoading={Boolean(requestToCancel && actionId === requestToCancel.partRequestId)}
        onCancel={() => setRequestToCancel(null)}
        onConfirm={() => void handleDelete()}
      />
    </CustomerLayout>
  )
}

function PartRequestRow({ request, isBusy, onDelete }) {
  const canDelete = isPending(request.status)

  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-4 align-top">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined">settings_input_component</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{request.partName}</p>
            <p className="mt-1 text-sm text-slate-500">Qty: {request.quantity}</p>
            {request.description ? <p className="mt-2 max-w-md text-sm text-slate-500">{request.description}</p> : null}
            {request.staffNotes ? (
              <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                Staff note: {request.staffNotes}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-500">
        {request.vehicleName || (request.vehicleId ? `Vehicle ID #${request.vehicleId}` : 'Not attached')}
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-500">{formatDate(request.requestedAtUtc)}</td>
      <td className="px-4 py-4 align-top">
        <div className="flex justify-center">
          <StatusBadge status={request.status} />
        </div>
      </td>
      <td className="px-4 py-4 align-top text-right">
        <button
          className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-error transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!canDelete || isBusy}
          onClick={onDelete}
        >
          {isBusy ? 'Cancelling...' : 'Cancel'}
        </button>
      </td>
    </tr>
  )
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toLowerCase()
  const className =
    normalizedStatus === 'approved' || normalizedStatus === 'fulfilled' || normalizedStatus === 'completed'
      ? 'bg-green-100 text-green-700'
      : normalizedStatus === 'rejected' || normalizedStatus === 'cancelled'
        ? 'bg-error-container text-error'
        : normalizedStatus === 'sourcing' || normalizedStatus === 'in progress'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700'

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {status || 'Pending'}
    </span>
  )
}

function StatusStep({ icon, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-teal-300">
        <span className="material-symbols-outlined text-base">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-sm text-slate-300">{text}</p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-700">Loading part requests...</p>
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

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-lg font-bold text-slate-900">No part requests yet</p>
      <p className="mt-2 text-sm text-slate-500">Submit your first unavailable part request using the form above.</p>
    </div>
  )
}

function isPending(status) {
  return String(status || '').toLowerCase() === 'pending'
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function normalizeVehicle(vehicle) {
  return {
    vehicleId: vehicle.vehicleId ?? vehicle.VehicleId ?? 0,
    vehicleNumber: vehicle.vehicleNumber ?? vehicle.VehicleNumber ?? '',
    brand: vehicle.brand ?? vehicle.Brand ?? '',
    model: vehicle.model ?? vehicle.Model ?? '',
    category: vehicle.category ?? vehicle.Category ?? '',
    year: vehicle.year ?? vehicle.Year ?? '',
  }
}

function formatVehicleOption(vehicle) {
  const name = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Registered vehicle'
  const meta = [vehicle.vehicleNumber, vehicle.year].filter(Boolean).join(' | ')
  return meta ? `${name} (${meta})` : name
}

export default RequestPartPage
