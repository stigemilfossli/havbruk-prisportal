'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from 'lucide-react'
import clsx from 'clsx'

interface PriceHistoryPoint {
  price: number
  recorded_at: string
  source: string
  notes?: string
  currency?: string
}

interface SupplierHistory {
  supplier_id: number
  supplier_name: string | null
  history: PriceHistoryPoint[]
}

interface PriceHistoryChartProps {
  productId: number
  days?: number
}

export function PriceHistoryChart({ productId, days = 30 }: PriceHistoryChartProps) {
  const [history, setHistory] = useState<SupplierHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        const response = await fetch(`/api/price-history/product/${productId}?days=${days}`)
        if (!response.ok) throw new Error('Kunne ikke hente prishistorikk')
        const data = await response.json()
        setHistory(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ukjent feil')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [productId, days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Laster prishistorikk...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Feil: {error}</div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Calendar className="w-12 h-12 mb-2" />
        <p>Ingen prishistorikk tilgjengelig</p>
        <p className="text-sm">Prisene har ikke endret seg de siste {days} dagene</p>
      </div>
    )
  }

  // Prepare data for chart
  const chartData: Record<string, any>[] = []

  // Group by date
  const dateMap: Record<string, Record<number, number>> = {}

  history.forEach(supplier => {
    supplier.history.forEach(point => {
      const date = new Date(point.recorded_at).toLocaleDateString('nb-NO')
      if (!dateMap[date]) dateMap[date] = {}
      dateMap[date][supplier.supplier_id] = point.price
    })
  })

  // Convert to array for chart
  Object.entries(dateMap).forEach(([date, prices]) => {
    chartData.push({
      date,
      ...prices
    })
  })

  // Sort by date
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate trends
  const trends = history.map(supplier => {
    if (supplier.history.length < 2) return null

    const oldest = supplier.history[supplier.history.length - 1]
    const newest = supplier.history[0]
    const change = newest.price - oldest.price
    const percent = (change / oldest.price) * 100

    return {
      supplier_id: supplier.supplier_id,
      supplier_name: supplier.supplier_name,
      change,
      percent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    }
  }).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value} kr`}
            />
            <Tooltip
              formatter={(value) => [`${value} kr`, 'Pris']}
              labelFormatter={(label) => `Dato: ${label}`}
            />
            <Legend />
            {history.map((supplier, idx) => (
              <Line
                key={supplier.supplier_id}
                type="monotone"
                dataKey={supplier.supplier_id.toString()}
                name={supplier.supplier_name || `Leverandør ${supplier.supplier_id}`}
                stroke={getColorForIndex(idx)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trends */}
      {trends.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pristrender siste {days} dager</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trends.map((trend: any) => (
              <div
                key={trend.supplier_id}
                className={clsx(
                  'p-4 rounded-lg border',
                  trend.trend === 'up' ? 'bg-red-50 border-red-200' :
                  trend.trend === 'down' ? 'bg-green-50 border-green-200' :
                  'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{trend.supplier_name}</span>
                  {trend.trend === 'up' && <TrendingUp className="w-5 h-5 text-red-500" />}
                  {trend.trend === 'down' && <TrendingDown className="w-5 h-5 text-green-500" />}
                  {trend.trend === 'stable' && <Minus className="w-5 h-5 text-gray-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className={clsx(
                    'font-semibold',
                    trend.trend === 'up' ? 'text-red-600' :
                    trend.trend === 'down' ? 'text-green-600' :
                    'text-gray-600'
                  )}>
                    {trend.change > 0 ? '+' : ''}{trend.change.toLocaleString('nb-NO')} kr
                    {' '}({trend.percent > 0 ? '+' : ''}{trend.percent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Detaljert historikk</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-700 font-medium">Leverandør</th>
                <th className="text-left py-2 px-3 text-gray-700 font-medium">Dato</th>
                <th className="text-left py-2 px-3 text-gray-700 font-medium">Pris</th>
                <th className="text-left py-2 px-3 text-gray-700 font-medium">Kilde</th>
                <th className="text-left py-2 px-3 text-gray-700 font-medium">Notater</th>
              </tr>
            </thead>
            <tbody>
              {history.flatMap(supplier =>
                supplier.history.map((point, idx) => (
                  <tr key={`${supplier.supplier_id}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{supplier.supplier_name}</td>
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(point.recorded_at).toLocaleDateString('nb-NO')}
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {point.price.toLocaleString('nb-NO')} {point.currency}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {point.source}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{point.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function getColorForIndex(index: number): string {
  const colors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#10b981', // green-500
    '#f59e0b', // yellow-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ]
  return colors[index % colors.length]
}
