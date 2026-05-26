import { useEffect, useRef, useState } from 'react'
import CustomerLayout from '../../../layout/CustomerLayout'
import { patchMyCustomerProfile } from '../../../api/customerApi'
import { changeMyPassword, getMe, updateMe, uploadProfileImage } from '../../../api/authApi'
import { getMyVehicles } from '../../../api/vehicleApi'
import { toastService } from '../../../services/toastService'
import { setStoredUserProfile } from '../../../services/authService'
import useToggle from '../../../hooks/useToggle'

function CustomerProfile() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [vehicleCount, setVehicleCount] = useState(0)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    createdAtUtc: '',
    profileImageUrl: '',
  })
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [avatarPreview, setAvatarPreview] = useState('')
  const fileInputRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const { value: showCurrentPassword, toggle: toggleCurrentPassword } = useToggle(false)
  const { value: showNewPassword, toggle: toggleNewPassword } = useToggle(false)
  const { value: showConfirmPassword, toggle: toggleConfirmPassword } = useToggle(false)
  const fallbackAvatar = 'https://ui-avatars.com/api/?name=Customer&background=0D8ABC&color=fff'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [me, vehicles] = await Promise.all([getMe(), getMyVehicles()])
        setProfile({
          name: me.name || '',
          email: me.email || '',
          phone: me.phoneNumber || '',
          role: Array.isArray(me.roles) ? me.roles.join(', ') : 'Customer',
          createdAtUtc: me.createdAtUtc || '',
          profileImageUrl: me.profileImageUrl || '',
        })
        setAvatarPreview(me.profileImageUrl || '')
        setStoredUserProfile({
          name: me.name || '',
          email: me.email || '',
          phoneNumber: me.phoneNumber || '',
          profileImageUrl: me.profileImageUrl || '',
          roles: Array.isArray(me.roles) ? me.roles : ['Customer'],
        })
        setVehicleCount(Array.isArray(vehicles) ? vehicles.length : 0)
      } catch (error) {
        setLoadError(error.message || 'Failed to load profile details.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const upload = await uploadProfileImage(file)
      setAvatarPreview(upload.url)
      setProfile((prev) => ({ ...prev, profileImageUrl: upload.url }))
      setStoredUserProfile({ ...profile, profileImageUrl: upload.url })
      toastService.success('Profile image uploaded.')
    } catch (error) {
      toastService.error(error.message || 'Failed to upload profile image.')
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await patchMyCustomerProfile({
        userName: profile.email,
        phoneNumber: profile.phone,
      })

      // Keep auth profile in sync for header/avatar metadata.
      await updateMe({
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phone,
        profileImageUrl: profile.profileImageUrl || null,
      })

      setStoredUserProfile({
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phone,
        profileImageUrl: profile.profileImageUrl || '',
      })
      toastService.success('Profile updated successfully.')
    } catch (error) {
      toastService.error(error.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const passwordRequirements = [
    { label: 'Minimum 6 characters', isMet: password.next.length >= 6 },
    { label: 'At least one uppercase letter', isMet: /[A-Z]/.test(password.next) },
    { label: 'At least one lowercase letter', isMet: /[a-z]/.test(password.next) },
    { label: 'At least one number', isMet: /\d/.test(password.next) },
  ]

  const handlePasswordUpdate = async () => {
    if (!password.current || !password.next || !password.confirm) {
      toastService.error('Enter your current password and new password.')
      return
    }

    if (password.next !== password.confirm) {
      toastService.error('New password and confirmation do not match.')
      return
    }

    const unmetRequirement = passwordRequirements.find((requirement) => !requirement.isMet)
    if (unmetRequirement) {
      toastService.error(unmetRequirement.label)
      return
    }

    try {
      setIsPasswordSaving(true)
      await changeMyPassword({
        currentPassword: password.current,
        newPassword: password.next,
      })
      setPassword({ current: '', next: '', confirm: '' })
      toastService.success('Password updated successfully.')
    } catch (error) {
      toastService.error(error.message || 'Failed to update password.')
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const formatJoinedDate = (value) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <CustomerLayout>
      <div className="p-6 lg:p-10 w-full pb-24 lg:pb-10">
        <header className="mb-xl">
          <h1 className="text-5xl font-black tracking-tight text-on-surface mb-2">My Profile</h1>
          <p className="text-body-base text-on-surface-variant max-w-2xl">Update your personal details, profile photo, and password.</p>
        </header>

        {loadError ? (
          <div className="rounded-xl border border-error/40 bg-error-container/30 px-6 py-4 text-sm text-error mb-6">{loadError}</div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
          <div className="xl:col-span-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-md">
                  <img
                    alt={profile.name || 'Customer'}
                    className="w-24 h-24 rounded-full border-4 border-surface-container object-cover"
                    src={avatarPreview || fallbackAvatar}
                    onError={() => setAvatarPreview(fallbackAvatar)}
                  />
                  <button className="absolute -bottom-1 -right-1 bg-primary text-on-primary p-2 rounded-full shadow-lg border-2 border-white hover:bg-primary-container transition-colors" onClick={() => fileInputRef.current?.click()} type="button">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  </button>
                </div>
                <input ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoPick} type="file" />
                <h2 className="font-h3 text-h3 text-on-surface">{profile.name || (isLoading ? 'Loading...' : 'Customer')}</h2>
                <p className="text-body-sm text-outline">{profile.role || 'Customer'}</p>
                <p className="text-body-sm text-on-surface-variant mb-lg mt-1">Joined {formatJoinedDate(profile.createdAtUtc)}</p>
                <div className="text-body-sm text-on-surface-variant">Active Vehicles: {isLoading ? '-' : vehicleCount}</div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-gutter">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">person</span>
                <h3 className="font-h3 text-h3">Personal Information</h3>
              </div>
              <div className="p-lg">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-lg" onSubmit={(e) => e.preventDefault()}>
                  <label className="space-y-sm">
                    <span className="font-label-caps text-on-surface-variant">Full Name</span>
                    <input className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary" value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} />
                  </label>
                  <label className="space-y-sm">
                    <span className="font-label-caps text-on-surface-variant">Email</span>
                    <input className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary" type="email" value={profile.email} onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} />
                  </label>
                  <label className="space-y-sm md:col-span-2">
                    <span className="font-label-caps text-on-surface-variant">Phone</span>
                    <input className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary" type="tel" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
                  </label>
                  <label className="space-y-sm md:col-span-2">
                    <span className="font-label-caps text-on-surface-variant">Role</span>
                    <input className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant px-3 cursor-not-allowed" value={profile.role} readOnly />
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <button className="bg-primary text-on-primary px-lg py-2 rounded-lg font-button hover:bg-teal-700 transition-all active:scale-95 shadow-md min-w-[200px] disabled:opacity-60" type="button" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Information'}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">security</span>
                <h3 className="font-h3 text-h3">Security &amp; Password</h3>
              </div>
              <div className="p-lg">
                <div className="mb-lg p-md bg-surface-container-low rounded-lg flex items-start gap-md">
                  <span className="material-symbols-outlined text-tertiary">info</span>
                  <p className="text-body-sm text-on-surface-variant">
                    Use your current password before setting a new one for your customer account.
                  </p>
                </div>

                <form className="space-y-lg w-full" onSubmit={(e) => e.preventDefault()}>
                  <label className="space-y-sm block">
                    <span className="font-label-caps text-on-surface-variant">Current Password</span>
                    <div className="relative">
                      <input
                        className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary px-3 pr-16"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={password.current}
                        onChange={(e) => setPassword((prev) => ({ ...prev, current: e.target.value }))}
                      />
                      <button
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
                        onClick={toggleCurrentPassword}
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                        type="button"
                      >
                        {showCurrentPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <label className="space-y-sm">
                      <span className="font-label-caps text-on-surface-variant">New Password</span>
                      <div className="relative">
                        <input
                          className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary px-3 pr-16"
                          type={showNewPassword ? 'text' : 'password'}
                          value={password.next}
                          onChange={(e) => setPassword((prev) => ({ ...prev, next: e.target.value }))}
                        />
                        <button
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
                          onClick={toggleNewPassword}
                          title={showNewPassword ? 'Hide password' : 'Show password'}
                          type="button"
                        >
                          {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </label>
                    <label className="space-y-sm">
                      <span className="font-label-caps text-on-surface-variant">Confirm New Password</span>
                      <div className="relative">
                        <input
                          className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary px-3 pr-16"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={password.confirm}
                          onChange={(e) => setPassword((prev) => ({ ...prev, confirm: e.target.value }))}
                        />
                        <button
                          aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-container"
                          onClick={toggleConfirmPassword}
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                          type="button"
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="bg-surface-container-low p-md rounded-lg space-y-2">
                    <p className="text-label-caps text-outline">Password Requirements</p>
                    {passwordRequirements.map((requirement) => (
                      <div className={`flex items-center gap-2 text-body-sm ${requirement.isMet ? 'text-on-primary-container' : 'text-on-surface-variant'}`} key={requirement.label}>
                        <span
                          className={`material-symbols-outlined text-[16px] ${requirement.isMet ? 'text-primary' : ''}`}
                          style={requirement.isMet ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {requirement.isMet ? 'check_circle' : 'circle'}
                        </span>
                        {requirement.label}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-md border-t border-outline-variant">
                    <button
                      className="bg-primary text-on-primary px-lg py-2 rounded-lg font-button hover:bg-teal-700 transition-all active:scale-95 shadow-md min-w-[200px] disabled:opacity-60"
                      type="button"
                      onClick={handlePasswordUpdate}
                      disabled={isPasswordSaving}
                    >
                      {isPasswordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default CustomerProfile
