import { Link } from 'react-router-dom'
import PageHeader from '../../../components/common/PageHeader'
import StaffLayout from '../../../layout/StaffLayout'
import useCustomerManagement from '../../../hooks/useCustomerManagement'

function CustomerSearchPage() {
  const {
    customers,
    isLoading,
    searchTerm,
    appliedSearch,
    totalVehicles,
    setSearchTerm,
    runSearch,
    clearSearch,
  } = useCustomerManagement()

  const getCustomerAvatar = (customer) =>
    customer.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'Customer')}&background=0D8ABC&color=fff`

  return (
    <StaffLayout mainClassName="ml-64 min-h-screen bg-slate-50 px-6 pb-20 pt-24 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Customers"
          subtitle="Search customers, review key contact details, and move quickly into registration or follow-up work."
          actions={
            <Link
              to="/staff/register-customer"
              className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              Add Customer
            </Link>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Customers</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{customers.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Registered Vehicles</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{totalVehicles}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visible Results</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{customers.length}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Customer Directory</h2>
            <p className="mt-1 text-sm text-slate-500">Search by name, email, phone number, or customer ID.</p>
          </div>
          <div className="mt-5">
            <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input
                className="h-full flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none"
                placeholder="Search by customer name, email, phone, or ID"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
                <button
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
                  type="button"
                  onClick={() => runSearch(searchTerm)}
                  disabled={isLoading}
                >
                  Search
                </button>
              {searchTerm ? (
                <button
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  type="button"
                  onClick={clearSearch}
                >
                  Clear
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {customers.length} result{customers.length === 1 ? '' : 's'} shown{appliedSearch ? ` for "${appliedSearch}"` : ''}
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Customer</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Phone</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vehicles</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">History</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td className="px-5 py-10 text-sm text-slate-500" colSpan="5">
                        Loading customers...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td className="px-5 py-10 text-sm text-slate-500" colSpan="5">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                        <tr
                          key={customer.customerId}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getCustomerAvatar(customer)}
                                alt={customer.name || 'Customer'}
                                className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                                onError={(event) => {
                                  event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'Customer')}&background=0D8ABC&color=fff`
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900">{customer.name}</span>
                                <span className="text-sm text-slate-500">{customer.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">{customer.phone}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{customer.vehicleCount || 0}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{customer.historyCount || 0}</td>
                          <td className="px-5 py-4">
                            {customer.customerId ? (
                              <Link
                                className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                to={`/staff/customers/${customer.customerId}`}
                              >
                                View Details
                              </Link>
                            ) : (
                              <span className="inline-flex cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400">
                                View Details
                              </span>
                            )}
                          </td>
                        </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </StaffLayout>
  )
}

export default CustomerSearchPage

