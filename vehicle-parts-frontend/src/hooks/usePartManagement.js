import { useEffect, useMemo, useState } from 'react'
import { createPart, deletePart, getPartList, updatePart, uploadPartImage } from '../api/partApi'
import { getVendorList } from '../api/vendorApi'
import { getNextPurchaseInvoiceNumber } from '../api/invoiceApi'
import { toastService } from '../services/toastService'
import { getTodayInputValue } from '../utils/invoiceUtils'

const CATEGORY_OPTIONS = [
  'Engine Components',
  'Braking Systems',
  'Transmission',
  'Suspension',
  'Electrical',
  'Cooling System',
  'Filters',
  'Body Parts',
]

const initialFormState = {
  name: '',
  descriptions: '',
  category: CATEGORY_OPTIONS[0],
  categoryCustom: '',
  condition: 'New',
  price: '',
  stockQuantity: '0',
  vendorId: '',
  openingInvoiceNumber: '',
  imageUrls: [],
}

export default function usePartManagement() {
  const [partList, setPartList] = useState([])
  const [vendorList, setVendorList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [selectedPart, setSelectedPart] = useState(null)
  const [formValues, setFormValues] = useState(initialFormState)
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const totalCount = partList.length
  const lowStockCount = useMemo(() => partList.filter((part) => part.stockQuantity <= 10).length, [partList])
  const inventoryValue = useMemo(
    () => partList.reduce((sum, part) => sum + Number(part.price || 0) * Number(part.stockQuantity || 0), 0),
    [partList],
  )

  useEffect(() => {
    void loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [parts, vendors] = await Promise.all([getPartList(), getVendorList()])
      setPartList(Array.isArray(parts) ? parts : [])
      setVendorList(Array.isArray(vendors) ? vendors : [])
    } catch (error) {
      toastService.error(error.message || 'Failed to load parts data.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadParts = async () => {
    try {
      setIsLoading(true)
      const parts = await getPartList()
      setPartList(Array.isArray(parts) ? parts : [])
    } catch (error) {
      toastService.error(error.message || 'Failed to load parts list.')
    } finally {
      setIsLoading(false)
    }
  }

  const onAddPart = async () => {
    const defaultVendorId = vendorList.length > 0 ? String(vendorList[0].vendorId) : ''
    let openingInvoiceNumber = ''
    try {
      openingInvoiceNumber = String(await getNextPurchaseInvoiceNumber(getTodayInputValue()) || '')
    } catch {
      toastService.error('Failed to generate invoice number.')
      return
    }

    setFormMode('add')
    setSelectedPart(null)
    setFormValues({
      ...initialFormState,
      vendorId: defaultVendorId,
      openingInvoiceNumber,
    })
    setIsFormOpen(true)
  }

  const onEditPart = (part) => {
    const existingCategory = (part.category || '').trim()
    const isPresetCategory = CATEGORY_OPTIONS.includes(existingCategory)

    setFormMode('edit')
    setSelectedPart(part)
    setFormValues({
      name: part.name || '',
      descriptions: part.descriptions || '',
      category: isPresetCategory ? existingCategory : 'Other',
      categoryCustom: isPresetCategory ? '' : existingCategory,
      condition: part.condition || 'New',
      price: String(part.price ?? ''),
      stockQuantity: String(part.stockQuantity ?? ''),
      vendorId: String(part.vendorId ?? ''),
      imageUrls: Array.isArray(part.imageUrls) ? part.imageUrls : [],
    })
    setIsFormOpen(true)
  }

  const onDeletePart = (part) => {
    setSelectedPart(part)
    setIsDeleteOpen(true)
  }

  const closeForm = () => {
    if (isSubmitting || isUploadingImages) return
    setIsFormOpen(false)
  }

  const addPartImages = async (files) => {
    const incomingFiles = Array.from(files || [])
    if (incomingFiles.length === 0) return

    if (formValues.imageUrls.length + incomingFiles.length > 8) {
      toastService.error('You can upload up to 8 images.')
      return
    }

    try {
      setIsUploadingImages(true)
      const uploads = []
      for (const file of incomingFiles) {
        const result = await uploadPartImage(file)
        uploads.push(result.url)
      }

      setFormValues((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...uploads],
      }))
      toastService.success('Image uploaded successfully.')
    } catch (error) {
      toastService.error(error.message || 'Failed to upload image.')
    } finally {
      setIsUploadingImages(false)
    }
  }

  const removePartImage = (index) => {
    setFormValues((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, idx) => idx !== index),
    }))
  }

  const onFormSubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)

      const resolvedCategory = formValues.category === 'Other'
        ? formValues.categoryCustom.trim()
        : formValues.category.trim()

      const payload = {
        name: formValues.name.trim(),
        descriptions: formValues.descriptions.trim(),
        category: resolvedCategory,
        condition: formMode === 'add' ? formValues.condition.trim() : (selectedPart?.condition || 'New'),
        price: Number(formValues.price),
        stockQuantity: formMode === 'add' ? Number(formValues.stockQuantity) : Number(selectedPart?.stockQuantity ?? 0),
        vendorId: formMode === 'add' ? Number(formValues.vendorId) : Number(selectedPart?.vendorId),
        openingInvoiceNumber: formMode === 'add' ? formValues.openingInvoiceNumber.trim() : '',
        imageUrls: formValues.imageUrls,
      }

      if (Number.isNaN(payload.price)) {
        throw new Error('Price is required.')
      }

      if (Number.isNaN(payload.vendorId) || payload.vendorId <= 0) {
        throw new Error('Vendor is required.')
      }

      if (Number.isNaN(payload.stockQuantity) || payload.stockQuantity < 0) {
        throw new Error('Stock quantity must be zero or more.')
      }

      if (formMode === 'add' && !payload.openingInvoiceNumber) {
        throw new Error('Invoice number is required.')
      }

      if (!payload.category) {
        throw new Error('Category is required.')
      }

      if (!['New', 'Refurbished'].includes(payload.condition)) {
        throw new Error('Condition must be New or Refurbished.')
      }

      if (payload.imageUrls.length < 4) {
        throw new Error('At least 4 part images are required.')
      }

      if (formMode === 'add') {
        await createPart(payload)
        toastService.success('Part created successfully.')
      } else if (selectedPart) {
        await updatePart(selectedPart.partId, payload)
        toastService.success('Part updated successfully.')
      }

      setIsFormOpen(false)
      await loadParts()
    } catch (error) {
      toastService.error(error.message || 'Failed to save part.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedPart) return

    try {
      setIsSubmitting(true)
      await deletePart(selectedPart.partId)
      toastService.success('Part deleted successfully.')
      setIsDeleteOpen(false)
      setSelectedPart(null)
      await loadParts()
    } catch (error) {
      toastService.error(error.message || 'Failed to delete part.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    categoryOptions: [...CATEGORY_OPTIONS, 'Other'],
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
  }
}
