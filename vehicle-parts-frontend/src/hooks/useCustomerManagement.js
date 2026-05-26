import { useEffect, useMemo, useState } from 'react'
import { getCustomers, registerCustomer, searchCustomers, uploadVehicleImage } from '../api/customerApi'
import { toastService } from '../services/toastService'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  plateNumber: '',
  make: '',
  year: '',
  model: '',
  category: 'car',
  vehicleImageFile: null,
}

function buildAutoEmail(fullName) {
  const firstName = fullName.trim().split(/\s+/)[0] || ''
  const normalized = firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!normalized) return ''

  const suffix = Math.floor(100 + Math.random() * 900)
  return `${normalized}${suffix}@nayanepal.com`
}

function readErrorMessage(error, fallbackMessage) {
  if (error?.payload && typeof error.payload === 'object') {
    const payload = error.payload
    if (payload.message && payload.traceId) {
      return `${payload.message} (trace: ${payload.traceId})`
    }
    if (payload.message) return payload.message
  }

  if (!error?.message) return fallbackMessage

  try {
    const parsed = JSON.parse(error.message)
    if (parsed?.message && parsed?.error) return `${parsed.message} (${parsed.error})`
    if (parsed?.message) return parsed.message
  } catch {
    // Ignore JSON parse failure and use raw message.
  }

  return error.message || fallbackMessage
}

function normalizeCustomers(data) {
  const customerList = Array.isArray(data) ? data : []
  return customerList.map((customer) => ({
    customerId: customer.id ?? customer.userId ?? customer.Id ?? null,
    name: customer.name || customer.userName || 'Customer',
    email: customer.email || '',
    phone: customer.phoneNumber || '',
    profileImageUrl: customer.profileImageUrl || customer.imageUrl || customer.avatarUrl || '',
    vehicleCount: customer.vehicleCount ?? customer.VehicleCount ?? 0,
    historyCount: customer.historyCount ?? customer.HistoryCount ?? 0,
  }))
}

export default function useCustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [formValues, setFormValues] = useState(initialFormState)
  const [formErrors, setFormErrors] = useState({})

  const totalVehicles = useMemo(
    () => customers.reduce((sum, customer) => sum + (customer.vehicleCount || 0), 0),
    [customers],
  )

  useEffect(() => {
    void loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      const data = await getCustomers()
      setCustomers(normalizeCustomers(data))
      setAppliedSearch('')
    } catch (error) {
      toastService.error(readErrorMessage(error, 'Failed to load customers.'))
    } finally {
      setIsLoading(false)
    }
  }

  const runSearch = async (term = searchTerm) => {
    const trimmed = term.trim()

    if (!trimmed) {
      await loadCustomers()
      return
    }

    try {
      setIsLoading(true)
      const data = await searchCustomers({ query: trimmed })
      setCustomers(normalizeCustomers(data))
      setAppliedSearch(trimmed)
    } catch (error) {
      toastService.error(readErrorMessage(error, 'Failed to search customers.'))
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = async () => {
    setSearchTerm('')
    await loadCustomers()
  }

  const onFormValueChange = (field) => (event) => {
    if (field === 'vehicleImageFile') {
      const file = event.target.files?.[0] ?? null
      setFormValues((prev) => ({ ...prev, vehicleImageFile: file }))
      setFormErrors((prev) => ({ ...prev, vehicleImageFile: '' }))
      return
    }

    const { value } = event.target
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formValues.name.trim()) nextErrors.name = 'Full name is required.'
    if (!formValues.email.trim()) nextErrors.email = 'Email is required.'
    if (!formValues.phone.trim()) nextErrors.phone = 'Phone number is required.'
    if (!formValues.plateNumber.trim()) nextErrors.plateNumber = 'Plate number is required.'
    if (!formValues.make.trim()) nextErrors.make = 'Vehicle brand is required.'
    if (!formValues.model.trim()) nextErrors.model = 'Vehicle model is required.'
    if (!formValues.category.trim()) nextErrors.category = 'Vehicle category is required.'
    if (formValues.vehicleImageFile) {
      const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
      if (!allowedTypes.has(formValues.vehicleImageFile.type)) {
        nextErrors.vehicleImageFile = 'Only JPG, PNG, and WEBP files are allowed.'
      } else if (formValues.vehicleImageFile.size > 5 * 1024 * 1024) {
        nextErrors.vehicleImageFile = 'Image must be 5MB or less.'
      }
    }

    const year = Number(formValues.year)
    if (!Number.isInteger(year)) {
      nextErrors.year = 'Enter a valid model year.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitRegistration = async (event) => {
    event.preventDefault()
    if (!validateForm()) {
      toastService.error('Please fix the highlighted fields.')
      return false
    }

    try {
      setIsSubmitting(true)
      let vehicleImageUrl = null
      if (formValues.vehicleImageFile) {
        const upload = await uploadVehicleImage(formValues.vehicleImageFile)
        vehicleImageUrl = upload?.url ?? null
      }

      await registerCustomer({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phoneNumber: formValues.phone.trim(),
        vehicleNumber: formValues.plateNumber.trim(),
        model: formValues.model.trim(),
        brand: formValues.make.trim(),
        category: formValues.category.trim(),
        year: Number(formValues.year),
        vehicleImageUrl,
      })

      toastService.success('Customer registered successfully.')
      setFormValues(initialFormState)
      setFormErrors({})
      return true
    } catch (error) {
      toastService.error(readErrorMessage(error, 'Failed to register customer.'))
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    customers,
    isLoading,
    isSubmitting,
    searchTerm,
    appliedSearch,
    totalVehicles,
    formValues,
    formErrors,
    setSearchTerm,
    onFormValueChange,
    runSearch,
    clearSearch,
    submitRegistration,
  }
}
