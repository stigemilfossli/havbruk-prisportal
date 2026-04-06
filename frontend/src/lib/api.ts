import type {
  Supplier,
  Product,
  Price,
  PriceCreate,
  QuoteRequest,
  QuoteRequestCreate,
  Stats,
  Paginated,
} from './types'
import { getToken } from './auth'
import type { AuthUser } from './auth'

// Empty string = relative URLs (production behind nginx)
// Set NEXT_PUBLIC_API_URL=http://localhost:8000 for local dev
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies in all requests
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

function authHeaders(): Record<string, string> {
  // Tokens are now in httpOnly cookies, not in Authorization header
  // The cookie is automatically included with credentials: 'include'
  return {}
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include', // Include cookies in all requests
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getStats = () => request<Stats>('/api/stats')

// ── Products ──────────────────────────────────────────────────────────────────

export function getProducts(params?: {
  q?: string
  category?: string
  skip?: number
  limit?: number
}): Promise<Paginated<Product>> {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.category) qs.set('category', params.category)
  if (params?.skip != null) qs.set('skip', String(params.skip))
  if (params?.limit != null) qs.set('limit', String(params.limit))
  return request<Paginated<Product>>(`/api/products?${qs}`)
}

export const getProduct = (id: number) =>
  request<Product>(`/api/products/${id}`)

export const getProductPrices = (id: number) =>
  request<Price[]>(`/api/products/${id}/prices`)

export const getCategories = () =>
  request<string[]>('/api/products/categories')

export const createProduct = (data: Omit<Product, 'id' | 'created_at'>) =>
  request<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateProduct = (id: number, data: Partial<Product>) =>
  request<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deleteProduct = (id: number) =>
  request<{ ok: boolean }>(`/api/products/${id}`, { method: 'DELETE' })

// ── Suppliers ─────────────────────────────────────────────────────────────────

export function getSuppliers(params?: {
  category?: string
  region?: string
}): Promise<Supplier[]> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.region) qs.set('region', params.region)
  return request<Supplier[]>(`/api/suppliers?${qs}`)
}

export const getSupplier = (id: number) =>
  request<Supplier>(`/api/suppliers/${id}`)

export const createSupplier = (data: Omit<Supplier, 'id' | 'created_at'>) =>
  request<Supplier>('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateSupplier = (id: number, data: Partial<Supplier>) =>
  request<Supplier>(`/api/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deleteSupplier = (id: number) =>
  request<{ ok: boolean }>(`/api/suppliers/${id}`, { method: 'DELETE' })

// ── Prices ────────────────────────────────────────────────────────────────────

export function getPrices(params?: {
  product_id?: number
  supplier_id?: number
  source?: string
}): Promise<Price[]> {
  const qs = new URLSearchParams()
  if (params?.product_id) qs.set('product_id', String(params.product_id))
  if (params?.supplier_id) qs.set('supplier_id', String(params.supplier_id))
  if (params?.source) qs.set('source', params.source)
  return request<Price[]>(`/api/prices?${qs}`)
}

export const upsertPrice = (data: PriceCreate) =>
  request<Price>('/api/prices', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deletePrice = (id: number) =>
  request<{ ok: boolean }>(`/api/prices/${id}`, { method: 'DELETE' })

export const triggerScrape = (supplierIds?: number[], productIds?: number[]) =>
  request<{ message: string; status: string }>('/api/prices/scrape', {
    method: 'POST',
    body: JSON.stringify({
      supplier_ids: supplierIds ?? null,
      product_ids: productIds ?? null,
    }),
  })

// ── Quotes ────────────────────────────────────────────────────────────────────

export const getQuotes = () =>
  request<QuoteRequest[]>('/api/quotes')

export const getQuote = (id: number) =>
  request<QuoteRequest>(`/api/quotes/${id}`)

export const createQuote = (data: QuoteRequestCreate) =>
  request<QuoteRequest>('/api/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const sendQuote = (id: number, supplierIds?: number[]) =>
  request<{ message: string; suppliers: string[] }>(`/api/quotes/${id}/send`, {
    method: 'POST',
    body: JSON.stringify({ supplier_ids: supplierIds ?? null }),
  })

export const getSupplierRFQ = (token: string) =>
  request<{
    quote_id: number
    response_id: number
    requester_company?: string
    supplier_name: string
    status: string
    items: {
      product_id: number
      product_name: string
      quantity: number
      unit: string
      notes?: string
    }[]
  }>(`/api/quotes/respond/${token}`)

export const submitSupplierResponse = (
  token: string,
  data: {
    notes?: string
    items: {
      product_id: number
      unit_price?: number
      currency?: string
      delivery_days?: number
      valid_until?: string
      notes?: string
    }[]
  },
) =>
  request(`/api/quotes/respond/${token}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export async function register(data: {
  email: string
  password: string
  full_name: string
  company_name: string
}): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(data: {
  email: string
  password: string
}): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function logout(): Promise<{ ok: boolean; message: string }> {
  return request<{ ok: boolean; message: string }>('/api/auth/logout', {
    method: 'POST',
  })
}

export async function getMe(): Promise<AuthUser> {
  return authRequest<AuthUser>('/api/auth/me')
}

// ── Billing ───────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>('/api/billing/plans')
}

export async function createCheckout(plan: string): Promise<{ url: string }> {
  return authRequest<{ url: string }>('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  })
}

export async function createPortal(): Promise<{ url: string }> {
  return authRequest<{ url: string }>('/api/billing/portal', {
    method: 'POST',
  })
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface Note {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

export const getNotes = () => request<Note[]>('/api/notes')

export const createNote = (data: { title: string; content: string }) =>
  request<Note>('/api/notes', { method: 'POST', body: JSON.stringify(data) })

export const updateNote = (id: number, data: { title?: string; content?: string }) =>
  request<Note>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteNote = (id: number) =>
  request<{ ok: boolean }>(`/api/notes/${id}`, { method: 'DELETE' })
