import { useMemo, useState } from 'react'
import AdminLayout from '../../../layout/AdminLayout'
import AdminTable from '../../../components/admin/AdminTable'
import AdminFormModal from '../../../components/admin/AdminFormModal'
import useStaffManagement from '../../../hooks/useStaffManagement'
import useToggle from '../../../hooks/useToggle'
import { assignStaffRoles, revokeStaffRole } from '../../../api/roleApi'
import { toastService } from '../../../services/toastService'

function ManageStaff() {
  const {
    staffList,
    isLoading,
    isFormOpen,
    isDeleteOpen,
    isSubmitting,
    formMode,
    selectedStaff,
    formValues,
    activeCount,
    inactiveCount,
    setFormValues,
    setIsDeleteOpen,
    onNameChange,
    onAddStaff,
    onEditStaff,
    onDeleteStaff,
    closeForm,
    onFormSubmit,
    confirmDelete,
    loadStaff,
  } = useStaffManagement()
  const { value: showPassword, toggle: togglePasswordVisibility } = useToggle(false)
  const [roleLoadingUserId, setRoleLoadingUserId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const filteredStaffList = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return staffList
    return staffList.filter((staff) => {
      const haystack = `${staff.name || ''} ${staff.email || ''} ${staff.phoneNumber || ''}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [staffList, searchText])

  return (
    <AdminLayout contentClassName="px-0 pb-0">
      <div className="px-8 pb-12 w-full">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h2 className="text-5xl font-black tracking-tight text-on-surface">Manage Staff</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Create, update, and remove staff accounts.</p>
          </div>
          <button
            className="bg-primary text-on-primary font-button text-button px-lg py-sm rounded-lg flex items-center gap-2 hover:bg-primary-container transition-all active:scale-95 transform shadow-md"
            onClick={onAddStaff}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add New Staff
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-xl">
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Total Staff</p>
            <h3 className="font-h1 text-h1 text-on-surface">{staffList.length}</h3>
            <p className="text-xs text-on-surface-variant mt-2">All staff accounts registered in the system.</p>
          </div>
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Active</p>
            <h3 className="font-h1 text-h1 text-on-surface">{activeCount}</h3>
            <p className="text-xs text-on-surface-variant mt-2">Team members who can currently access staff tools.</p>
          </div>
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Inactive</p>
            <h3 className="font-h1 text-h1 text-on-surface">{inactiveCount}</h3>
            <p className="text-xs text-on-surface-variant mt-2">Accounts paused from daily operations.</p>
          </div>
        </div>

        <AdminTable
          title="Staff Directory"
          action={(
            <div className="flex items-center gap-2">
              <label className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  className="h-[38px] w-[220px] rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary"
                  placeholder="Search staff..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </label>
              <button
                className="flex items-center text-sm text-outline border border-outline-variant px-3 py-1.5 rounded-lg hover:bg-surface-variant transition-colors"
                onClick={() => void loadStaff()}
                type="button"
              >
                <span className="material-symbols-outlined text-sm mr-2">refresh</span>
                Refresh
              </button>
            </div>
          )}
          columns={[
            { key: 'name', label: 'Name', className: 'px-lg py-4 font-label-caps text-label-caps text-on-surface-variant uppercase' },
            { key: 'email', label: 'Email', className: 'px-lg py-4 font-label-caps text-label-caps text-on-surface-variant uppercase' },
            { key: 'phone', label: 'Phone', className: 'px-lg py-4 font-label-caps text-label-caps text-on-surface-variant uppercase' },
            { key: 'roles', label: 'Roles', className: 'px-lg py-4 font-label-caps text-label-caps text-on-surface-variant uppercase' },
            { key: 'status', label: 'Status', className: 'px-lg py-4 font-label-caps text-label-caps text-on-surface-variant uppercase' },
            { key: 'actions', label: 'Actions', className: 'px-lg py-4 font-label-caps text-label-caps text-on-surface-variant uppercase text-right' },
          ]}
          isLoading={isLoading}
          isEmpty={!isLoading && filteredStaffList.length === 0}
          loadingText="Loading staff..."
          emptyText="No matching staff users found."
        >
          {filteredStaffList.map((staff) => (
            <tr key={staff.userId} className="hover:bg-surface transition-colors group">
              <td className="px-lg py-4 font-body-base text-body-base text-on-surface font-semibold">{staff.name}</td>
              <td className="px-lg py-4 font-body-sm text-body-sm text-on-surface">{staff.email}</td>
              <td className="px-lg py-4 font-body-sm text-body-sm text-on-surface">{staff.phoneNumber || '-'}</td>
              <td className="px-lg py-4">
                <div className="flex flex-wrap gap-1">
                  {(staff.roles || []).map((role) => (
                    <span key={`${staff.userId}-${role}`} className="inline-flex items-center px-2 py-1 rounded-full font-medium text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                      {role}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-lg py-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs border ${
                    staff.isActive
                      ? 'bg-primary-container/10 text-primary border-primary/20'
                      : 'bg-error/10 text-error border-error/20'
                  }`}
                >
                  {staff.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-lg py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="p-2 text-on-surface-variant hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                    onClick={async () => {
                      try {
                        setRoleLoadingUserId(staff.userId)
                        await assignStaffRoles(staff.userId, ['Staff'])
                        toastService.success('Staff role assigned.')
                      } catch (error) {
                        toastService.error(error.message || 'Failed to assign role.')
                      } finally {
                        setRoleLoadingUserId(null)
                      }
                    }}
                    type="button"
                    disabled={roleLoadingUserId === staff.userId}
                    title="Assign Staff role"
                  >
                    <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  </button>
                  <button
                    className="p-2 text-on-surface-variant hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                    onClick={async () => {
                      try {
                        setRoleLoadingUserId(staff.userId)
                        await revokeStaffRole(staff.userId, 'Staff')
                        toastService.success('Staff role revoked.')
                      } catch (error) {
                        toastService.error(error.message || 'Failed to revoke role.')
                      } finally {
                        setRoleLoadingUserId(null)
                      }
                    }}
                    type="button"
                    disabled={roleLoadingUserId === staff.userId}
                    title="Revoke Staff role"
                  >
                    <span className="material-symbols-outlined text-[20px]">shield_person</span>
                  </button>
                  <button
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                    onClick={() => onEditStaff(staff)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all"
                    onClick={() => onDeleteStaff(staff)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <AdminFormModal
        isOpen={isFormOpen}
        title={formMode === 'add' ? 'Add New Staff' : `Edit Staff: ${selectedStaff?.name || ''}`}
        onClose={closeForm}
        maxWidthClassName="max-w-[640px]"
      >
        <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-base" onSubmit={onFormSubmit}>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Full Name</span>
                <input
                  className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base"
                  value={formValues.name}
                  onChange={(e) => onNameChange(e.target.value)}
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
                <span className="text-sm font-semibold text-on-surface">Phone</span>
                <input
                  className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base"
                  value={formValues.phoneNumber}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  required
                />
              </label>

              {formMode === 'add' ? (
                <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-on-surface">Password</span>
                  <div className="relative">
                    <input
                      className="w-full h-[48px] rounded-lg border border-outline-variant px-3 pr-16 text-base"
                      type={showPassword ? 'text' : 'password'}
                      value={formValues.password}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="space-y-1 flex items-center gap-2 mt-6">
                  <input
                    checked={formValues.isActive}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, isActive: e.target.checked }))}
                    type="checkbox"
                  />
                  <span className="text-body-sm text-on-surface">Active staff member</span>
                </label>
              )}

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-slate-50" onClick={closeForm} type="button">
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Saving...' : formMode === 'add' ? 'Save Staff' : 'Update Staff'}
                </button>
              </div>
        </form>
      </AdminFormModal>

      {isDeleteOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-[min(92vw,420px)] rounded-xl border border-outline-variant bg-white shadow-2xl p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-2">Delete Staff</h3>
            <p className="text-body-base text-on-surface-variant mb-6 break-words leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{selectedStaff?.name}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-slate-50" onClick={() => setIsDeleteOpen(false)} type="button">
                Cancel
              </button>
              <button className="px-4 py-2 rounded-lg bg-error text-white hover:opacity-90" disabled={isSubmitting} onClick={() => void confirmDelete()} type="button">
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default ManageStaff

