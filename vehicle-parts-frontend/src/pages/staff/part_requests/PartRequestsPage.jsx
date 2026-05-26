import { useEffect, useMemo, useState } from 'react'
import { getAllPartRequests, updatePartRequestStatus } from '../../../api/partRequestApi'
import StaffLayout from '../../../layout/StaffLayout'
import { toastService } from '../../../services/toastService'

const STATUS_OPTIONS = ['Pending', 'Sourcing', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled']

function PartRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [actionId, setActionId] = useState(null)
  const [editState, setEditState] = useState({
    partRequestId: null,
    status: 'Pending',
    staffNotes: '',
  })

  useEffect(() => {
    void loadRequests()
  }, [])

  async function loadRequests() {
    try {
      setLoading(true)
      setError('')
      const data = await getAllPartRequests()
      setRequests(Array.isArray(data) ? data : [])
    } catch (loadError) {
      const message = loadError.message || 'Failed to load part requests.'
      setError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = useMemo(() => {
    const sorted = [...requests].sort(
      (a, b) => new Date(b.requestedAtUtc).getTime() - new Date(a.requestedAtUtc).getTime(),
    )
    if (activeStatus === 'All') return sorted
    return sorted.filter((request) => String(request.status || '').toLowerCase() === activeStatus.toLowerCase())
  }, [requests, activeStatus])

  const counts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((request) => normalize(request.status) === 'pending').length,
      sourcing: requests.filter((request) => normalize(request.status) === 'sourcing').length,
      resolved: requests.filter((request) => ['fulfilled', 'approved', 'rejected', 'cancelled'].includes(normalize(request.status))).length,
    }
  }, [requests])

  const beginEdit = (request) => {
    setEditState({
      partRequestId: request.partRequestId,
      status: request.status || 'Pending',
      staffNotes: request.staffNotes || '',
    })
  }

  const cancelEdit = () => {
    setEditState({
      partRequestId: null,
      status: 'Pending',
      staffNotes: '',
    })
  }

  const saveUpdate = async () => {
    if (!editState.partRequestId) return

    try {
      setActionId(editState.partRequestId)
      const updated = await updatePartRequestStatus(editState.partRequestId, {
        status: editState.status,
        staffNotes: editState.staffNotes?.trim() || null,
      })
      setRequests((current) =>
        current.map((request) =>
          request.partRequestId === editState.partRequestId ? updated : request,
        ),
      )
      toastService.success('Part request updated successfully.')
      cancelEdit()
    } catch (updateError) {
      toastService.error(updateError.message || 'Failed to update part request.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <StaffLayout>
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-on-surface">Part Requests</h1>
            <p className="mt-2 text-body-base text-on-surface-variant">
              Review customer unavailable-part requests and update response status.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            disabled={loading}
            onClick={() => void loadRequests()}
          >
            Refresh
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Total Requests" value={counts.total} />
          <SummaryCard label="Pending" value={counts.pending} />
          <SummaryCard label="Sourcing" value={counts.sourcing} />
          <SummaryCard label="Resolved" value={counts.resolved} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-6 py-4">
            {['All', ...STATUS_OPTIONS].map((status) => (
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
                {status}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <StateMessage message="Loading part requests..." />
            ) : error ? (
              <ErrorState message={error} onRetry={() => void loadRequests()} />
            ) : filteredRequests.length === 0 ? (
              <StateMessage message="No matching part requests found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Requested</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Customer</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Part</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Vehicle</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((request) => {
                      const isEditing = editState.partRequestId === request.partRequestId
                      const isBusy = actionId === request.partRequestId
                      return (
                        <tr key={request.partRequestId} className="align-top hover:bg-slate-50">
                          <td className="px-4 py-4 text-sm text-slate-500">{formatDateTime(request.requestedAtUtc)}</td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{request.customerName || `Customer #${request.customerId}`}</p>
                            <p className="text-xs text-slate-500">ID #{request.customerId}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{request.partName}</p>
                            <p className="text-xs text-slate-500">Qty: {request.quantity}</p>
                            {request.description ? <p className="mt-1 text-xs text-slate-500">{request.description}</p> : null}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {request.vehicleName || (request.vehicleId ? `Vehicle ID #${request.vehicleId}` : 'Not attached')}
                          </td>
                          <td className="px-4 py-4">
                            {isEditing ? (
                              <div className="space-y-2">
                                <select
                                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
                                  value={editState.status}
                                  onChange={(event) => setEditState((current) => ({ ...current, status: event.target.value }))}
                                >
                                  {STATUS_OPTIONS.map((statusOption) => (
                                    <option key={statusOption} value={statusOption}>
                                      {statusOption}
                                    </option>
                                  ))}
                                </select>
                                <textarea
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                                  maxLength={500}
                                  placeholder="Staff notes (optional)"
                                  rows={3}
                                  value={editState.staffNotes}
                                  onChange={(event) => setEditState((current) => ({ ...current, staffNotes: event.target.value }))}
                                ></textarea>
                              </div>
                            ) : (
                              <div>
                                <StatusBadge status={request.status} />
                                {request.staffNotes ? <p className="mt-2 text-xs text-slate-500">Note: {request.staffNotes}</p> : null}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  type="button"
                                  disabled={isBusy}
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary hover:bg-primary-container disabled:opacity-70"
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void saveUpdate()}
                                >
                                  {isBusy ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            ) : (
                              <button
                                className="h-9 rounded-lg border border-primary px-3 text-xs font-semibold text-primary hover:bg-primary/5"
                                type="button"
                                onClick={() => beginEdit(request)}
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
    normalizedStatus === 'fulfilled' || normalizedStatus === 'approved'
      ? 'bg-green-100 text-green-700'
      : normalizedStatus === 'rejected' || normalizedStatus === 'cancelled'
        ? 'bg-red-100 text-red-700'
        : normalizedStatus === 'sourcing'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {status || 'Pending'}
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

function normalize(value) {
  return String(value || '').toLowerCase()
}

export default PartRequestsPage
