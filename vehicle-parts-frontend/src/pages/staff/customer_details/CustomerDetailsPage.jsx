import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCustomerById } from '../../../api/customerApi'
import { getCustomerPurchaseHistoryById } from '../../../api/historyApi'
import PageHeader from '../../../components/common/PageHeader'
import { toastService } from '../../../services/toastService'
import StaffLayout from '../../../layout/StaffLayout'

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function CustomerDetailsPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState(null)
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true)
        const [data, purchaseData] = await Promise.all([
          getCustomerById(id),
          getCustomerPurchaseHistoryById(id),
        ])
        setDetail(data)
        setPurchaseHistory(Array.isArray(purchaseData?.items) ? purchaseData.items : [])
      } catch (error) {
        toastService.error(error.message || 'Failed to load customer details.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadDetail()
    }
  }, [id])

  const vehicles = detail?.vehicles || []
  const serviceHistory = detail?.history || []
  const orderHistory = purchaseHistory.filter((item) => String(item.historyType || '').toLowerCase() === 'purchase')

  const customer = useMemo(() => detail?.user || {}, [detail])
  const customerAvatar =
    customer.profileImageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || customer.userName || 'Customer')}&background=0D8ABC&color=fff`

  return (
    <StaffLayout mainClassName="ml-64 min-h-screen bg-slate-50 px-6 pb-20 pt-24 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader
          title="Customer Details"
          subtitle="Review profile, vehicles, and history in one clean view."
          actions={
            <Link
              to="/staff/customer-search"
              className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to Customers
            </Link>
          }
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer</p>
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={customerAvatar}
                  alt={customer.name || customer.userName || 'Customer'}
                  className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200"
                  onError={(event) => {
                    event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || customer.userName || 'Customer')}&background=0D8ABC&color=fff`
                  }}
                />
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900">
                    {loading ? 'Loading...' : customer.name || customer.userName || 'Customer'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{customer.email || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Phone</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{customer.phoneNumber || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{customer.role || 'Customer'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vehicles</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{vehicles.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Registration Date</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{formatDate(customer.createdAtUtc)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Registered Vehicles</h3>
              <span className="text-xs text-slate-500">{vehicles.length} total</span>
            </div>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading vehicles...</p>
              ) : vehicles.length ? (
                vehicles.map((vehicle) => (
                  <div key={vehicle.vehicleId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={vehicle.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(vehicle.brand || 'Vehicle')}&background=E2E8F0&color=334155`}
                          alt={`${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle'}
                          className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200"
                          onError={(event) => {
                            event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vehicle.brand || 'Vehicle')}&background=E2E8F0&color=334155`
                          }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{vehicle.brand} {vehicle.model}</p>
                          <p className="mt-1 text-sm text-slate-500">Plate: {vehicle.vehicleNumber}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{vehicle.category || 'Vehicle'}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        {vehicle.year}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No vehicles registered yet.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Service History</h3>
                <span className="text-xs text-slate-500">{serviceHistory.length} records</span>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500">Loading service history...</p>
                ) : serviceHistory.length ? (
                  serviceHistory.map((history) => (
                    <div key={history.serviceHistoryId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{history.historyType}</p>
                          <p className="mt-1 text-sm text-slate-500">{history.description}</p>
                          {history.referenceNumber ? (
                            <p className="mt-2 text-xs text-slate-500">Ref: {history.referenceNumber}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{formatDate(history.eventDateUtc)}</p>
                          {history.amount !== null && history.amount !== undefined ? (
                            <p className="mt-1 text-sm font-semibold text-slate-900">Rs. {history.amount}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    No service history available yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Purchase History</h3>
                <span className="text-xs text-slate-500">{orderHistory.length} records</span>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500">Loading purchase history...</p>
                ) : orderHistory.length ? (
                  orderHistory.map((order) => (
                    <div key={`${order.historyId}-${order.referenceNumber || ''}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{order.description || 'Invoice line item'}</p>
                          <p className="mt-1 text-sm text-slate-500">Invoice: {order.referenceNumber || 'N/A'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Qty: {order.quantity ?? '-'} • Unit: Rs. {Number(order.unitPrice || 0).toFixed(2)}
                          </p>
                          {Number(order.discount || 0) > 0 ? (
                            <span className="mt-2 inline-flex rounded-full bg-teal-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                              Loyalty Discount Applied
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{formatDate(order.eventDateUtc)}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">Rs. {Number(order.amount || 0).toFixed(2)}</p>
                          <p className="mt-1 text-xs text-slate-500">{order.paymentStatus || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    No order history available yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </StaffLayout>
  )
}

export default CustomerDetailsPage
