import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSalesInvoiceById } from '../../../api/invoiceApi'
import InvoiceDetail from '../../../components/invoice/InvoiceDetail'
import AdminLayout from '../../../layout/AdminLayout'
import { toastService } from '../../../services/toastService'

function AdminSalesInvoiceDetailPage() {
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
    <AdminLayout>
      {isLoading && <p className="text-on-surface-variant">Loading invoice...</p>}
      {!isLoading && invoice && <InvoiceDetail invoice={invoice} type="sales" backTo="/admin/purchase-invoice?tab=sales" />}
    </AdminLayout>
  )
}

export default AdminSalesInvoiceDetailPage
