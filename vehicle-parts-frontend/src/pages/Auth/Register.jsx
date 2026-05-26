import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import Button from '../../components/common/Button'
import { registerCustomer } from '../../api/authApi'
import { toastService } from '../../services/toastService'
import useToggle from '../../hooks/useToggle'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [accepted, setAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { value: showPassword, toggle: togglePasswordVisibility } = useToggle(false)
  const { value: showConfirmPassword, toggle: toggleConfirmPasswordVisibility } = useToggle(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Full name is required'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    if (form.password.length < 8) next.password = 'Use at least 8 characters'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match'
    if (!accepted) next.terms = 'You must accept terms'
    setErrors(next)
    setSubmitError('')

    if (Object.keys(next).length > 0) return

    try {
      setIsSubmitting(true)
      await registerCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      toastService.success('Account created successfully. A verification email has been sent to your address.')
      navigate('/login', { replace: true })
    } catch (error) {
      const message = error.message || 'Registration failed. Please try again.'
      setSubmitError(message)
      toastService.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join the industrial network for high-performance parts." altText="Already have an account?" altLink="Login" altTo="/login">
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput label="Full Name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />

        <AuthInput label="Email" type="email" placeholder="name@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />

        <div className="space-y-1">
          <label className="text-label-caps text-on-surface-variant">Password</label>
          <div className="relative">
            <input
              className={`h-[44px] w-full rounded-lg border px-4 pr-16 text-body-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed ${
                errors.password ? 'border-error' : 'border-outline-variant'
              }`}
              placeholder="Create a strong password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password ? <p className="text-xs text-error">{errors.password}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="text-label-caps text-on-surface-variant">Confirm Password</label>
          <div className="relative">
            <input
              className={`h-[44px] w-full rounded-lg border px-4 pr-16 text-body-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed ${
                errors.confirmPassword ? 'border-error' : 'border-outline-variant'
              }`}
              placeholder="Repeat your password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword ? <p className="text-xs text-error">{errors.confirmPassword}</p> : null}
        </div>

        <div className="flex items-start gap-2">
          <input
            checked={accepted}
            className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            id="terms"
            onChange={(e) => setAccepted(e.target.checked)}
            type="checkbox"
          />
          <label className="text-body-sm text-on-surface-variant" htmlFor="terms">
            I agree to the <Link className="text-primary hover:underline" to="#">Terms of Service</Link> and <Link className="text-primary hover:underline" to="#">Privacy Policy</Link>.
          </label>
        </div>
        {errors.terms ? <p className="text-xs text-error">{errors.terms}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
        {submitError ? <p className="text-xs text-error">{submitError}</p> : null}
      </form>
    </AuthLayout>
  )
}

export default Register
