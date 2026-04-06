'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from './auth'
import { setToken, getToken, removeToken } from './auth'
import { getMe, logout } from './api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      // Token is invalid or expired
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Hydrate on mount
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback((token: string, userData: AuthUser) => {
    // Token is now set via httpOnly cookie by backend
    setUser(userData)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/')
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout: handleLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
