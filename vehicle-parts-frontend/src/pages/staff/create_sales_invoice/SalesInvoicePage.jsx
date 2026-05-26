import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchCustomers } from '../../../api/customerApi'
import { createSalesInvoice, getNextSalesInvoiceNumber } from '../../../api/invoiceApi'
import { getStaffPartList } from '../../../api/partApi'
import InvoiceBuilder from '../../../components/invoice/InvoiceBuilder'
import StaffLayout from '../../../layout/StaffLayout'
import { createInvoiceNumber, getTodayInputValue } from '../../../utils/invoiceUtils'
import { toastService } from '../../../services/toastService'

const blankItem = () => ({ rowId: crypto.randomUUID(), partId: '', quantity: '0', unitPrice: '' })

function SalesInvoicePage() {
  const navigate = useNavigate()
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [saleDate, setSaleDate] = useState(getTodayInputValue())
  const [items, setItems] = useState([blankItem()])
  const [parts, setParts] = useState([])
  const [customers, setCustomers] = useState([])
  const [paymentMode, setPaymentMode] = useState('full')
  const [paidAmount, setPaidAmount] = useState('')
  const [creditDueDate, setCreditDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [partData, customerData] = await Promise.all([getStaffPartList(), searchCustomers()])
        const resolvedParts = Array.isArray(partData) ? partData : Array.isArray(partData?.data) ? partData.data : []
        setParts(resolvedParts)
        setCustomers(Array.isArray(customerData) ? customerData : [])
      } catch (error) {
        toastService.error(error.message || 'Failed to load sales invoice data.')
      }
    }

    void loadData()
  }, [])

  useEffect(() => {
    const loadNextNumber = async () => {
      try {
        const nextNumber = await getNextSalesInvoiceNumber(saleDate)
        setInvoiceNumber(nextNumber || '')
      } catch (error) {
        setInvoiceNumber(createInvoiceNumber('SI'))
      }
    }

    void loadNextNumber()
  }, [saleDate])

  const customerOptions = useMemo(() => customers.map((customer) => ({
    id: customer.id,
    name: `${customer.name || customer.email || `Customer #${customer.id}`} ${customer.phoneNumber ? `(${customer.phoneNumber})` : ''}`,
  })), [customers])

  const handleItemChange = (index, field, value) => {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const next = { ...item, [field]: value }
      if (field === 'partId') {
        const part = parts.find((entry) => String(entry.partId) === String(value))
        next.unitPrice = part ? String(Number(part.price || 0)) : ''
        if (part && Number(next.quantity || 0) > Number(part.stockQuantity || 0)) {
          next.quantity = String(Math.max(0, Number(part.stockQuantity || 0)))
        }
      }
      if (field === 'quantity') {
        if (value === '') {
          next.quantity = ''
          return next
        }

        const part = parts.find((entry) => String(entry.partId) === String(item.partId))
        const maxStock = Number(part?.stockQuantity || 0)
        const parsed = Number(value)
        if (!Number.isFinite(parsed) || parsed < 0) {
          next.quantity = '0'
        } else if (part && maxStock > 0) {
          next.quantity = String(Math.min(parsed, maxStock))
        } else {
          next.quantity = String(Math.floor(parsed))
        }
      }
      return next
    }))
  }

  const handleSubmit = async (event) => {
    event?.preventDefault()
    setHasAttemptedSubmit(true)
    if (!customerId) {
      toastService.error('Please select a customer.')
      return
    }

    if (!items.length) {
      toastService.error('Please add at least one part item.')
      return
    }

    const invalidItem = items.find((item) => {
      if (!item.partId || Number(item.quantity) < 1) return true
      const part = parts.find((entry) => String(entry.partId) === String(item.partId))
      return !part || Number(item.quantity) > Number(part.stockQuantity || 0)
    })

    if (invalidItem) {
      toastService.error('One or more items have invalid quantity or exceed stock.')
      return
    }

    const computedSubtotal = items.reduce((sum, item) => {
      const part = parts.find((entry) => String(entry.partId) === String(item.partId))
      return sum + Number(item.quantity || 0) * Number(part?.price || 0)
    }, 0)
    const computedDiscount = computedSubtotal > 5000 ? Math.round(computedSubtotal * 0.1 * 100) / 100 : 0
    const computedFinal = computedSubtotal - computedDiscount

    const normalizedPaidAmount = paidAmount === ''
      ? (paymentMode === 'full' ? computedFinal : 0)
      : Number(paidAmount)
    if (normalizedPaidAmount !== null && (Number.isNaN(normalizedPaidAmount) || normalizedPaidAmount < 0)) {
      toastService.error('Paid amount must be a valid number.')
      return
    }
    if (normalizedPaidAmount !== null && normalizedPaidAmount > computedFinal) {
      toastService.error('Paid amount cannot be greater than final total.')
      return
    }
    if (paymentMode === 'credit' && !creditDueDate) {
      toastService.error('Credit due date is required for credit mode.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        invoiceNumber,
        customerId: Number(customerId),
        saleDate: new Date(saleDate).toISOString(),
        paidAmount: normalizedPaidAmount,
        creditDueDate: paymentMode === 'credit' ? new Date(creditDueDate).toISOString() : null,
        items: items.map((item) => ({
          partId: Number(item.partId),
          quantity: Number(item.quantity),
        })),
      }
      const invoice = await createSalesInvoice(payload)
      toastService.success('Sales invoice created.')
      navigate(`/staff/sales-invoices/${invoice.salesInvoiceId}`)
    } catch (error) {
      toastService.error(error.message || 'Failed to create sales invoice.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StaffLayout>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-5xl font-black tracking-tight text-on-surface">Create Sales Invoice</h2>
          <p className="text-body-sm text-on-surface-variant">Sell parts to customers with live stock validation and automatic loyalty discount.</p>
        </div>
      </div>
      <InvoiceBuilder
        mode="sales"
        invoiceNumber={invoiceNumber}
        onInvoiceNumberChange={setInvoiceNumber}
        partyLabel="Customer"
        partyValue={customerId}
        onPartyChange={setCustomerId}
        parties={customerOptions}
        dateLabel="Sale date"
        dateValue={saleDate}
        onDateChange={setSaleDate}
        parts={parts}
        items={items}
        onAddItem={() => setItems((current) => [...current, blankItem()])}
        onRemoveItem={(index) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
        onItemChange={handleItemChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        disableInvoiceNumberEdit
        paymentMode={paymentMode}
        onPaymentModeChange={setPaymentMode}
        paidAmount={paidAmount}
        onPaidAmountChange={setPaidAmount}
        creditDueDate={creditDueDate}
        onCreditDueDateChange={setCreditDueDate}
        hasAttemptedSubmit={hasAttemptedSubmit}
      />
    </StaffLayout>
  )
}

export default SalesInvoicePage
