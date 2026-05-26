import { useEffect, useState } from 'react'
import { getStockTransactions } from '../../../api/stockTransactionApi'
import AdminLayout from '../../../layout/AdminLayout'
import AdminTable from '../../../components/admin/AdminTable'
import { formatDate } from '../../../utils/invoiceUtils'
import { toastService } from '../../../services/toastService'

function StockTransactionListPage() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await getStockTransactions()
        setTransactions(Array.isArray(data) ? data : [])
      } catch (error) {
        toastService.error(error.message || 'Failed to load stock transactions.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadTransactions()
  }, [])

  return (
    <AdminLayout contentClassName="px-6 pb-10">
      <div className="mb-8">
        <h2 className="text-5xl font-black tracking-tight text-on-surface">Stock Transactions</h2>
        <p className="text-body-sm text-on-surface-variant">Audit trail for every automatic stock decrease from sales invoices.</p>
      </div>
      <AdminTable
        columns={[
          { key: 'date', label: 'Date', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
          { key: 'part', label: 'Part', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
          { key: 'reference', label: 'Reference', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
          { key: 'source', label: 'Source', className: 'px-lg py-md font-label-caps text-label-caps uppercase' },
          { key: 'before', label: 'Before', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
          { key: 'change', label: 'Change', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
          { key: 'after', label: 'After', className: 'px-lg py-md font-label-caps text-label-caps uppercase text-right' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && transactions.length === 0}
        loadingText="Loading transactions..."
        emptyText="No stock transactions found."
        tableClassName="w-full text-left"
      >
        {transactions.map((transaction) => (
          <tr key={transaction.stockTransactionId} className="hover:bg-surface-container-low">
            <td className="px-lg py-md text-on-surface-variant">{formatDate(transaction.createdAtUtc)}</td>
            <td className="px-lg py-md font-semibold">{transaction.partName}</td>
            <td className="px-lg py-md font-mono text-sm text-primary">{transaction.referenceNumber}</td>
            <td className="px-lg py-md text-on-surface-variant">
              {transaction.customerName
                || transaction.staffName
                || (transaction.transactionType === 'Purchase' ? 'Purchase Restock' : 'System')}
            </td>
            <td className="px-lg py-md text-right">{transaction.quantityBefore}</td>
            <td
              className={`px-lg py-md text-right font-bold ${
                Number(transaction.quantityChange) < 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {transaction.quantityChange}
            </td>
            <td className="px-lg py-md text-right font-bold">{transaction.quantityAfter}</td>
          </tr>
        ))}
      </AdminTable>
    </AdminLayout>
  )
}

export default StockTransactionListPage

