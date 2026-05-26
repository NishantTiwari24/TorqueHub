import { useMemo, useState } from 'react'
import AdminLayout from '../../../layout/AdminLayout'
import AdminTable from '../../../components/admin/AdminTable'
import AdminFormModal from '../../../components/admin/AdminFormModal'
import useVendorManagement from '../../../hooks/useVendorManagement'

const ManageVendor = () => {
  const {
    vendorList,
    isLoading,
    isFormOpen,
    isDeleteOpen,
    isSubmitting,
    formMode,
    selectedVendor,
    formValues,
    totalCount,
    hasAddressCount,
    addressCoveragePercent,
    setFormValues,
    setIsDeleteOpen,
    onAddVendor,
    onEditVendor,
    onDeleteVendor,
    closeForm,
    onFormSubmit,
    confirmDelete,
    loadVendors,
  } = useVendorManagement()
  const [searchText, setSearchText] = useState('')
  const filteredVendorList = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return vendorList
    return vendorList.filter((vendor) => {
      const haystack = `${vendor.name || ''} ${vendor.email || ''} ${vendor.phoneNo || ''} ${vendor.address || ''}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [vendorList, searchText])

  return (
    <AdminLayout contentClassName="px-0 pb-0">
      <div className="pb-12 px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-on-background">Vendor Management</h1>
            <p className="text-on-surface-variant font-body-base mt-1">Directory of certified parts suppliers and logistics partners.</p>
          </div>
          <button
            className="bg-primary text-on-primary font-button px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-container transition-colors shadow-sm active:scale-95 transform"
            onClick={onAddVendor}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Vendor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-on-surface-variant font-label-caps">Total Vendors</span>
              <span className="material-symbols-outlined text-primary">groups</span>
            </div>
            <div className="font-h3 text-h3">{totalCount}</div>
            <p className="text-xs text-on-surface-variant mt-2">Total suppliers available for procurement.</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-on-surface-variant font-label-caps">With Address</span>
              <span className="material-symbols-outlined text-secondary">location_on</span>
            </div>
            <div className="font-h3 text-h3">{hasAddressCount}</div>
            <p className="text-xs text-on-surface-variant mt-2">Vendors with full location details on file.</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-on-surface-variant font-label-caps">Address Coverage</span>
              <span className="material-symbols-outlined text-tertiary">analytics</span>
            </div>
            <div className="font-h3 text-h3">{addressCoveragePercent}%</div>
            <p className="text-xs text-on-surface-variant mt-2">Share of vendors with saved address information.</p>
          </div>
        </div>

        <AdminTable
          title="Vendor Directory"
          action={(
            <div className="flex items-center gap-2">
              <label className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  className="h-[38px] w-[220px] rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary"
                  placeholder="Search vendors..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </label>
              <button
                className="flex items-center text-sm text-outline border border-outline-variant px-3 py-1.5 rounded-lg hover:bg-surface-variant transition-colors"
                onClick={() => void loadVendors()}
                type="button"
              >
                <span className="material-symbols-outlined text-sm mr-2">refresh</span>
                Refresh
              </button>
            </div>
          )}
          columns={[
            { key: 'name', label: 'Vendor Name', className: 'py-4 px-6 font-label-caps text-on-surface-variant' },
            { key: 'contact', label: 'Contact Info', className: 'py-4 px-6 font-label-caps text-on-surface-variant' },
            { key: 'address', label: 'Address', className: 'py-4 px-6 font-label-caps text-on-surface-variant' },
            { key: 'actions', label: 'Actions', className: 'py-4 px-6 font-label-caps text-on-surface-variant text-right' },
          ]}
          isLoading={isLoading}
          isEmpty={!isLoading && filteredVendorList.length === 0}
          loadingText="Loading vendors..."
          emptyText="No matching vendors found."
          containerClassName="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden"
          headRowClassName="bg-surface-container-high border-b border-outline-variant"
          tableClassName="w-full text-left"
        >
          {filteredVendorList.map((vendor) => (
            <tr className="group hover:bg-surface-container transition-colors" key={vendor.vendorId}>
              <td className="py-5 px-6">
                <div className="font-semibold text-on-surface">{vendor.name}</div>
              </td>
              <td className="py-5 px-6">
                <div className="text-body-sm text-on-surface">{vendor.phoneNo || '-'}</div>
                <div className="text-xs text-on-surface-variant">{vendor.email}</div>
              </td>
              <td className="py-5 px-6 text-on-surface-variant text-body-sm">{vendor.address || '-'}</td>
              <td className="py-5 px-6 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                    title="Edit"
                    onClick={() => onEditVendor(vendor)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">edit_note</span>
                  </button>
                  <button
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all"
                    title="Delete"
                    onClick={() => onDeleteVendor(vendor)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <AdminFormModal
        isOpen={isFormOpen}
        title={formMode === 'add' ? 'Add Vendor' : `Edit Vendor: ${selectedVendor?.name || ''}`}
        onClose={closeForm}
        maxWidthClassName="max-w-[640px]"
      >
            <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-base" onSubmit={onFormSubmit}>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Vendor Name</span>
                <input
                  className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base"
                  value={formValues.name}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Phone</span>
                <input
                  className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base"
                  value={formValues.phoneNo}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, phoneNo: e.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Email</span>
                <input
                  className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base"
                  type="email"
                  value={formValues.email}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Address</span>
                <textarea
                  className="w-full rounded-lg border border-outline-variant px-3 py-2 text-base"
                  rows={1}
                  value={formValues.address}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, address: e.target.value }))}
                />
              </label>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-slate-50" onClick={closeForm} type="button">Cancel</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Saving...' : formMode === 'add' ? 'Save Vendor' : 'Update Vendor'}
                </button>
              </div>
            </form>
      </AdminFormModal>

      {isDeleteOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-[min(92vw,420px)] rounded-xl border border-outline-variant bg-white shadow-2xl p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-2">Delete Vendor</h3>
            <p className="text-body-base text-on-surface-variant mb-6 break-words leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{selectedVendor?.name}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-slate-50" onClick={() => setIsDeleteOpen(false)} type="button">Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-error text-white hover:opacity-90" onClick={() => void confirmDelete()} disabled={isSubmitting} type="button">
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default ManageVendor

