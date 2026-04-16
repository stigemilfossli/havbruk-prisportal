'use client'

import { useState, useEffect } from 'react'
import { Download, Bell, RefreshCw, BarChart, Mail } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { ExportButton } from '@/components/ExportButton'

export default function AdminAlertsPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const { showError, showSuccess } = useToast()

  async function fetchStats() {
    try {
      setLoading(true)
      const response = await fetch('/api/alerts/stats?days=7', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Kunne ikke hente statistikk')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      showError('Feil ved lasting', 'Kunne ikke hente statistikk')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function triggerManualCheck() {
    try {
      const response = await fetch('/api/alerts/trigger-check', {
        method: 'POST',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Kunne ikke utløse sjekk')
      showSuccess('Suksess', 'Manuell prissjekk utløst')
    } catch (err) {
      showError('Feil', 'Kunne ikke utløse prissjekk')
    }
  }

  async function triggerManualDigest() {
    try {
      const response = await fetch('/api/alerts/trigger-digest', {
        method: 'POST',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Kunne ikke utløse daglig oppsummering')
      showSuccess('Suksess', 'Daglig oppsummering utløst')
    } catch (err) {
      showError('Feil', 'Kunne ikke utløse oppsummering')
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin: Varsler og Eksport</h1>
        <p className="text-gray-600">
          Administrer prisvarsler og eksporter data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Statistikk</h3>
            <BarChart className="w-5 h-5 text-gray-500" />
          </div>
          {stats ? (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Periode</div>
                <div className="text-lg font-semibold">{stats.period_days} dager</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Prisendringer</div>
                <div className="text-lg font-semibold">{stats.total_changes}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Daglig gjennomsnitt</div>
                <div className="text-lg font-semibold">
                  {Math.round(stats.total_changes / stats.period_days)} endringer/dag
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Laster statistikk...</div>
          )}
          <button
            onClick={fetchStats}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Oppdater
          </button>
        </div>

        {/* Alerts control card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Prisvarsler</h3>
            <Bell className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Administrer automatiske prisvarsler og e-postoppsummeringer
          </p>
          <div className="space-y-3">
            <button
              onClick={triggerManualCheck}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Utløs manuell prissjekk
            </button>
            <button
              onClick={triggerManualDigest}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send daglig oppsummering
            </button>
          </div>
        </div>

        {/* Export card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Dataeksport</h3>
            <Download className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Eksporter data til CSV eller ZIP for analyse og sikkerhetskopiering
          </p>
          <div className="flex justify-center">
            <ExportButton variant="default" />
          </div>
        </div>
      </div>

      {/* Daily stats chart */}
      {stats && stats.daily_stats && stats.daily_stats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daglig statistikk</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Dato</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Prisendringer</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {stats.daily_stats.map((day: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{day.date}</td>
                    <td className="py-2 px-3 font-medium">{day.count}</td>
                    <td className="py-2 px-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(100, (day.count / Math.max(...stats.daily_stats.map((d: any) => d.count), 1)) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-800 mb-3">Administrasjonsveiledning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Prisvarsler</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Automatisk sjekk hver time for prisendringer</li>
              <li>• Daglig oppsummering sendes kl 08:00</li>
              <li>• Bruk manuell sjekk for testing</li>
              <li>• Loggføring i backend/logs/</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Dataeksport</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• CSV-filer for Excel-import</li>
              <li>• ZIP-fil med alle data</li>
              <li>• Eksporter regelmessig for sikkerhetskopi</li>
              <li>• Bruk data for analyse og rapportering</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
