'use client'

import { ExternalLink, TrendingDown } from 'lucide-react'
import type { Price } from '@/lib/types'
import clsx from 'clsx'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nb-NO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const SOURCE_LABEL: Record<string, string> = {
  manual:  'Manuelt',
  scraped: 'Nettbutikk',
  quoted:  'Tilbud',
}

const SOURCE_CLASS: Record<string, string> = {
  manual:  'bg-gray-100 text-gray-600',
  scraped: 'bg-blue-100 text-blue-700',
  quoted:  'bg-purple-100 text-purple-700',
}

interface PriceTableProps {
  prices: Price[]
  onContactSupplier?: (supplierId: number) => void
}

export default function PriceTable({ prices, onContactSupplier }: PriceTableProps) {
  if (prices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">Ingen kjente priser enda</p>
        <p className="text-sm mt-1">Be om tilbud fra leverandørene nedenfor</p>
      </div>
    )
  }

  const sorted = [...prices].sort((a, b) => a.price - b.price)
  const minPrice = sorted[0].price

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Leverandør</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Pris</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Enhet</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Kilde</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Sist oppdatert</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Handling</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((price, idx) => {
            const isLowest = price.price === minPrice
            const isMid = !isLowest && idx < Math.ceil(sorted.length / 2)
            const days = daysSince(price.last_updated)

            return (
              <tr
                key={price.id}
                className={clsx(
                  'border-b border-gray-100 transition-colors hover:bg-gray-50',
                  isLowest && 'bg-green-50',
                )}
              >
                {/* Supplier */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isLowest && (
                      <TrendingDown className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {price.supplier?.name ?? `Leverandør #${price.supplier_id}`}
                      </div>
                      {price.supplier?.region && (
                        <div className="text-xs text-gray-400">{price.supplier.region}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-right">
                  <span
                    className={clsx(
                      'font-bold text-base',
                      isLowest ? 'text-green-700' : isMid ? 'text-yellow-700' : 'text-gray-700',
                    )}
                  >
                    {price.price.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">{price.currency}</span>
                </td>

                {/* Unit */}
                <td className="px-4 py-3 text-center text-gray-600">
                  {price.unit || '—'}
                </td>

                {/* Source */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      SOURCE_CLASS[price.source] ?? 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {SOURCE_LABEL[price.source] ?? price.source}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-center">
                  {price.source === 'quoted' ? (
                    <span className="text-xs text-purple-600">
                      Forespørsel sendt {days} dag{days !== 1 ? 'er' : ''} siden
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">{formatDate(price.last_updated)}</span>
                  )}
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-center">
                  {price.supplier?.website ? (
                    <a
                      href={price.source === 'scraped' && price.notes ? price.notes : price.supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium"
                    >
                      Kontakt
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      onClick={() => onContactSupplier?.(price.supplier_id)}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                    >
                      Kontakt
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
