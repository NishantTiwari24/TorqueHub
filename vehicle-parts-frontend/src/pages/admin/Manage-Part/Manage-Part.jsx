import { useMemo, useRef, useState } from 'react'
import AdminLayout from '../../../layout/AdminLayout'
import AdminTable from '../../../components/admin/AdminTable'
import AdminFormModal from '../../../components/admin/AdminFormModal'
import usePartManagement from '../../../hooks/usePartManagement'

const ManagePart = () => {
  const {
    categoryOptions,
    partList,
    vendorList,
    isLoading,
    isFormOpen,
    isDeleteOpen,
    isSubmitting,
    isUploadingImages,
    formMode,
    selectedPart,
    formValues,
    totalCount,
    lowStockCount,
    inventoryValue,
    setFormValues,
    setIsDeleteOpen,
    addPartImages,
    removePartImage,
    onAddPart,
    onEditPart,
    onDeletePart,
    closeForm,
    onFormSubmit,
    confirmDelete,
    loadParts,
  } = usePartManagement()
  const imageInputRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const filteredPartList = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return partList
    return partList.filter((part) => {
      const haystack = `${part.name || ''} ${part.category || ''} ${part.condition || ''} ${part.vendorName || ''}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [partList, searchText])

  return (
    <AdminLayout>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-5xl font-black tracking-tight text-on-surface">Manage Parts Inventory</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Manage part catalog. Increase stock from Purchase Invoices.</p>
        </div>
        <button className="bg-primary hover:bg-primary-container text-white px-lg py-sm rounded-lg font-button flex items-center shadow-md active:scale-95 transition-all" onClick={onAddPart} type="button">
          <span className="material-symbols-outlined mr-2">add</span>
          Add Part
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
        <div className="bg-white border border-gray-200 p-lg rounded-xl shadow-sm">
          <p className="text-label-caps text-outline mb-1 uppercase">Total SKU</p>
          <h3 className="text-h3 font-h3 text-on-surface">{totalCount}</h3>
          <p className="text-xs text-on-surface-variant mt-2">Total catalog parts currently available.</p>
        </div>
        <div className="bg-white border border-gray-200 p-lg rounded-xl shadow-sm">
          <p className="text-label-caps text-outline mb-1 uppercase">Low Stock ({'<='}10)</p>
          <h3 className="text-h3 font-h3 text-on-surface">{lowStockCount}</h3>
          <p className="text-xs text-on-surface-variant mt-2">Parts that need replenishment planning.</p>
        </div>
        <div className="bg-white border border-gray-200 p-lg rounded-xl shadow-sm">
          <p className="text-label-caps text-outline mb-1 uppercase">Inventory Value</p>
          <h3 className="text-h3 font-h3 text-on-surface">Rs. {inventoryValue.toFixed(2)}</h3>
          <p className="text-xs text-on-surface-variant mt-2">Estimated value based on price and stock.</p>
        </div>
      </div>

      <AdminTable
        title="Inventory List"
        action={(
          <div className="flex items-center gap-2">
            <label className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                className="h-[38px] w-[220px] rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary"
                placeholder="Search parts..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </label>
            <button className="flex items-center text-sm text-outline border border-outline-variant px-3 py-1.5 rounded-lg hover:bg-surface-variant transition-colors" onClick={() => void loadParts()} type="button">
              <span className="material-symbols-outlined text-sm mr-2">refresh</span>
              Refresh
            </button>
          </div>
        )}
        columns={[
          { key: 'name', label: 'Part Name', className: 'px-4 py-4 font-label-caps text-outline uppercase whitespace-nowrap' },
          { key: 'category', label: 'Category', className: 'px-4 py-4 font-label-caps text-outline uppercase whitespace-nowrap' },
          { key: 'condition', label: 'Condition', className: 'px-4 py-4 font-label-caps text-outline uppercase whitespace-nowrap' },
          { key: 'price', label: 'Price', className: 'px-4 py-4 font-label-caps text-outline uppercase text-right whitespace-nowrap' },
          { key: 'stock', label: 'Stock Quantity', className: 'px-4 py-4 font-label-caps text-outline uppercase text-center whitespace-nowrap' },
          { key: 'vendor', label: 'Vendor Name', className: 'px-4 py-4 font-label-caps text-outline uppercase whitespace-nowrap' },
          { key: 'actions', label: 'Actions', className: 'px-4 py-4 font-label-caps text-outline uppercase text-right whitespace-nowrap' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && filteredPartList.length === 0}
        loadingText="Loading parts..."
        emptyText="No matching parts found."
        containerClassName="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        tableClassName="w-full text-left border-collapse"
        headRowClassName="bg-surface-container-low border-b border-gray-100"
        bodyClassName="divide-y divide-gray-100"
        overflowClassName="overflow-x-hidden"
      >
        {filteredPartList.map((part) => (
          <tr className="hover:bg-teal-50/30 transition-colors group" key={part.partId}>
            <td className="px-lg py-5 font-medium text-on-surface">{part.name}</td>
            <td className="px-lg py-5 text-body-sm text-on-surface">{part.category || '-'}</td>
            <td className="px-lg py-5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant">
                {part.condition || '-'}
              </span>
            </td>
            <td className="px-lg py-5 text-right font-medium text-on-surface">Rs. {Number(part.price || 0).toFixed(2)}</td>
            <td className="px-lg py-5 text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${part.stockQuantity <= 10 ? 'bg-error text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                {part.stockQuantity} Units
              </span>
            </td>
            <td className="px-lg py-5 text-body-sm text-on-surface">{part.vendorName || '-'}</td>
            <td className="px-lg py-5 text-right">
              <div className="flex items-center justify-end space-x-2">
                <button className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-all" onClick={() => onEditPart(part)} type="button" title="Edit">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <button className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-all" onClick={() => onDeletePart(part)} type="button" title="Delete">
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminFormModal
        isOpen={isFormOpen}
        title={formMode === 'add' ? 'Add Part' : `Edit Part: ${selectedPart?.name || ''}`}
        onClose={closeForm}
        maxWidthClassName="max-w-[820px]"
      >
            <form className="p-6 max-h-[78vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-base" onSubmit={onFormSubmit}>
              {formMode === 'add' ? (
                <p className="md:col-span-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant">
                  Set opening stock details now. Future stock updates should use Purchase Invoices.
                </p>
              ) : null}
              {formMode === 'add' ? (
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-semibold text-on-surface">Invoice Number</span>
                  <input className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base bg-slate-50 text-on-surface-variant" value={formValues.openingInvoiceNumber} readOnly required />
                </label>
              ) : null}
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Part Name</span>
                <input className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base" value={formValues.name} onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))} required />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Price</span>
                <input className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base" type="number" step="0.01" min="0" value={formValues.price} onChange={(e) => setFormValues((prev) => ({ ...prev, price: e.target.value }))} required />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">Category</span>
                <select className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base" value={formValues.category} onChange={(e) => setFormValues((prev) => ({ ...prev, category: e.target.value }))} required>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              {formMode === 'add' ? (
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-on-surface">Vendor</span>
                  <select className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base" value={formValues.vendorId} onChange={(e) => setFormValues((prev) => ({ ...prev, vendorId: e.target.value }))} required>
                    <option value="">Select vendor</option>
                    {vendorList.map((vendor) => (
                      <option key={vendor.vendorId} value={vendor.vendorId}>{vendor.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              {formMode === 'add' ? (
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-on-surface">Stock Quantity</span>
                  <input className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base" type="number" min="0" value={formValues.stockQuantity} onChange={(e) => setFormValues((prev) => ({ ...prev, stockQuantity: e.target.value }))} required />
                </label>
              ) : null}
              {formMode === 'add' ? (
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-on-surface">Condition</span>
                  <select className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base" value={formValues.condition} onChange={(e) => setFormValues((prev) => ({ ...prev, condition: e.target.value }))} required>
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </label>
              ) : null}
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">Description</span>
                <textarea className="w-full rounded-lg border border-outline-variant px-3 py-2 text-base" rows={3} value={formValues.descriptions} onChange={(e) => setFormValues((prev) => ({ ...prev, descriptions: e.target.value }))} disabled={formMode === 'edit'} />
              </label>
              {formValues.category === 'Other' ? (
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-semibold text-on-surface">Custom Category</span>
                  <input className="w-full h-[48px] rounded-lg border border-outline-variant px-3 text-base" value={formValues.categoryCustom} onChange={(e) => setFormValues((prev) => ({ ...prev, categoryCustom: e.target.value }))} required />
                </label>
              ) : null}
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">Part Images</span>
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Upload images (minimum 4, maximum 8)</p>
                      <p className="text-xs text-on-surface-variant">JPG, PNG, WEBP up to 5MB each.</p>
                    </div>
                    <button
                      className="px-3 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container disabled:opacity-60"
                      onClick={() => imageInputRef.current?.click()}
                      type="button"
                      disabled={isUploadingImages || formValues.imageUrls.length >= 8}
                    >
                      {isUploadingImages ? 'Uploading...' : 'Select Images'}
                    </button>
                  </div>
                  <input
                    ref={imageInputRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      void addPartImages(e.target.files)
                      e.target.value = ''
                    }}
                  />

                  {formValues.imageUrls.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formValues.imageUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative group">
                          <img src={url} alt={`Part upload ${index + 1}`} className="h-24 w-full rounded-lg object-cover border border-outline-variant" />
                          <button
                            className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePartImage(index)}
                            type="button"
                            title="Remove image"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-3 text-xs text-on-surface-variant">
                    Added {formValues.imageUrls.length}/8 images. At least 4 images are required.
                  </p>
                </div>
              </label>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-slate-50" onClick={closeForm} type="button">Cancel</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container" disabled={isSubmitting || isUploadingImages} type="submit">
                  {isSubmitting ? 'Saving...' : formMode === 'add' ? 'Save Part' : 'Update Part'}
                </button>
              </div>
            </form>
      </AdminFormModal>

      {isDeleteOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-[min(92vw,420px)] rounded-xl border border-outline-variant bg-white shadow-2xl p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-2">Delete Part</h3>
            <p className="text-body-base text-on-surface-variant mb-6 break-words leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{selectedPart?.name}</span>?
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

export default ManagePart


