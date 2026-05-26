import { useEffect, useMemo, useState } from 'react'
import { getMe } from '../api/authApi'
import { getStoredUserProfile, setStoredUserProfile } from '../services/authService'

const emptyProfile = {
  name: '',
  email: '',
  phoneNumber: '',
  profileImageUrl: '',
  roles: [],
}

export function useAuthUserProfile() {
  const [profile, setProfile] = useState(() => getStoredUserProfile() || emptyProfile)

  useEffect(() => {
    let isMounted = true

    const handleProfileUpdate = (event) => {
      const nextProfile = event.detail || getStoredUserProfile() || emptyProfile
      if (isMounted) {
        setProfile(nextProfile)
      }
    }

    const loadProfile = async () => {
      try {
        const me = await getMe()
        if (!isMounted) return
        const normalized = setStoredUserProfile({
          name: me.name || '',
          email: me.email || '',
          phoneNumber: me.phoneNumber || '',
          profileImageUrl: me.profileImageUrl || '',
          roles: Array.isArray(me.roles) ? me.roles : [],
        })
        setProfile(normalized)
      } catch {
        // Keep cached profile when request fails.
      }
    }

    window.addEventListener('auth-user-updated', handleProfileUpdate)
    loadProfile()

    return () => {
      isMounted = false
      window.removeEventListener('auth-user-updated', handleProfileUpdate)
    }
  }, [])

  const roleLabel = useMemo(() => {
    const firstRole = profile.roles?.[0]
    return firstRole || 'User'
  }, [profile.roles])

  return { profile, roleLabel }
}
