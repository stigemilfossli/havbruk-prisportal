// Token management
export const setToken = (token: string) => localStorage.setItem('auth_token', token)
export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
export const removeToken = () => localStorage.removeItem('auth_token')

export interface AuthUser {
  id: number
  email: string
  full_name: string | null
  company_name: string | null
  role: string
  plan: 'free' | 'basis' | 'pro' | 'enterprise'
  subscription_status: string
  current_period_end: string | null
}
