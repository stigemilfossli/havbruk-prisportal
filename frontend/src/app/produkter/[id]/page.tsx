'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, RefreshCw, Tag, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import PriceTable from '@/components/PriceTable'
import { getProduct, getProductPrices } from '@/lib/api'
import type { Product, Price } from '@/lib/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const CATEGORY_ICONS: Record<string, string> = {
  'Slanger': '🌊',
  'Rørdeler': '🔧',
  'Tau og fortøyning': '⚓',
  'Kjemikalier': '🧪',
  'Pumper': '⚙️',
  'Ventiler': '🔩',
  'Filtre': '🔬',
  'Sikkerhetsutstyr': '🦺',
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const pid = Number(id)
    if (!pid) return
    Promise.all([getProduct(pid), getProductPrices(pid)])
      .then(([p, pr]) => { setProduct(p); setPrices(pr) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-full mb-1" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">
        <p>{error || 'Produkt ikke funnet'}</p>
        <Link href="/produkter" className="btn-secondary mt-4 inline-block">Tilbake</Link>
      </div>
    )
  }

  const icon = CATEGORY_ICONS[product.category] || '📦'
  const lowestPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null

  // Build simple chart data from prices (one data point per supplier)
  const chartData = prices
    .map((p) => ({
      name: p.supplier?.name?.split(' ')[0] ?? `#${p.supplier_id}`,
      pris: p.price,
    }))
    .sort((a, b) => a.pris - b.pris)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Tilbake
      </button>

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                <span>{icon}</span>
                {product.category}
              </span>
              {product.part_number && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Tag className="w-3 h-3" />
                  {product.part_number}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            )}
          </div>

          {lowestPrice != null && (
            <div className="md:text-right">
              <div className="flex items-center gap-1 text-green-700 md:justify-end">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-medium">Beste pris</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {lowestPrice.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}
                <span className="text-base font-normal text-gray-500 ml-1">kr / {product.unit}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{prices.length} leverandør{prices.length !== 1 ? 'er' : ''}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          <Link
            href={`/tilbudsforesporsler?product=${product.id}`}
            className="btn-primary flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Legg til i tilbudsforespørsel
          </Link>
          <Link
            href={`/tilbudsforesporsler?product=${product.id}&all=1`}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Be om pris fra alle leverandører
          </Link>
        </div>
      </div>

      {/* Price table */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Priser per leverandør
        </h2>
        <PriceTable prices={prices} />
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Prissammenligning</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v.toLocaleString('nb-NO')} kr`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} kr`, 'Pris']}
              />
              <Line
                type="monotone"
                dataKey="pris"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
