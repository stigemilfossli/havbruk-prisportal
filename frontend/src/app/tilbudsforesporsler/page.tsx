'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Plus, X, ChevronDown, ChevronUp, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { getProducts, getSuppliers, createQuote, sendQuote, getQuotes } from '@/lib/api'
import type { Product, Supplier, QuoteRequest, CartItem } from '@/lib/types'
import clsx from 'clsx'

const STATUS_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  draft:    { label: 'Kladd',           icon: Clock,       color: 'badge-draft' },
  sent:     { label: 'Sendt',           icon: Send,        color: 'badge-sent' },
  partial:  { label: 'Delvis mottatt',  icon: AlertCircle, color: 'badge-partial' },
  complete: { label: 'Komplett',        icon: CheckCircle, color: 'badge-complete' },
}

function QuoteStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, icon: Clock, color: 'badge-draft' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  )
}

function QuotesContent() {
  const searchParams = useSearchParams()

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [supplierIds, setSupplierIds] = useState<number[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [expandedQuote, setExpandedQuote] = useState<number | null>(null)

  // Load initial data
  useEffect(() => {
    getSuppliers().then(setSuppliers).catch(() => {})
    getQuotes().then(setQuotes).catch(() => {})
  }, [])

  // Handle pre-selected product from URL
  useEffect(() => {
    const pid = searchParams.get('product')
    if (!pid) return
    import('@/lib/api').then(({ getProduct }) =>
      getProduct(Number(pid)).then((p) => {
        setCart((prev) => prev.find((c) => c.product.id === p.id)
          ? prev
          : [...prev, { product: p, quantity: 1, unit: p.unit, notes: '' }])
      }).catch(() => {})
    )
  }, [searchParams])

  // Search products
  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return }
    const timer = setTimeout(() => {
      getProducts({ q: productSearch, limit: 8 })
        .then((r) => setSearchResults(r.items))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  // Derive relevant suppliers from cart categories
  const cartCategories = new Set(cart.map((c) => c.product.category))
  const relevantSuppliers = suppliers.filter((s) =>
    (s.categories || []).some((cat) => cartCategories.has(cat))
  )

  const addToCart = (product: Product) => {
    setCart((prev) => prev.find((c) => c.product.id === product.id)
      ? prev
      : [...prev, { product, quantity: 1, unit: product.unit, notes: '' }])
    setProductSearch('')
    setSearchResults([])
  }

  const handleSubmit = async () => {
    if (!name || !email || cart.length === 0) {
      setErrorMsg('Fyll ut navn, e-post og legg til minst ett produkt.')
      return
    }
    setSubmitting(true)
    setErrorMsg('')
    try {
      const quote = await createQuote({
        requester_name: name,
        requester_email: email,
        requester_company: company,
        items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.quantity,
          unit: c.unit,
          notes: c.notes || undefined,
        })),
      })
      await sendQuote(quote.id, supplierIds.length > 0 ? supplierIds : undefined)
      setSuccessMsg(`Forespørsel sendt! Referansenummer: #${quote.id}`)
      setCart([])
      setName(''); setEmail(''); setCompany('')
      setSupplierIds([])
      const updated = await getQuotes()
      setQuotes(updated)
    } catch (e: any) {
      setErrorMsg(e.message || 'Noe gikk galt. Prøv igjen.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSupplier = (id: number) => {
    setSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Tilbudsforespørsel</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Bygg din forespørsel, velg leverandører og send – vi håndterer resten.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: form ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Contact info */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Din informasjon</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Navn *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="input" placeholder="Ola Nordmann" />
              </div>
              <div>
                <label className="label">E-post *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="ola@selskap.no" />
              </div>
              <div>
                <label className="label">Bedrift</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)}
                  className="input" placeholder="Havbruk AS" />
              </div>
            </div>
          </div>

          {/* Product search */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Legg til produkter</h2>
            <div className="relative">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input"
                placeholder="Søk etter produkt, f.eks. PE-slange..."
              />
              {searchResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.category} · {p.unit}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Supplier selection */}
          {relevantSuppliers.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Velg leverandører</h2>
              <p className="text-xs text-gray-400 mb-3">
                La stå tom for å sende til alle relevante. {supplierIds.length > 0 && `(${supplierIds.length} valgt)`}
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {relevantSuppliers.map((s) => (
                  <label key={s.id} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={supplierIds.includes(s.id)}
                      onChange={() => toggleSupplier(s.id)}
                      className="mt-0.5 rounded border-gray-300 text-sky-600 focus:ring-sky-400"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.region}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0 || !name || !email}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Sender...' : 'Send forespørsel'}
          </button>
        </div>

        {/* ── Right: cart ────────────────────────────────────────────────── */}
        <div>
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Valgte produkter
                {cart.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">({cart.length})</span>
                )}
              </h2>
            </div>

            {cart.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Søk og legg til produkter i skjemaet til venstre
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map(({ product, quantity, unit, notes }) => (
                  <div key={product.id} className="px-5 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-3">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category}</p>
                      </div>
                      <button
                        onClick={() => setCart((prev) => prev.filter((c) => c.product.id !== product.id))}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) =>
                          setCart((prev) =>
                            prev.map((c) =>
                              c.product.id === product.id
                                ? { ...c, quantity: Math.max(1, Number(e.target.value)) }
                                : c
                            )
                          )
                        }
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-sky-400"
                      />
                      <span className="text-sm text-gray-500 self-center">{unit}</span>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) =>
                          setCart((prev) =>
                            prev.map((c) =>
                              c.product.id === product.id ? { ...c, notes: e.target.value } : c
                            )
                          )
                        }
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
                        placeholder="Notat (valgfritt)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sent quotes table ──────────────────────────────────────────────── */}
      {quotes.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sendte forespørsler</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Bedrift</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Produkter</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Sendt</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Svar</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const received = q.responses.filter((r) => r.status === 'received').length
                  return (
                    <>
                      <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">#{q.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {q.requester_company || q.requester_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{q.items.length} produkter</td>
                        <td className="px-4 py-3"><QuoteStatusBadge status={q.status} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(q.created_at).toLocaleDateString('nb-NO')}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {received}/{q.responses.length}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedQuote(expandedQuote === q.id ? null : q.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedQuote === q.id
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {expandedQuote === q.id && (
                        <tr key={`${q.id}-exp`} className="bg-gray-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-gray-700">Leverandørsvar</h4>
                              {q.responses.length === 0 ? (
                                <p className="text-xs text-gray-400">Ingen leverandører kontaktet enda.</p>
                              ) : (
                                q.responses.map((r) => (
                                  <div key={r.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2.5 border border-gray-100">
                                    <div>
                                      <span className="font-medium text-gray-800">
                                        {r.supplier?.name ?? `Leverandør #${r.supplier_id}`}
                                      </span>
                                      {r.received_at && (
                                        <span className="ml-2 text-xs text-gray-400">
                                          Mottatt {new Date(r.received_at).toLocaleDateString('nb-NO')}
                                        </span>
                                      )}
                                    </div>
                                    <span className={clsx(
                                      'text-xs font-medium px-2 py-0.5 rounded-full',
                                      r.status === 'received' ? 'bg-green-100 text-green-700'
                                        : r.status === 'declined' ? 'bg-red-100 text-red-700'
                                        : 'bg-orange-100 text-orange-700'
                                    )}>
                                      {r.status === 'received' ? 'Mottatt'
                                        : r.status === 'declined' ? 'Avslått' : 'Avventer'}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuotesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">Laster...</div>}>
      <QuotesContent />
    </Suspense>
  )
}
