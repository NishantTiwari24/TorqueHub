import { useEffect, useRef, useState } from 'react'
import { getMe, updateMe, uploadProfileImage } from '../../../api/authApi'
import AdminLayout from '../../../layout/AdminLayout'
import { toastService } from '../../../services/toastService'
import { setStoredUserProfile } from '../../../services/authService'

function AdminProfile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    createdAtUtc: '',
    department: 'Administration',
    profileImageUrl: '',
  })
  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const fileInputRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const fallbackAvatar = 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getMe()
        setProfile((prev) => ({
          ...prev,
          name: me.name || '',
          email: me.email || '',
          phone: me.phoneNumber || '',
          role: Array.isArray(me.roles) ? me.roles.join(', ') : '',
          createdAtUtc: me.createdAtUtc || '',
          profileImageUrl: me.profileImageUrl || '',
        }))
        if (me.profileImageUrl) {
          setAvatarPreview(me.profileImageUrl)
        }
        setStoredUserProfile({
          name: me.name || '',
          email: me.email || '',
          phoneNumber: me.phoneNumber || '',
          profileImageUrl: me.profileImageUrl || '',
          roles: Array.isArray(me.roles) ? me.roles : [],
        })
      } catch (error) {
        toastService.error(error.message || 'Failed to load profile.')
      }
    }

    loadProfile()
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

  const formatJoinedDate = (value) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <AdminLayout contentClassName="p-8 pb-10">
        <header className="mb-xl">
          <h1 className="text-5xl font-black tracking-tight text-on-surface mb-2">My Admin Profile</h1>
          <p className="text-body-base text-on-surface-variant max-w-2xl">
            Update your account details, profile photo, and password from one place.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
          <div className="xl:col-span-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-md">
                  <img
                    alt={profile.name}
                    className="w-24 h-24 rounded-full border-4 border-surface-container object-cover"
                    src={avatarPreview || fallbackAvatar}
                    onError={() => setAvatarPreview(fallbackAvatar)}
                  />
                  <button
                    className="absolute -bottom-1 -right-1 bg-primary text-on-primary p-2 rounded-full shadow-lg border-2 border-white hover:bg-primary-container transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  </button>
                </div>
                <input ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoPick} type="file" />
                <h2 className="font-h3 text-h3 text-on-surface">{profile.name}</h2>
                <p className="text-body-sm text-outline">{profile.role || 'Administrator'}</p>
                <p className="text-body-sm text-on-surface-variant mb-lg mt-1">Joined {formatJoinedDate(profile.createdAtUtc)}</p>
              </div>
              <div className="border-t border-outline-variant pt-lg space-y-md">
                <div className="flex justify-between">
                  <span className="text-body-sm text-on-surface-variant">Role</span>
                  <span className="text-body-sm font-bold text-on-surface">System Admin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-on-surface-variant">Access Level</span>
                  <span className="text-body-sm font-bold text-primary">Full Access</span>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-gutter">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">person</span>
                <h3 className="font-h3 text-h3">Administrator Information</h3>
              </div>
              <div className="p-lg">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <div className="space-y-sm">
                    <label className="font-label-caps text-on-surface-variant">FULL NAME</label>
                    <input
                      className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="font-label-caps text-on-surface-variant">EMAIL</label>
                    <input
                      className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="font-label-caps text-on-surface-variant">PHONE</label>
                    <input
                      className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary"
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="font-label-caps text-on-surface-variant">ROLE</label>
                    <input
                      className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant px-3 cursor-not-allowed"
                      type="text"
                      value={profile.role}
                      readOnly
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="font-label-caps text-on-surface-variant">DEPARTMENT</label>
                    <input
                      className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary"
                      type="text"
                      value={profile.department}
                      onChange={(e) => setProfile((prev) => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button className="bg-primary text-on-primary px-lg py-2 rounded-lg font-button hover:bg-teal-700 transition-all active:scale-95 shadow-md disabled:opacity-60" type="button" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Profile Details'}
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
                    Your password was last changed 4 months ago. We recommend updating your credentials every 6 months.
                  </p>
                </div>

                <form className="space-y-lg w-full">
                  <label className="space-y-sm block">
                    <span className="font-label-caps text-on-surface-variant">Current Password</span>
                    <div className="relative">
                      <input
                        className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 pr-12 focus:border-primary focus:ring-1 focus:ring-primary"
                        type="password"
                        value={password.current}
                        onChange={(e) => setPassword((prev) => ({ ...prev, current: e.target.value }))}
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-outline" type="button">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div className="space-y-sm">
                      <label className="font-label-caps text-on-surface-variant">New Password</label>
                      <input
                        className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary"
                        type="password"
                        value={password.next}
                        onChange={(e) => setPassword((prev) => ({ ...prev, next: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-sm">
                      <label className="font-label-caps text-on-surface-variant">Confirm New Password</label>
                      <input
                        className="w-full h-[44px] rounded-lg border border-outline-variant bg-surface-container-low px-3 focus:border-primary focus:ring-1 focus:ring-primary"
                        type="password"
                        value={password.confirm}
                        onChange={(e) => setPassword((prev) => ({ ...prev, confirm: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-md rounded-lg space-y-2">
                    <p className="text-label-caps text-outline">Password Requirements</p>
                    <div className="flex items-center gap-2 text-body-sm text-on-primary-container">
                      <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                      Minimum 8 characters
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">circle</span>
                      At least one special character
                    </div>
                  </div>

                  <div className="flex justify-end pt-md border-t border-outline-variant">
                    <button className="bg-primary text-on-primary px-lg py-2 rounded-lg font-button hover:bg-teal-700 transition-all active:scale-95 shadow-md min-w-[200px]" type="button">
                      Update Security Settings
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
    </AdminLayout>
  )
}

export default AdminProfile
