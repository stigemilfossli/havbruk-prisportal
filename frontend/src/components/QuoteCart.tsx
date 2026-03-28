'use client'

import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { CartItem } from '@/lib/types'

interface QuoteCartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  sticky?: boolean
}

export default function QuoteCart({
  items,
  onUpdateQuantity,
  onRemove,
  sticky = false,
}: QuoteCartProps) {
  return (
    <div className={`card ${sticky ? 'sticky top-20' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <ShoppingCart className="w-4 h-4 text-sky-600" />
        <h3 className="font-semibold text-gray-900">Handlekurv</h3>
        {items.length > 0 && (
          <span className="ml-auto bg-sky-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {items.length}
          </span>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-400 text-sm">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Ingen produkter lagt til enda
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map(({ product, quantity, unit }) => (
            <div key={product.id} className="px-4 py-3">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-800 leading-snug pr-2">
                  {product.name}
                </p>
                <button
                  onClick={() => onRemove(product.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="Fjern"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    onUpdateQuantity(product.id, Math.max(1, Number(e.target.value)))
                  }
                  className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-center
                             focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <span className="text-xs text-gray-500">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <Link
            href="/tilbudsforesporsler"
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            Gå til forespørsel
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
