import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/common/Button'
import AuthInput from '../../components/auth/AuthInput'
import { resetPassword } from '../../api/authApi'
import { toastService } from '../../services/toastService'
import useToggle from '../../hooks/useToggle'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { value: showNewPassword, toggle: toggleNewPassword } = useToggle(false)
  const { value: showConfirmPassword, toggle: toggleConfirmPassword } = useToggle(false)

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setForm((prev) => ({ ...prev, email }))
    }
  }, [searchParams])

  const token = searchParams.get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    if (form.password.length < 8) next.password = 'Use at least 8 characters'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords must match'
    if (!token) {
      next.token = 'Missing reset token. Please use the link from your email.'
    }
    setErrors(next)
    setSubmitError('')

    if (Object.keys(next).length > 0) return

    try {
      setLoading(true)
      await resetPassword({ email: form.email.trim(), token, newPassword: form.password })
      setSuccess(true)
      toastService.success('Password reset successfully.')
    } catch (error) {
      setSubmitError(error.message || 'Unable to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Set a new password using the link sent to your email."
      altText="Remembered your password?"
      altLink="Login"
      altTo="/login"
    >
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8">
        {success ? (
          <div className="space-y-4 text-center">
            <p className="text-base font-semibold text-slate-900">Your password has been reset.</p>
            <p className="text-sm text-slate-600">You can now sign in with your new password.</p>
            <Button type="button" className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />
            <div className="space-y-1">
              <label className="text-label-caps text-on-surface-variant">New Password</label>
              <div className="relative">
                <input
                  className={`h-[44px] w-full rounded-lg border px-4 pr-16 text-body-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed ${errors.password ? 'border-error' : 'border-outline-variant'}`}
                  placeholder="Create a new password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
                  onClick={toggleNewPassword}
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password ? <p className="text-xs text-error">{errors.password}</p> : null}
            </div>
            <div className="space-y-1">
              <label className="text-label-caps text-on-surface-variant">Confirm Password</label>
              <div className="relative">
                <input
                  className={`h-[44px] w-full rounded-lg border px-4 pr-16 text-body-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed ${errors.confirmPassword ? 'border-error' : 'border-outline-variant'}`}
                  placeholder="Repeat new password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
                  onClick={toggleConfirmPassword}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword ? <p className="text-xs text-error">{errors.confirmPassword}</p> : null}
            </div>
            {errors.token ? <p className="text-xs text-error">{errors.token}</p> : null}
            {submitError ? <p className="text-xs text-error">{submitError}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting password...' : 'Reset Password'}
            </Button>
            <p className="text-xs text-on-surface-variant">
              If the link did not work, request another password reset from the <Link className="text-primary hover:underline" to="/forgot-password">Forgot Password</Link> page.
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}

export default ResetPassword
