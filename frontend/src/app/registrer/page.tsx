'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Fish, Info } from 'lucide-react'
import { register as apiRegister, createCheckout } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

const PLAN_NAMES: Record<string, string> = {
  basis: 'Basis (990 kr/mnd)',
  pro: 'Pro (2 490 kr/mnd)',
  enterprise: 'Enterprise (4 990 kr/mnd)',
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan')
  const { login } = useAuth()

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passordene stemmer ikke overens.')
      return
    }
    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn.')
      return
    }
    if (!acceptTerms) {
      setError('Du må godta vilkår og personvernregler.')
      return
    }

    setLoading(true)
    try {
      const res = await apiRegister({ email, password, full_name: fullName, company_name: companyName })
      login(res.access_token, res.user)

      if (planParam && PLAN_NAMES[planParam]) {
        // Redirect to Stripe checkout
        const { url } = await createCheckout(planParam)
        window.location.href = url
      } else {
        router.push('/')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('400')) {
        setError('E-postadressen er allerede registrert.')
      } else {
        setError('Noe gikk galt. Prøv igjen.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Fish className="w-8 h-8 text-sky-500" />
            <span className="text-2xl font-bold text-gray-900">Havbruk Prisportal</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-700">Opprett gratis konto</h1>
        </div>

        {/* Plan banner */}
        {planParam && PLAN_NAMES[planParam] && (
          <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 text-sky-800 text-sm rounded-xl px-4 py-3 mb-6">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Du er i ferd med å abonnere på <strong>{PLAN_NAMES[planParam]}</strong>. Registrer deg
              for å fortsette til betaling.
            </span>
          </div>
        )}

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
              Fullt navn
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ola Nordmann"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bedriftsnavn
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Norsk Havbruk AS"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Passord
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 8 tegn"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bekreft passord
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Gjenta passordet"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
            />
            <span className="text-sm text-gray-600">
              Jeg godtar{' '}
              <Link href="/vilkar" className="text-sky-600 hover:text-sky-700 underline">
                vilkår
              </Link>{' '}
              og{' '}
              <Link href="/personvern" className="text-sky-600 hover:text-sky-700 underline">
                personvernregler
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading
              ? planParam
                ? 'Oppretter konto og starter betaling...'
                : 'Oppretter konto...'
              : 'Opprett konto'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Har du allerede konto?{' '}
          <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium">
            Logg inn
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegistrerPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Laster...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
