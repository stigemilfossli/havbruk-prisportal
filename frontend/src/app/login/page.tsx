'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fish } from 'lucide-react'
import { login as apiLogin } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiLogin({ email, password })
      login(res.access_token, res.user)
      router.push('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('401')) {
        setError('Feil e-post eller passord. Prøv igjen.')
      } else if (msg.includes('403')) {
        setError('Brukerkontoen er deaktivert.')
      } else {
        setError('Noe gikk galt. Prøv igjen.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Fish className="w-8 h-8 text-sky-500" />
            <span className="text-2xl font-bold text-gray-900">Havbruk Prisportal</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-700">Logg inn på kontoen din</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              E-postadresse
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@epost.no"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Passord</label>
              <Link
                href="/glemt-passord"
                className="text-xs text-sky-600 hover:text-sky-700"
              >
                Glemt passord?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Har du ikke konto?{' '}
          <Link href="/registrer" className="text-sky-600 hover:text-sky-700 font-medium">
            Registrer deg gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
