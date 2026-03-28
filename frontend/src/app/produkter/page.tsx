'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import CategoryFilter from '@/components/CategoryFilter'
import ProductCard from '@/components/ProductCard'
import QuoteCart from '@/components/QuoteCart'
import { getProducts, getCategories } from '@/lib/api'
import type { Product, CartItem } from '@/lib/types'

const PAGE_SIZE = 16

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [page, setPage] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load categories once
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  // Load products on filter/page change
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getProducts({ q: query, category, skip: page * PAGE_SIZE, limit: PAGE_SIZE })
      setProducts(result.items)
      setTotal(result.total)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [query, category, page])

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300)
    return () => clearTimeout(timer)
  }, [loadProducts])

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    router.replace(`/produkter?${params}`, { scroll: false })
  }, [query, category, router])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const cartIds = new Set(cart.map((c) => c.product.id))

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      if (prev.find((c) => c.product.id === product.id)) return prev
      return [...prev, { product, quantity: 1, unit: product.unit, notes: '' }]
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className={`w-full md:w-56 flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div className="card p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Kategorier</h3>
            <CategoryFilter
              categories={categories}
              selected={category}
              onChange={(c) => { setCategory(c); setPage(0) }}
              layout="sidebar"
            />
          </div>
          {cart.length > 0 && (
            <QuoteCart
              items={cart}
              onUpdateQuantity={(id, qty) =>
                setCart((prev) => prev.map((c) => c.product.id === id ? { ...c, quantity: qty } : c))
              }
              onRemove={(id) => setCart((prev) => prev.filter((c) => c.product.id !== id))}
              sticky
            />
          )}
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <SearchBar
              value={query}
              onChange={(v) => { setQuery(v); setPage(0) }}
              className="flex-1"
              placeholder="Søk etter produkter..."
            />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden btn-secondary flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Category pills (mobile/compact) */}
          <div className="hidden sm:block md:hidden mb-4">
            <CategoryFilter
              categories={categories}
              selected={category}
              onChange={(c) => { setCategory(c); setPage(0) }}
              layout="pills"
            />
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'Laster...' : `${total} produkter funnet`}
            </p>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3 w-2/3" />
                  <div className="h-3 bg-gray-100 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">Ingen produkter funnet</p>
              <p className="text-sm mt-1">Prøv et annet søkeord eller endre kategori</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  inCart={cartIds.has(product.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Side {page + 1} av {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">Laster produkter...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
