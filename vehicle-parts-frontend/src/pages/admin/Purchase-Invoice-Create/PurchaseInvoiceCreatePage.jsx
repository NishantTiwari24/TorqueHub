import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPurchaseInvoice, getNextPurchaseInvoiceNumber } from '../../../api/invoiceApi'
import { getPartList } from '../../../api/partApi'
import { getVendorList } from '../../../api/vendorApi'
import InvoiceBuilder from '../../../components/invoice/InvoiceBuilder'
import AdminLayout from '../../../layout/AdminLayout'
import { getTodayInputValue } from '../../../utils/invoiceUtils'
import { toastService } from '../../../services/toastService'

const blankItem = () => ({ rowId: crypto.randomUUID(), partId: '', quantity: '1', condition: 'New', unitCost: '' })

function PurchaseInvoiceCreatePage() {
  const navigate = useNavigate()
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(getTodayInputValue())
  const [items, setItems] = useState([blankItem()])
  const [parts, setParts] = useState([])
  const [vendors, setVendors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [partData, vendorData] = await Promise.all([getPartList(), getVendorList()])
        setParts(Array.isArray(partData) ? partData : [])
        setVendors(Array.isArray(vendorData) ? vendorData : [])
      } catch (error) {
        toastService.error(error.message || 'Failed to load invoice data.')
      }
    }

    void loadData()
  }, [])

  useEffect(() => {
    const loadNextNumber = async () => {
      try {
        const number = await getNextPurchaseInvoiceNumber(invoiceDate)
        setInvoiceNumber(String(number || ''))
      } catch {
        setInvoiceNumber('')
      }
    }

    void loadNextNumber()
  }, [invoiceDate])

  const vendorOptions = useMemo(() => vendors.map((vendor) => ({ id: vendor.vendorId, name: vendor.name })), [vendors])
  const vendorParts = useMemo(() => {
    if (!vendorId) return parts
    return parts.filter((part) => String(part.vendorId) === String(vendorId))
  }, [parts, vendorId])

  const handleItemChange = (index, field, value) => {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const next = { ...item, [field]: value }
      if (field === 'partId') {
        const part = parts.find((entry) => String(entry.partId) === String(value))
        next.unitCost = part?.price ? String(part.price) : next.unitCost
        next.condition = part?.condition || 'New'
      }
      return next
    }))
  }

  const handleSubmit = async (event) => {
    event?.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        invoiceNumber,
        vendorId: Number(vendorId),
        invoiceDate,
        notes: '',
        items: items.map((item) => ({
          partId: Number(item.partId),
          quantity: Number(item.quantity),
          condition: parts.find((part) => String(part.partId) === String(item.partId))?.condition || item.condition || 'New',
          unitCost: Number(item.unitCost),
        })),
      }
      const invoice = await createPurchaseInvoice(payload)
      toastService.success('Purchase invoice created.')
      navigate(`/admin/purchase-invoice/${invoice.purchaseInvoiceId}`)
    } catch (error) {
      toastService.error(error.message || 'Failed to create purchase invoice.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout contentClassName="px-6 pb-10">
      <div className="mb-8">
        <h2 className="text-5xl font-black tracking-tight text-on-surface">Create Purchase Invoice</h2>
        <p className="text-body-sm text-on-surface-variant">Add vendor invoice items and increase stock after saving.</p>
      </div>
      <InvoiceBuilder
        mode="purchase"
        invoiceNumber={invoiceNumber}
        onInvoiceNumberChange={setInvoiceNumber}
        disableInvoiceNumberEdit
        partyLabel="Vendor"
        partyValue={vendorId}
        onPartyChange={setVendorId}
        parties={vendorOptions}
        dateLabel="Invoice date"
        dateValue={invoiceDate}
        onDateChange={setInvoiceDate}
        parts={vendorParts}
        items={items}
        onAddItem={() => setItems((current) => [...current, blankItem()])}
        onRemoveItem={(index) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
        onItemChange={handleItemChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </AdminLayout>
  )
}

export default PurchaseInvoiceCreatePage
