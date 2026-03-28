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
import { getMe } from './api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      // Token is invalid or expired — clear it
      removeToken()
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
    setToken(token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    router.push('/')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
