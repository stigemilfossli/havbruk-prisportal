'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, DollarSign, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface PriceChange {
  product_id: number
  product_name: string
  product_category: string
  change_count: number
  changes: Array<{
    price_id: number
    old_price: number
    supplier_id: number
    supplier_name: string | null
    recorded_at: string
    source: string
    notes: string | null
  }>
}

export default function PriceChangesPage() {
  const [changes, setChanges] = useState<PriceChange[]>([])
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(24)
  const { showError } = useToast()

  async function fetchChanges() {
    try {
      setLoading(true)
      const response = await fetch(`/api/alerts/recent-changes?hours=${hours}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Kunne ikke hente prisendringer')
      const data = await response.json()
      setChanges(data.changes || [])
    } catch (err) {
      showError('Feil ved lasting', 'Kunne ikke hente prisendringer')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChanges()
  }, [hours])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Laster prisendringer...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prisendringer</h1>
        <p className="text-gray-600">
          Oversikt over prisendringer fra leverandører
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vis endringer siste
              </label>
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value={1}>1 time</option>
                <option value={24}>24 timer</option>
                <option value={168}>7 dager</option>
                <option value={720}>30 dager</option>
              </select>
            </div>
            <button
              onClick={fetchChanges}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Oppdater
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            {changes.length} produkter med endringer
          </div>
        </div>
      </div>

      {/* Changes list */}
      {changes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen prisendringer</h3>
          <p className="text-gray-600">
            Det har ikke vært noen prisendringer i løpet av de siste {hours} timene.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {changes.map((change) => (
            <div key={change.product_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {change.product_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {change.product_category} • {change.change_count} endringer
                    </p>
                  </div>
                  <a
                    href={`/produkter/${change.product_id}`}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                  >
                    Se produkt →
                  </a>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-4">
                  {change.changes.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.supplier_name || `Leverandør ${item.supplier_id}`}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {item.old_price.toLocaleString('nb-NO')} kr
                          </span>
                          <span className="mx-2">•</span>
                          {new Date(item.recorded_at).toLocaleDateString('nb-NO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Hvordan fungerer prisendringer?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Systemet registrerer automatisk når leverandører endrer priser</li>
          <li>• Du kan abonnere på e-postvarsler for spesifikke produkter</li>
          <li>• Prisendringer brukes til å analysere markeds-trender</li>
          <li>• Historisk data hjelper med å forhandle bedre priser</li>
        </ul>
      </div>
    </div>
  )
}
