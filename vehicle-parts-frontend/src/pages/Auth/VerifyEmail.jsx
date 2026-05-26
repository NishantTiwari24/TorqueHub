import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/common/Button'
import { verifyEmail } from '../../api/authApi'
import { toastService } from '../../services/toastService'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('pending')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const userId = searchParams.get('userId')
    const token = searchParams.get('token')

    if (!userId || !token) {
      setStatus('error')
      setMessage('The verification link is invalid or missing required parameters.')
      return
    }

    void verifyEmail(userId, token)
      .then(() => {
        setStatus('success')
        setMessage('Your email has been verified successfully. You can now sign in.')
        toastService.success('Email verified successfully.')
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message || 'Unable to verify your email. Please try again or contact support.')
      })
  }, [searchParams])

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Confirm your email so you can access your TorqueHub account."
      altText="Already verified?"
      altLink="Sign In"
      altTo="/login"
    >
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
        <p className={`mb-6 text-sm font-semibold ${status === 'error' ? 'text-error' : 'text-slate-700'}`}>{message}</p>
        <div className="space-y-3">
          {status === 'success' ? (
            <Button type="button" className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          ) : (
            <div className="space-y-2">
              <Button type="button" className="w-full" disabled={status === 'pending'} onClick={() => navigate('/login')}>
                Back to Sign In
              </Button>
              <p className="text-xs text-on-surface-variant">
                If you still have trouble, check your verification email again or contact support.
              </p>
            </div>
          )}
        </div>
        <p className="mt-6 text-xs text-on-surface-variant">
          Verification emails are sent automatically during account registration. If you have not received one, check your spam folder.
        </p>
      </div>
    </AuthLayout>
  )
}

export default VerifyEmail
