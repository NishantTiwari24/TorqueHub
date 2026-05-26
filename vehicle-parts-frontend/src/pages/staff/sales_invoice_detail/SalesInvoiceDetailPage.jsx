import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSalesInvoiceById } from '../../../api/invoiceApi'
import InvoiceDetail from '../../../components/invoice/InvoiceDetail'
import StaffLayout from '../../../layout/StaffLayout'
import { toastService } from '../../../services/toastService'

function SalesInvoiceDetailPage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setInvoice(await getSalesInvoiceById(id))
      } catch (error) {
        toastService.error(error.message || 'Failed to load sales invoice.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInvoice()
  }, [id])

  return (
    <StaffLayout>
      {isLoading && <p className="text-on-surface-variant">Loading invoice...</p>}
      {!isLoading && invoice && <InvoiceDetail invoice={invoice} type="sales" backTo="/staff/sales-invoices" />}
    </StaffLayout>
  )
}

export default SalesInvoiceDetailPage
