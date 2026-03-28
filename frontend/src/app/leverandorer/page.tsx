'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, MapPin, Mail, Phone, ShoppingBag } from 'lucide-react'
import { getSuppliers, getCategories } from '@/lib/api'
import type { Supplier } from '@/lib/types'
import CategoryFilter from '@/components/CategoryFilter'
import SearchBar from '@/components/SearchBar'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getSuppliers({ category: category || undefined })
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false))
  }, [category])

  const filtered = suppliers.filter((s) =>
    !query ||
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.region || '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Leverandører</h1>
      <p className="text-gray-500 mb-6 text-sm">
        {suppliers.length} registrerte leverandører av havbruksutstyr i Norge
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-52 flex-shrink-0">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Kategori</h3>
            <CategoryFilter
              categories={categories}
              selected={category}
              onChange={setCategory}
              layout="sidebar"
            />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Søk etter leverandør eller region..."
            className="mb-5"
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((supplier) => (
                <div key={supplier.id} className="card p-5 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                      {supplier.name}
                    </h3>
                    {supplier.has_online_shop && (
                      <span className="ml-2 flex-shrink-0 inline-flex items-center gap-0.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        <ShoppingBag className="w-3 h-3" />
                        Nettbutikk
                      </span>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(supplier.categories || []).map((cat) => (
                      <span key={cat} className="text-xs bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100">
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-500">
                    {supplier.region && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {supplier.region}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <a href={`mailto:${supplier.email}`} className="hover:text-sky-600 transition-colors">
                          {supplier.email}
                        </a>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <a href={`tel:${supplier.phone}`} className="hover:text-sky-600 transition-colors">
                          {supplier.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  {supplier.website && (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Besøk nettside
                    </a>
                  )}

                  {/* Price count */}
                  {(supplier.price_count ?? 0) > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {supplier.price_count} kjente priser i portalen
                    </div>
                  )}
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  Ingen leverandører funnet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
