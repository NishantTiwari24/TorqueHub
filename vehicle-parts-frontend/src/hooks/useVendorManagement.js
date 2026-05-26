import { useEffect, useMemo, useState } from 'react'
import { createVendor, deleteVendor, getVendorList, updateVendor } from '../api/vendorApi'
import { toastService } from '../services/toastService'

const initialFormState = {
  name: '',
  email: '',
  phoneNo: '',
  address: '',
}

export default function useVendorManagement() {
  const [vendorList, setVendorList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [formValues, setFormValues] = useState(initialFormState)

  const totalCount = vendorList.length
  const hasAddressCount = useMemo(() => vendorList.filter((vendor) => (vendor.address || '').trim().length > 0).length, [vendorList])
  const addressCoveragePercent = useMemo(() => {
    if (!totalCount) return 0
    return Math.round((hasAddressCount / totalCount) * 100)
  }, [hasAddressCount, totalCount])

  useEffect(() => {
    void loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      setIsLoading(true)
      const data = await getVendorList()
      setVendorList(Array.isArray(data) ? data : [])
    } catch (error) {
      toastService.error(error.message || 'Failed to load vendor list.')
    } finally {
      setIsLoading(false)
    }
  }

  const onAddVendor = () => {
    setFormMode('add')
    setSelectedVendor(null)
    setFormValues(initialFormState)
    setIsFormOpen(true)
  }

  const onEditVendor = (vendor) => {
    setFormMode('edit')
    setSelectedVendor(vendor)
    setFormValues({
      name: vendor.name || '',
      email: vendor.email || '',
      phoneNo: vendor.phoneNo || '',
      address: vendor.address || '',
    })
    setIsFormOpen(true)
  }

  const onDeleteVendor = (vendor) => {
    setSelectedVendor(vendor)
    setIsDeleteOpen(true)
  }

  const closeForm = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
  }

  const onFormSubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)

      const payload = {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phoneNo: formValues.phoneNo.trim(),
        address: formValues.address.trim(),
      }

      if (formMode === 'add') {
        await createVendor(payload)
        toastService.success('Vendor created successfully.')
      } else if (selectedVendor) {
        await updateVendor(selectedVendor.vendorId, payload)
        toastService.success('Vendor updated successfully.')
      }

      setIsFormOpen(false)
      await loadVendors()
    } catch (error) {
      toastService.error(error.message || 'Failed to save vendor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedVendor) return

    try {
      setIsSubmitting(true)
      await deleteVendor(selectedVendor.vendorId)
      toastService.success('Vendor deleted successfully.')
      setIsDeleteOpen(false)
      setSelectedVendor(null)
      await loadVendors()
    } catch (error) {
      toastService.error(error.message || 'Failed to delete vendor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
  }
}
