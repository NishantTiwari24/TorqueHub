import { useEffect, useMemo, useState } from 'react'
import { getMyAppointments } from '../../../api/appointmentApi'
import { createReview, deleteReview, getMyReviews, updateReview } from '../../../api/reviewApi'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import CustomerLayout from '../../../layout/CustomerLayout'
import { toastService } from '../../../services/toastService'

const initialForm = {
  appointmentId: '',
  rating: 5,
  comment: '',
}

function CustomerReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [reviewToDelete, setReviewToDelete] = useState(null)

  useEffect(() => {
    void loadReviews()
  }, [])

  const sortedReviews = useMemo(
    () =>
      [...reviews].sort((first, second) => {
        const firstDate = new Date(first.createdAtUtc).getTime()
        const secondDate = new Date(second.createdAtUtc).getTime()
        return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate)
      }),
    [reviews],
  )

  const appointmentOptions = useMemo(() => {
    const reviewedAppointmentIds = new Set(
      reviews
        .filter((review) => review.reviewId !== editingId && review.appointmentId)
        .map((review) => Number(review.appointmentId)),
    )

    const completedAppointments = appointments
      .filter((appointment) => String(appointment.status || '').toLowerCase() === 'completed')
      .sort((first, second) => {
        const firstDate = new Date(first.date).getTime()
        const secondDate = new Date(second.date).getTime()
        return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate)
      })

    if (editingId) return completedAppointments
    return completedAppointments.filter((appointment) => !reviewedAppointmentIds.has(Number(appointment.appointmentId)))
  }, [appointments, editingId, reviews])

  const summary = useMemo(() => {
    const total = reviews.length
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0)
    const average = total ? totalRating / total : 0
    const counts = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => Number(review.rating) === rating).length,
      percentage: total ? (reviews.filter((review) => Number(review.rating) === rating).length / total) * 100 : 0,
    }))

    return {
      total,
      average,
      counts,
    }
  }, [reviews])

  async function loadReviews() {
    try {
      setLoading(true)
      setLoadError('')
      const [reviewData, appointmentData] = await Promise.all([
        getMyReviews(),
        getMyAppointments(),
      ])
      setReviews(Array.isArray(reviewData) ? reviewData : [])
      setAppointments(Array.isArray(appointmentData) ? appointmentData : [])
    } catch (error) {
      const message = error.message || 'Failed to load reviews.'
      setLoadError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field) => (event) => {
    const value = field === 'rating' ? Number(event.target.value) : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSuccessMessage('')
  }

  const handleRatingChange = (rating) => {
    setForm((current) => ({ ...current, rating }))
    setErrors((current) => ({ ...current, rating: '' }))
    setSuccessMessage('')
  }

  const validateForm = () => {
    const nextErrors = {}
    const appointmentId = form.appointmentId.trim() ? Number(form.appointmentId) : null
    const rating = Number(form.rating)
    const comment = form.comment.trim()

    if (!editingId) {
      if (appointmentId === null) {
        nextErrors.appointmentId = 'Choose a completed appointment.'
      } else if (!Number.isInteger(appointmentId) || appointmentId < 1 || !appointmentOptions.some((appointment) => Number(appointment.appointmentId) === appointmentId)) {
        nextErrors.appointmentId = 'Choose one of your completed appointments.'
      }
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      nextErrors.rating = 'Rating must be between 1 and 5.'
    }

    if (!comment) {
      nextErrors.comment = 'Review comment is required.'
    } else if (comment.length > 500) {
      nextErrors.comment = 'Review comment must be 500 characters or fewer.'
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

    try {
      setIsSubmitting(true)

      if (editingId) {
        setActionId(editingId)
        const updatedReview = await updateReview(editingId, {
          rating: Number(form.rating),
          comment: form.comment.trim(),
        })

        setReviews((current) => current.map((review) => (review.reviewId === updatedReview.reviewId ? updatedReview : review)))
        setSuccessMessage('Review updated successfully.')
        toastService.success('Review updated successfully.')
      } else {
        const appointmentId = Number(form.appointmentId)
        const createdReview = await createReview({
          appointmentId,
          rating: Number(form.rating),
          comment: form.comment.trim(),
        })

        setReviews((current) => [createdReview, ...current])
        setSuccessMessage('Review submitted successfully.')
        toastService.success('Review submitted successfully.')
      }

      resetForm()
    } catch (error) {
      toastService.error(error.message || 'Failed to save review.')
    } finally {
      setIsSubmitting(false)
      setActionId(null)
    }
  }

  const startEdit = (review) => {
    setEditingId(review.reviewId)
    setForm({
      appointmentId: review.appointmentId ? String(review.appointmentId) : '',
      rating: Number(review.rating) || 5,
      comment: review.comment || '',
    })
    setErrors({})
    setSuccessMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!reviewToDelete) return

    try {
      setActionId(reviewToDelete.reviewId)
      await deleteReview(reviewToDelete.reviewId)
      setReviews((current) => current.filter((item) => item.reviewId !== reviewToDelete.reviewId))

      if (editingId === reviewToDelete.reviewId) {
        resetForm()
      }

      setReviewToDelete(null)
      toastService.success('Review deleted successfully.')
    } catch (error) {
      toastService.error(error.message || 'Failed to delete review.')
    } finally {
      setActionId(null)
    }
  }

  const resetForm = () => {
    setForm(initialForm)
    setErrors({})
    setEditingId(null)
  }

  const fieldClassName = (field) =>
    `w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 ${
      errors[field] ? 'border-red-400' : 'border-slate-200'
    }`

  return (
    <CustomerLayout>
      <div className="w-full p-6 pb-24 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-5xl font-black tracking-tight text-on-surface">My Reviews</h1>
              <p className="mt-2 max-w-3xl text-body-base text-on-surface-variant">
                Share your experience and manage reviews from your customer account.
              </p>
            </div>
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled={loading}
              onClick={() => void loadReviews()}
            >
              Refresh Reviews
            </button>
          </header>

          {successMessage ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="order-2 space-y-5 xl:order-1 xl:col-span-8">
              <ReviewSummary summary={summary} />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-slate-900">Your Reviews</h2>
                  <p className="text-sm text-slate-500">Reviews you submitted are shown here.</p>
                </div>

                {loading ? (
                  <LoadingState />
                ) : loadError ? (
                  <ErrorState message={loadError} onRetry={() => void loadReviews()} />
                ) : sortedReviews.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-4">
                    {sortedReviews.map((review) => (
                      <ReviewCard
                        key={review.reviewId}
                        review={review}
                        isBusy={actionId === review.reviewId}
                        isEditing={editingId === review.reviewId}
                        onEdit={() => startEdit(review)}
                        onDelete={() => setReviewToDelete(review)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="order-1 xl:order-2 xl:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    {editingId ? 'Edit Review' : 'Write a Review'}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {editingId ? `Review #${editingId}` : 'Service feedback'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingId
                      ? 'Only rating and comment can be changed for an existing review.'
                      : 'Choose a completed appointment. Rating and comment are required.'}
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Completed Appointment
                    </label>
                    <select
                      className={`${fieldClassName('appointmentId')} h-12 disabled:cursor-not-allowed disabled:opacity-70`}
                      disabled={Boolean(editingId)}
                      value={form.appointmentId}
                      onChange={handleFieldChange('appointmentId')}
                    >
                      <option value="">
                        {loading ? 'Loading completed appointments...' : editingId ? 'No appointment recorded' : 'Select a completed appointment'}
                      </option>
                      {editingId && form.appointmentId && !appointmentOptions.some((appointment) => Number(appointment.appointmentId) === Number(form.appointmentId)) ? (
                        <option value={form.appointmentId}>Appointment #{form.appointmentId}</option>
                      ) : null}
                      {appointmentOptions.map((appointment) => (
                        <option key={appointment.appointmentId} value={appointment.appointmentId}>
                          {formatAppointmentOption(appointment)}
                        </option>
                      ))}
                    </select>
                    {errors.appointmentId ? <p className="mt-2 text-xs text-red-500">{errors.appointmentId}</p> : null}
                    {!loading && !editingId && appointmentOptions.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">Only completed appointments without an existing review appear here.</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          className={`material-symbols-outlined text-[34px] transition-transform hover:scale-110 ${
                            rating <= Number(form.rating) ? 'text-primary' : 'text-slate-300'
                          }`}
                          type="button"
                          onClick={() => handleRatingChange(rating)}
                        >
                          star
                        </button>
                      ))}
                    </div>
                    <select
                      className="sr-only"
                      value={form.rating}
                      onChange={handleFieldChange('rating')}
                      aria-label="Rating"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}
                        </option>
                      ))}
                    </select>
                    {errors.rating ? <p className="mt-2 text-xs text-red-500">{errors.rating}</p> : null}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Your Experience
                      </label>
                      <span className="text-xs text-slate-400">{form.comment.length}/500</span>
                    </div>
                    <textarea
                      className={`${fieldClassName('comment')} min-h-[150px] resize-y py-3`}
                      maxLength="500"
                      placeholder="Describe the service quality, communication, or parts experience."
                      rows="6"
                      value={form.comment}
                      onChange={handleFieldChange('comment')}
                    ></textarea>
                    {errors.comment ? <p className="mt-2 text-xs text-red-500">{errors.comment}</p> : null}
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end xl:flex-col-reverse">
                    <button
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      type="button"
                      onClick={() => {
                        resetForm()
                        setSuccessMessage('')
                      }}
                    >
                      {editingId ? 'Cancel Edit' : 'Clear'}
                    </button>
                    <button
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
                      type="submit"
                      disabled={isSubmitting || (!editingId && appointmentOptions.length === 0)}
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                      {isSubmitting ? 'Saving...' : editingId ? 'Update Review' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={Boolean(reviewToDelete)}
        title="Delete Review"
        message="Delete this review? This action cannot be undone."
        confirmLabel="Delete Review"
        cancelLabel="Keep Review"
        confirmVariant="danger"
        isLoading={Boolean(reviewToDelete && actionId === reviewToDelete.reviewId)}
        onCancel={() => {
          if (actionId) return
          setReviewToDelete(null)
        }}
        onConfirm={() => void handleDelete()}
      />
    </CustomerLayout>
  )
}

function ReviewSummary({ summary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="text-center md:w-40 md:text-left">
          <div className="text-5xl font-black leading-none text-primary">{summary.average.toFixed(1)}</div>
          <StarRating rating={Math.round(summary.average)} size="text-xl" />
          <div className="mt-2 text-sm text-slate-500">
            Based on {summary.total} {summary.total === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        <div className="hidden h-20 w-px bg-slate-200 md:block"></div>
        <div className="flex-1 space-y-2">
          {summary.counts.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <span className="w-4 text-xs font-bold text-slate-700">{item.rating}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }}></div>
              </div>
              <span className="w-8 text-right text-xs text-slate-500">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ review, isBusy, isEditing, onEdit, onDelete }) {
  return (
    <article className={`overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-sm ${isEditing ? 'border-primary' : 'border-slate-200'}`}>
      <div className="p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-primary">
              <span className="material-symbols-outlined">rate_review</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {review.appointmentId ? `Appointment #${review.appointmentId}` : 'General service review'}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <StarRating rating={review.rating} size="text-base" />
                <span>{formatDate(review.createdAtUtc)}</span>
                {review.updatedAtUtc ? <span>Updated {formatDate(review.updatedAtUtc)}</span> : null}
              </div>
            </div>
          </div>
          <span className="self-start rounded-full bg-primary-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary-container">
            Your Review
          </span>
        </div>
        <p className="text-base leading-relaxed text-slate-700">{review.comment}</p>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
        <button
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/5 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isBusy}
          onClick={onEdit}
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit
        </button>
        <button
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isBusy}
          onClick={onDelete}
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          {isBusy ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

function StarRating({ rating, size = 'text-lg' }) {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0))

  return (
    <div className="mt-2 flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`material-symbols-outlined ${size} ${star <= normalizedRating ? 'text-primary' : 'text-slate-300'}`}>
          star
        </span>
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-700">Loading reviews...</p>
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
      <p className="text-lg font-bold text-slate-900">No reviews yet</p>
      <p className="mt-2 text-sm text-slate-500">Submit your first review using the form on this page.</p>
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

function formatAppointmentOption(appointment) {
  const vehicleName = appointment.vehicleName || 'Vehicle appointment'
  const vehicleNumber = appointment.vehicleNumber ? ` | ${appointment.vehicleNumber}` : ''
  return `#${appointment.appointmentId} - ${vehicleName}${vehicleNumber} - ${formatDate(appointment.date)}`
}

export default CustomerReviewsPage
