// Cookie-based token management (httpOnly for security)
// Note: Cookies are set by backend and automatically included in requests

export const getToken = () => {
  // Token is now in httpOnly cookie, not accessible from JavaScript
  // This function is kept for compatibility but returns null
  return null
}

export const setToken = (token: string) => {
  // Token is set by backend via httpOnly cookie
  // We don't store it in localStorage anymore
  console.log('Token set via httpOnly cookie by backend')
}

export const removeToken = () => {
  // Token removal is handled by backend logout endpoint
  // We can't remove httpOnly cookies from JavaScript
  console.log('Token removal handled by backend logout')
}

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
