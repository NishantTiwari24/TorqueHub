function AdminTable({
  title,
  action,
  columns,
  isLoading = false,
  loadingText = 'Loading...',
  isEmpty = false,
  emptyText = 'No records found.',
  colSpan,
  children,
  containerClassName = 'bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden',
  toolbarClassName = 'p-lg border-b border-outline-variant bg-surface-container-low flex items-center justify-between',
  overflowClassName = 'overflow-x-auto',
  tableClassName = 'w-full text-left border-collapse',
  headRowClassName = 'bg-surface-container-low border-b border-outline-variant',
  bodyClassName = 'divide-y divide-outline-variant',
}) {
  const resolvedColSpan = colSpan ?? columns.length

  return (
    <div className={containerClassName}>
      {(title || action) && (
        <div className={toolbarClassName}>
          <h3 className="font-h3 text-body-base font-semibold">{title}</h3>
          {action}
        </div>
      )}

      <div className={overflowClassName}>
        <table className={tableClassName}>
          <thead>
            <tr className={headRowClassName}>
              {columns.map((column) => (
                <th key={column.key} className={column.className}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={bodyClassName}>
            {isLoading ? (
              <tr>
                <td className="px-lg py-10 text-center text-on-surface-variant" colSpan={resolvedColSpan}>
                  {loadingText}
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td className="px-lg py-10 text-center text-on-surface-variant" colSpan={resolvedColSpan}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminTable
