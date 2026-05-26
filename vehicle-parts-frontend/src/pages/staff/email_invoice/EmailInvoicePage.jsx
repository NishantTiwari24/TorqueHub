import { useEffect, useMemo, useState } from 'react'
import { getEmailLogs, sendInvoiceEmail } from '../../../api/emailApi'
import StaffLayout from '../../../layout/StaffLayout'
import { toastService } from '../../../services/toastService'

const initialForm = {
  customerId: '',
  recipientEmail: '',
  invoiceNumber: '',
  subject: '',
  body: '',
}

function EmailInvoicePage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendResult, setSendResult] = useState(null)

  useEffect(() => {
    void loadLogs()
  }, [])

  const recentLogs = useMemo(
    () =>
      [...logs].sort((first, second) => {
        const firstDate = new Date(first.createdAtUtc).getTime()
        const secondDate = new Date(second.createdAtUtc).getTime()
        return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate)
      }),
    [logs],
  )

  async function loadLogs() {
    try {
      setLogsLoading(true)
      setLogsError('')
      const data = await getEmailLogs()
      setLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      const message = error.message || 'Failed to load email logs.'
      setLogsError(message)
      toastService.error(message)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSendResult(null)
  }

  const validateForm = () => {
    const nextErrors = {}
    const customerId = form.customerId.trim() ? Number(form.customerId) : null

    if (customerId !== null && (!Number.isInteger(customerId) || customerId < 1)) {
      nextErrors.customerId = 'Customer ID must be a positive number.'
    }

    if (!/^\S+@\S+\.\S+$/.test(form.recipientEmail.trim())) {
      nextErrors.recipientEmail = 'Enter a valid recipient email.'
    }

    if (!form.invoiceNumber.trim()) {
      nextErrors.invoiceNumber = 'Invoice number is required.'
    } else if (form.invoiceNumber.trim().length > 50) {
      nextErrors.invoiceNumber = 'Invoice number must be 50 characters or fewer.'
    }

    if (!form.subject.trim()) {
      nextErrors.subject = 'Subject is required.'
    } else if (form.subject.trim().length > 200) {
      nextErrors.subject = 'Subject must be 200 characters or fewer.'
    }

    if (!form.body.trim()) {
      nextErrors.body = 'Email body is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) {
      toastService.error('Please fix the highlighted fields.')
      return
    }

    const customerId = form.customerId.trim() ? Number(form.customerId) : null

    try {
      setIsSubmitting(true)
      const result = await sendInvoiceEmail({
        customerId,
        recipientEmail: form.recipientEmail.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
      })

      setSendResult(result)
      setLogs((current) => [result, ...current])

      if (result.isSent) {
        toastService.success('Invoice email sent successfully.')
        setForm(initialForm)
      } else {
        toastService.error(result.errorMessage || 'Invoice email was logged but not sent.')
      }
    } catch (error) {
      toastService.error(error.message || 'Failed to send invoice email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldClassName = (field) =>
    `w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 ${
      errors[field] ? 'border-red-400' : 'border-slate-200'
    }`

  return (
    <StaffLayout mainClassName="ml-64 min-h-screen bg-background px-6 pb-24 pt-28 lg:px-10 lg:pb-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <span>Sales</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary">Email Invoice</span>
            </nav>
            <h1 className="text-5xl font-black tracking-tight text-on-surface">Email Dispatch Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Send invoice emails to customers and review delivery log records.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            disabled={logsLoading}
            onClick={() => void loadLogs()}
          >
            Refresh Logs
          </button>
        </header>

        {sendResult ? (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${sendResult.isSent ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {sendResult.isSent
              ? `Invoice email sent to ${sendResult.recipientEmail}.`
              : sendResult.errorMessage || 'Email attempt was saved but not sent.'}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="xl:col-span-7">
            <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">alternate_email</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Send Invoice Email</h2>
                  <p className="mt-1 text-sm text-slate-500">Use backend-supported invoice email fields only.</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Customer ID Optional
                  </label>
                  <input
                    className={`${fieldClassName('customerId')} h-12`}
                    min="1"
                    placeholder="Example: 12"
                    type="number"
                    value={form.customerId}
                    onChange={handleChange('customerId')}
                  />
                  {errors.customerId ? <p className="mt-2 text-xs text-red-500">{errors.customerId}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Recipient Email
                  </label>
                  <input
                    className={`${fieldClassName('recipientEmail')} h-12`}
                    maxLength="150"
                    placeholder="customer@example.com"
                    type="email"
                    value={form.recipientEmail}
                    onChange={handleChange('recipientEmail')}
                  />
                  {errors.recipientEmail ? <p className="mt-2 text-xs text-red-500">{errors.recipientEmail}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Invoice Number
                  </label>
                  <input
                    className={`${fieldClassName('invoiceNumber')} h-12`}
                    maxLength="50"
                    placeholder="INV-2026-001"
                    type="text"
                    value={form.invoiceNumber}
                    onChange={handleChange('invoiceNumber')}
                  />
                  {errors.invoiceNumber ? <p className="mt-2 text-xs text-red-500">{errors.invoiceNumber}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Subject
                  </label>
                  <input
                    className={`${fieldClassName('subject')} h-12`}
                    maxLength="200"
                    placeholder="Invoice INV-2026-001"
                    type="text"
                    value={form.subject}
                    onChange={handleChange('subject')}
                  />
                  {errors.subject ? <p className="mt-2 text-xs text-red-500">{errors.subject}</p> : null}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Email Body
                  </label>
                  <textarea
                    className={`${fieldClassName('body')} min-h-[220px] resize-y py-3`}
                    placeholder="Write the invoice message for the customer."
                    rows="9"
                    value={form.body}
                    onChange={handleChange('body')}
                  ></textarea>
                  {errors.body ? <p className="mt-2 text-xs text-red-500">{errors.body}</p> : null}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  type="button"
                  onClick={() => {
                    setForm(initialForm)
                    setErrors({})
                    setSendResult(null)
                  }}
                >
                  Clear
                </button>
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  {isSubmitting ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6 xl:col-span-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Email Preview</h2>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-3 border-b border-slate-200 pb-4 text-sm">
                  <PreviewRow label="To" value={form.recipientEmail || 'customer@example.com'} />
                  <PreviewRow label="Subject" value={form.subject || 'Invoice subject'} />
                  <PreviewRow label="Invoice" value={form.invoiceNumber || 'INV-XXXX'} />
                </div>
                <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-sm text-slate-700">
                  {form.body || 'Email body preview will appear here as you type.'}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-teal-300">info</span>
                <div>
                  <h2 className="text-base font-bold">SMTP note</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    If SMTP settings are still placeholders, the backend logs the attempt with an error instead of crashing.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-bold text-slate-900">Email Logs</h2>
            <p className="mt-1 text-sm text-slate-500">Recent invoice email attempts recorded by the backend.</p>
          </div>

          <div className="p-6">
            {logsLoading ? (
              <LoadingState />
            ) : logsError ? (
              <ErrorState message={logsError} onRetry={() => void loadLogs()} />
            ) : recentLogs.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Created</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recipient</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Invoice</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Subject</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLogs.map((log) => (
                      <EmailLogRow key={log.emailLogId} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </StaffLayout>
  )
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <span className="min-w-0 flex-1 break-words font-medium text-slate-900">{value}</span>
    </div>
  )
}

function EmailLogRow({ log }) {
  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-4 align-top text-sm text-slate-500">{formatDate(log.createdAtUtc)}</td>
      <td className="px-4 py-4 align-top">
        <p className="text-sm font-semibold text-slate-900">{log.recipientEmail}</p>
        {log.customerName ? <p className="mt-1 text-xs text-slate-500">{log.customerName}</p> : null}
      </td>
      <td className="px-4 py-4 align-top font-mono text-sm font-semibold text-secondary">{log.referenceNumber || 'N/A'}</td>
      <td className="px-4 py-4 align-top">
        <p className="max-w-sm truncate text-sm font-semibold text-slate-900">{log.subject}</p>
        {log.errorMessage ? <p className="mt-1 max-w-sm text-xs text-error">{log.errorMessage}</p> : null}
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex justify-center">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${log.isSent ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {log.isSent ? 'Sent' : 'Failed'}
          </span>
        </div>
      </td>
    </tr>
  )
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-700">Loading email logs...</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{message}</p>
      <button className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm" type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-lg font-bold text-slate-900">No email logs yet</p>
      <p className="mt-2 text-sm text-slate-500">Sent invoice email attempts will appear here.</p>
    </div>
  )
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default EmailInvoicePage
