'use client'

import { useState } from 'react'
import { PriceHistoryChart } from '@/components/PriceHistoryChart'
import { History, BarChart3, TrendingUp } from 'lucide-react'

interface ProductDetailsProps {
  productId: number
}

export function PriceHistorySection({ productId }: ProductDetailsProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'trends'>('current')
  const [historyDays, setHistoryDays] = useState(30)

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Prisanalyse</h2>
        <div className="flex items-center gap-2">
          <select
            value={historyDays}
            onChange={(e) => setHistoryDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value={7}>Siste 7 dager</option>
            <option value={30}>Siste 30 dager</option>
            <option value={90}>Siste 90 dager</option>
            <option value={180}>Siste 6 måneder</option>
            <option value={365}>Siste år</option>
          </select>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveTab('current')}
            className={activeTab === 'current'
              ? 'px-4 py-2 text-sm font-medium text-sky-600 border-b-2 border-sky-500'
              : 'px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700'}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Nåværende priser
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history'
              ? 'px-4 py-2 text-sm font-medium text-sky-600 border-b-2 border-sky-500'
              : 'px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700'}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Prishistorikk
            </div>
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={activeTab === 'trends'
              ? 'px-4 py-2 text-sm font-medium text-sky-600 border-b-2 border-sky-500'
              : 'px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700'}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trends
            </div>
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'history' || activeTab === 'trends' ? (
          <PriceHistoryChart productId={productId} days={historyDays} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3" />
            <p>Nåværende priser vises i tabellen over</p>
            <p className="text-sm mt-1">Velg "Prishistorikk" eller "Trends" for å se historisk data</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-1">Hvordan bruke prishistorikk</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Se prisutviklingen over tid for hver leverandør</li>
          <li>• Identifiser leverandører med stabile eller volatile priser</li>
          <li>• Planlegg innkjøp basert på pris-trender</li>
          <li>• Forhandl bedre med historisk data som referanse</li>
        </ul>
      </div>
    </div>
  )
}
