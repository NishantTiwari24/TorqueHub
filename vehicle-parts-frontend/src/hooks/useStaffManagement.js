import { useEffect, useMemo, useState } from 'react'
import { createStaff, deleteStaff, getStaffList, updateStaff } from '../api/staffApi'
import { toastService } from '../services/toastService'

const initialFormState = {
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  isActive: true,
}

function buildAutoEmail(fullName) {
  const firstName = fullName.trim().split(/\s+/)[0] || ''
  const normalized = firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
  return normalized ? `${normalized}@nayanepal.com` : ''
}

export default function useStaffManagement() {
  const [staffList, setStaffList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [formValues, setFormValues] = useState(initialFormState)

  const activeCount = useMemo(() => staffList.filter((staff) => staff.isActive).length, [staffList])
  const inactiveCount = staffList.length - activeCount

  useEffect(() => {
    void loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      setIsLoading(true)
      const data = await getStaffList()
      setStaffList(Array.isArray(data) ? data : [])
    } catch (error) {
      toastService.error(error.message || 'Failed to load staff list.')
    } finally {
      setIsLoading(false)
    }
  }

  const onAddStaff = () => {
    setFormMode('add')
    setSelectedStaff(null)
    setFormValues(initialFormState)
    setIsFormOpen(true)
  }

  const onEditStaff = (staff) => {
    setFormMode('edit')
    setSelectedStaff(staff)
    setFormValues({
      name: staff.name || '',
      email: staff.email || '',
      phoneNumber: staff.phoneNumber || '',
      password: '',
      isActive: Boolean(staff.isActive),
    })
    setIsFormOpen(true)
  }

  const onDeleteStaff = (staff) => {
    setSelectedStaff(staff)
    setIsDeleteOpen(true)
  }

  const onNameChange = (name) => {
    setFormValues((prev) => {
      if (formMode !== 'add') {
        return { ...prev, name }
      }

      return {
        ...prev,
        name,
        email: buildAutoEmail(name),
      }
    })
  }

  const closeForm = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
  }

  const onFormSubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)

      if (formMode === 'add') {
        await createStaff({
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          phoneNumber: formValues.phoneNumber.trim(),
          password: formValues.password,
        })
        toastService.success('Staff created successfully.')
      } else if (selectedStaff) {
        await updateStaff(selectedStaff.userId, {
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          phoneNumber: formValues.phoneNumber.trim(),
          isActive: formValues.isActive,
        })
        toastService.success('Staff updated successfully.')
      }

      setIsFormOpen(false)
      await loadStaff()
    } catch (error) {
      toastService.error(error.message || 'Failed to save staff.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedStaff) return

    try {
      setIsSubmitting(true)
      await deleteStaff(selectedStaff.userId)
      toastService.success('Staff deleted successfully.')
      setIsDeleteOpen(false)
      setSelectedStaff(null)
      await loadStaff()
    } catch (error) {
      toastService.error(error.message || 'Failed to delete staff.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
  }
}
