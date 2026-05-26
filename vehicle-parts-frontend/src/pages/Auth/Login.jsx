import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import Button from '../../components/common/Button'
import Icon from '../../components/common/Icon'
import { login } from '../../api/authApi'
import useToggle from '../../hooks/useToggle'
import { getAuthenticatedHomeRoute, getRoleHomeRoute, isAuthenticated } from '../../services/authService'
import { toastService } from '../../services/toastService'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const { value: showPassword, toggle: togglePasswordVisibility } = useToggle(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getAuthenticatedHomeRoute(), { replace: true })
    }
  }, [navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters'
    setErrors(next)
    setSubmitError('')

    if (Object.keys(next).length > 0) return

    try {
      setLoading(true)
      const response = await login({
        email: form.email.trim(),
        password: form.password,
      })

      localStorage.removeItem('accessToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRoles')

      sessionStorage.setItem('accessToken', response.accessToken)
      sessionStorage.setItem('userId', String(response.userId))
      sessionStorage.setItem('userEmail', response.email || form.email.trim())
      sessionStorage.setItem('userRoles', JSON.stringify(response.roles || []))

      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('userId', String(response.userId))
      localStorage.setItem('userEmail', response.email || form.email.trim())
      localStorage.setItem('userRoles', JSON.stringify(response.roles || []))

      toastService.success('Login successful.')
      navigate(getRoleHomeRoute(response.roles || []), { replace: true })
    } catch (error) {
      const message = error.message || 'Invalid credentials. Please try again.'
      setSubmitError(message)
      toastService.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to your TorqueHub account to manage your fleet."
      altText="Don't have an account?"
      altLink="Register"
      altTo="/register"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthInput
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-label-caps text-on-surface-variant">Password</label>
            <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary-container">Forgot Password?</Link>
          </div>
          <div className="relative">
            <input
              className={`h-[44px] w-full rounded-lg border px-4 pr-16 text-body-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed ${errors.password ? 'border-error' : 'border-outline-variant'}`}
              placeholder="••••••••"
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

        <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
          <Icon className="text-sm" name="login" />
        </Button>
        {submitError ? (
          <div className="space-y-2">
            <p className="text-xs text-error">{submitError}</p>
            {submitError === 'Please verify your email before logging in.' ? (
              <p className="text-xs text-on-surface-variant">
                Check your inbox or spam folder for the verification email sent during registration.
              </p>
            ) : null}
          </div>
        ) : null}
      </form>

    </AuthLayout>
  )
}

export default Login
