import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPurchaseInvoiceById } from '../../../api/invoiceApi'
import InvoiceDetail from '../../../components/invoice/InvoiceDetail'
import AdminLayout from '../../../layout/AdminLayout'
import { toastService } from '../../../services/toastService'

function PurchaseInvoiceDetailPage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setInvoice(await getPurchaseInvoiceById(id))
      } catch (error) {
        toastService.error(error.message || 'Failed to load purchase invoice.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInvoice()
  }, [id])

  return (
    <AdminLayout contentClassName="px-6 pb-10">
      {isLoading && <p className="text-on-surface-variant">Loading invoice...</p>}
      {!isLoading && invoice && <InvoiceDetail invoice={invoice} type="purchase" backTo="/admin/purchase-invoice" />}
    </AdminLayout>
  )
}

export default PurchaseInvoiceDetailPage
