import { useEffect, useState } from 'react'
import CustomerLayout from '../../../layout/CustomerLayout'
import { createVehicle, deleteVehicle, getMyVehicles, updateVehicle, uploadVehicleImage } from '../../../api/vehicleApi'
import { toastService } from '../../../services/toastService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5033'

const initialForm = {
  vehicleNumber: '',
  brand: '',
  model: '',
  category: 'Car',
  year: new Date().getFullYear(),
}

function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)
  const [vehicleImageFile, setVehicleImageFile] = useState(null)
  const [vehicleImagePreview, setVehicleImagePreview] = useState('')
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [vehicleImagePreviewError, setVehicleImagePreviewError] = useState(false)
  const [selectedImageName, setSelectedImageName] = useState('')

  const resolveImageUrl = (url) => {
    if (!url) return ''
    const cleaned = String(url).trim().replace(/^"+|"+$/g, '').replace(/\\/g, '/')
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned
    if (cleaned.startsWith('/')) return `${API_BASE_URL}${cleaned}`
    return `${API_BASE_URL}/${cleaned}`
  }

  const normalizeVehicle = (vehicle) => ({
    vehicleId: vehicle.vehicleId ?? vehicle.VehicleId ?? 0,
    vehicleNumber: vehicle.vehicleNumber ?? vehicle.VehicleNumber ?? '',
    brand: vehicle.brand ?? vehicle.Brand ?? '',
    model: vehicle.model ?? vehicle.Model ?? '',
    category: vehicle.category ?? vehicle.Category ?? 'Car',
    year: vehicle.year ?? vehicle.Year ?? new Date().getFullYear(),
    imageUrl: vehicle.imageUrl ?? vehicle.ImageUrl ?? '',
  })

  useEffect(() => {
    void loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      setIsLoading(true)
      setLoadError('')
      const data = await getMyVehicles()
      const normalized = Array.isArray(data) ? data.map(normalizeVehicle) : []
      setVehicles(normalized)
    } catch (error) {
      setLoadError(error.message || 'Failed to load vehicles.')
    } finally {
      setIsLoading(false)
    }
  }

  const startAdd = () => {
    setEditingId(null)
    setFormValues(initialForm)
    setVehicleImageFile(null)
    setVehicleImagePreview('')
    setCurrentImageUrl('')
    setVehicleImagePreviewError(false)
    setSelectedImageName('')
    setShowForm(true)
  }

  const startEdit = (vehicle, cardImageUrl = '') => {
    setEditingId(vehicle.vehicleId)
    setFormValues({
      vehicleNumber: vehicle.vehicleNumber || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      category: vehicle.category || 'Car',
      year: Number(vehicle.year) || new Date().getFullYear(),
    })
    setVehicleImageFile(null)
    setVehicleImagePreview('')
    setCurrentImageUrl(cardImageUrl || resolveImageUrl(vehicle.imageUrl || vehicle.ImageUrl || ''))
    setVehicleImagePreviewError(false)
    setSelectedImageName('')
    setShowForm(true)
  }

  const onFormChange = (field) => (event) => {
    const value = field === 'year' ? Number(event.target.value) : event.target.value
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setEditingId(null)
    setFormValues(initialForm)
    setVehicleImageFile(null)
    setVehicleImagePreview('')
    setCurrentImageUrl('')
    setVehicleImagePreviewError(false)
    setSelectedImageName('')
    setShowForm(false)
  }

  const onVehicleImageChange = (event) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      setVehicleImageFile(null)
      setSelectedImageName('')
      return
    }

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!allowedTypes.has(file.type)) {
      toastService.error('Only JPG, PNG, and WEBP files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toastService.error('Image must be 5MB or less.')
      return
    }

    setVehicleImageFile(file)
    setVehicleImagePreview(URL.createObjectURL(file))
    setCurrentImageUrl('')
    setVehicleImagePreviewError(false)
    setSelectedImageName(file.name)
  }

  const saveVehicle = async (event) => {
    event.preventDefault()

    if (!formValues.vehicleNumber.trim() || !formValues.brand.trim() || !formValues.model.trim()) {
      toastService.error('Vehicle number, brand, and model are required.')
      return
    }

    try {
      setIsSaving(true)
      let imageUrl = currentImageUrl || null
      if (vehicleImageFile) {
        const upload = await uploadVehicleImage(vehicleImageFile, editingId || null)
        imageUrl = resolveImageUrl(upload?.url || '')
      }

      const payload = {
        vehicleNumber: formValues.vehicleNumber.trim(),
        brand: formValues.brand.trim(),
        model: formValues.model.trim(),
        category: formValues.category.trim() || 'Car',
        year: Number(formValues.year),
        imageUrl,
      }

      if (editingId) {
        await updateVehicle(editingId, payload)
        toastService.success('Vehicle updated successfully.')
      } else {
        await createVehicle(payload)
        toastService.success('Vehicle added successfully.')
      }

      resetForm()
      await loadVehicles()
    } catch (error) {
      toastService.error(error.message || 'Failed to save vehicle.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeVehicle = async (vehicleId) => {
    if (!window.confirm('Delete this vehicle?')) return

    try {
      await deleteVehicle(vehicleId)
      toastService.success('Vehicle deleted successfully.')
      await loadVehicles()
    } catch (error) {
      toastService.error(error.message || 'Failed to delete vehicle.')
    }
  }

  return (
    <CustomerLayout>
      <div className="p-6 lg:p-10 w-full pb-24 lg:pb-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div className="md:flex-1 min-w-0">
            <h1 className="text-5xl font-black tracking-tight text-on-surface">My Vehicles</h1>
            <p className="text-body-base text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
              Manage your vehicles and keep your garage profile up to date.
            </p>
          </div>
          <button
            className="bg-primary text-on-primary font-button px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700 active:scale-95 transition-all shadow-md"
            type="button"
            onClick={startAdd}
          >
            <span className="material-symbols-outlined">add</span>
            Add New Vehicle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
          {loadError ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-error/40 bg-error-container/30 px-6 py-4 text-sm text-error">{loadError}</div>
          ) : null}
          {isLoading ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-sm text-on-surface-variant">Loading vehicles...</div>
          ) : null}
          {!isLoading && !loadError && vehicles.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-sm text-on-surface-variant">No vehicles found.</div>
          ) : null}
          {vehicles.map((vehicle) => (
            (() => {
              const vehicleImage = resolveImageUrl(vehicle.imageUrl || vehicle.ImageUrl || '')
              return (
            <div key={vehicle.vehicleId} className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
              <div className="relative h-48 overflow-hidden bg-surface-container-low">
                {vehicleImage ? (
                  <img
                    src={vehicleImage}
                    alt={`${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle'}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container-high" />
                )}
                <div className="absolute top-4 left-4 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary">{vehicle.category || 'Vehicle'}</div>
              </div>
              <div className="p-lg flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-label-caps text-secondary-container mb-1">{vehicle.brand}</p>
                    <h3 className="font-h3 text-on-surface">{vehicle.model}</h3>
                  </div>
                  <span className="bg-surface-container-high px-2 py-1 rounded text-body-sm font-semibold text-on-surface-variant">{vehicle.year}</span>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-outline text-lg">license</span>
                  <span className="font-mono text-body-base tracking-widest text-on-surface-variant bg-surface-container px-3 py-1 rounded border border-outline-variant/30">{vehicle.vehicleNumber}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                  <div className="flex gap-2">
                    <button className="p-2 text-outline hover:text-secondary-container hover:bg-secondary-fixed transition-colors rounded-lg active:scale-90" type="button" onClick={() => startEdit(vehicle, vehicleImage)}>
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="p-2 text-outline hover:text-error hover:bg-error-container transition-colors rounded-lg active:scale-90" type="button" onClick={() => void removeVehicle(vehicle.vehicleId)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
              )
            })()
          ))}
        </div>
      </div>
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4" onClick={resetForm}>
          <section
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-on-surface mb-4">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={saveVehicle}>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Vehicle Number</span>
                <input className="h-11 w-full rounded-lg border border-outline-variant px-3" placeholder="BA 12 PA 1234" value={formValues.vehicleNumber} onChange={onFormChange('vehicleNumber')} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Brand</span>
                <input className="h-11 w-full rounded-lg border border-outline-variant px-3" placeholder="Tesla" value={formValues.brand} onChange={onFormChange('brand')} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Model</span>
                <input className="h-11 w-full rounded-lg border border-outline-variant px-3" placeholder="Model 3" value={formValues.model} onChange={onFormChange('model')} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Category</span>
                <select className="h-11 w-full rounded-lg border border-outline-variant px-3 bg-white" value={formValues.category} onChange={onFormChange('category')}>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Year</span>
                <input className="h-11 w-full rounded-lg border border-outline-variant px-3" type="number" min="1900" max="2100" placeholder="2024" value={formValues.year} onChange={onFormChange('year')} />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Vehicle Photo</span>
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container transition-colors">
                    <span className="material-symbols-outlined text-base">upload</span>
                    Choose Image
                    <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={onVehicleImageChange} />
                  </label>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {selectedImageName || 'No file selected'}
                  </p>
                  <p className="mt-1 text-xs text-outline">JPG, PNG, WEBP up to 5MB.</p>
                </div>
              </label>
              <div className="md:col-span-2 rounded-xl border border-outline-variant bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Preview</p>
                <div className="h-64 w-full rounded-lg border border-outline-variant bg-slate-100 p-2">
                  {(vehicleImagePreview || currentImageUrl) && !vehicleImagePreviewError ? (
                    <img
                      src={vehicleImagePreview || currentImageUrl}
                      alt="Vehicle preview"
                      className="h-full w-full rounded-md object-contain"
                      onError={() => setVehicleImagePreviewError(true)}
                    />
                  ) : vehicleImagePreviewError ? (
                    <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-200 text-sm text-slate-600 text-center px-3">
                      Unable to load existing image preview.
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-200 text-sm text-slate-600 text-center px-3">
                      No existing photo found. Choose a new image to upload.
                    </div>
                  )}
                </div>
                {currentImageUrl ? (
                  <p className="mt-2 text-xs text-outline break-all">Current image URL: {currentImageUrl}</p>
                ) : null}
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button className="h-11 px-5 rounded-lg border border-outline-variant" type="button" onClick={resetForm}>
                  Close
                </button>
                <button className="h-11 px-5 rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-60" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </CustomerLayout>
  )
}

export default CustomerVehiclesPage
