'use client'

import Link from 'next/link'
import { ShoppingCart, Tag, TrendingDown } from 'lucide-react'
import type { Product, CartItem } from '@/lib/types'

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

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  inCart?: boolean
}

export default function ProductCard({ product, onAddToCart, inCart }: ProductCardProps) {
  const icon = CATEGORY_ICONS[product.category] || '📦'

  return (
    <div className="card hover:shadow-md transition-shadow group flex flex-col">
      <div className="p-4 flex-1">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
            <span>{icon}</span>
            {product.category}
          </span>
          {(product.price_count ?? 0) > 0 && (
            <span className="text-xs text-gray-500">
              {product.price_count} tilbud
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 group-hover:text-sky-700 transition-colors">
          <Link href={`/produkter/${product.id}`}>
            {product.name}
          </Link>
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Price */}
        {product.lowest_price != null && (
          <div className="flex items-center gap-1 text-green-700 mt-auto">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="text-sm font-semibold">
              Fra {product.lowest_price.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} kr
            </span>
            <span className="text-xs text-gray-500">/ {product.unit}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-50 flex gap-2">
        <Link
          href={`/produkter/${product.id}`}
          className="flex-1 text-center text-sm font-medium text-sky-600 hover:text-sky-800 py-1.5 rounded-lg hover:bg-sky-50 transition-colors"
        >
          Se priser
        </Link>
        <button
          onClick={() => onAddToCart?.(product)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${inCart
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-sky-500 hover:bg-sky-600 text-white'
            }`}
          disabled={inCart}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {inCart ? 'Lagt til' : 'Tilbud'}
        </button>
      </div>
    </div>
  )
}
