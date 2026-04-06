'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { User, CreditCard, LogOut, ArrowUpRight, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { createPortal } from '@/lib/api'
import { useState, Suspense } from 'react'
import clsx from 'clsx'
import { useToast } from '@/components/Toast'

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  basis: 'Basis',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  basis: 'bg-blue-100 text-blue-700',
  pro: 'bg-sky-100 text-sky-700',
  enterprise: 'bg-purple-100 text-purple-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  canceled: 'Avsluttet',
  past_due: 'Betaling forfalt',
  trialing: 'Prøveperiode',
}

function KontoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutStatus = searchParams.get('checkout')
  const { user, logout, loading } = useAuth()
  const [portalLoading, setPortalLoading] = useState(false)
  const { showError } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const { url } = await createPortal()
      window.location.href = url
    } catch {
      showError('Kunne ikke åpne abonnementsportalen', 'Prøv igjen.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Laster konto...
      </div>
    )
  }

  const periodEnd = user.current_period_end
    ? new Date(user.current_period_end).toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Min konto</h1>

      {/* Checkout success banner */}
      {checkoutStatus === 'success' && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span className="text-sm font-medium">
            Abonnementet ditt er aktivert. Takk for at du valgte Havbruk Prisportal!
          </span>
        </div>
      )}

      {/* User info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <User className="w-5 h-5 text-sky-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Brukerinformasjon</h2>
        </div>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Navn</dt>
            <dd className="font-medium text-gray-900">{user.full_name || '—'}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">E-post</dt>
            <dd className="font-medium text-gray-900">{user.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Bedrift</dt>
            <dd className="font-medium text-gray-900">{user.company_name || '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Subscription card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-sky-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Abonnement</h2>
        </div>

        <dl className="space-y-3 mb-6">
          <div className="flex justify-between items-center text-sm">
            <dt className="text-gray-500">Plan</dt>
            <dd>
              <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold', PLAN_COLORS[user.plan] ?? PLAN_COLORS.free)}>
                {PLAN_LABELS[user.plan] ?? user.plan}
              </span>
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Status</dt>
            <dd className="font-medium text-gray-900">
              {STATUS_LABELS[user.subscription_status] ?? user.subscription_status}
            </dd>
          </div>
          {periodEnd && (
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Neste fakturadato</dt>
              <dd className="font-medium text-gray-900">{periodEnd}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-col sm:flex-row gap-3">
          {user.plan !== 'enterprise' && (
            <Link
              href="/priser"
              className="flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              Oppgrader plan
            </Link>
          )}
          {user.plan !== 'free' && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {portalLoading ? 'Laster portal...' : 'Administrer abonnement'}
            </button>
          )}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logg ut
      </button>
    </div>
  )
}

export default function KontoPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Laster...</div>}>
      <KontoContent />
    </Suspense>
  )
}
