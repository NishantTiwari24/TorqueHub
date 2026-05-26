import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../api/authApi'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthInput from '../../components/auth/AuthInput'
import Button from '../../components/common/Button'
import { toastService } from '../../services/toastService'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email')
      return
    }

    setError('')
    try {
      setIsSubmitting(true)
      await forgotPassword({ email: email.trim() })
      toastService.success('If your account exists, reset instructions were sent to your email.')
    } catch (submitError) {
      toastService.error(submitError.message || 'Failed to process forgot password request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your account email and we will send reset instructions." altText="Remembered your password?" altLink="Back to Login" altTo="/login">
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthInput label="Email Address" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPassword

