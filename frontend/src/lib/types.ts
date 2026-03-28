// ── Supplier ─────────────────────────────────────────────────────────────────

export interface Supplier {
  id: number
  name: string
  website?: string
  email?: string
  phone?: string
  region?: string
  categories: string[]
  has_online_shop: boolean
  created_at: string
  price_count?: number
}

// ── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number
  name: string
  description?: string
  category: string
  unit: string
  part_number?: string
  created_at: string
  price_count?: number
  lowest_price?: number
}

// ── Price ────────────────────────────────────────────────────────────────────

export type PriceSource = 'manual' | 'scraped' | 'quoted'

export interface Price {
  id: number
  product_id: number
  supplier_id: number
  price: number
  currency: string
  unit?: string
  source: PriceSource
  last_updated: string
  notes?: string
  supplier?: Supplier
  product?: Product
}

export interface PriceCreate {
  product_id: number
  supplier_id: number
  price: number
  currency?: string
  unit?: string
  source?: PriceSource
  notes?: string
}

// ── Quote ────────────────────────────────────────────────────────────────────

export type QuoteStatus = 'draft' | 'sent' | 'partial' | 'complete'
export type QuoteResponseStatus = 'pending' | 'received' | 'declined'

export interface QuoteRequestItem {
  id: number
  product_id: number
  quantity: number
  unit?: string
  notes?: string
  product?: Product
}

export interface QuoteResponseItem {
  id: number
  product_id: number
  unit_price?: number
  currency: string
  delivery_days?: number
  valid_until?: string
  notes?: string
  product?: Product
}

export interface QuoteResponse {
  id: number
  quote_request_id: number
  supplier_id: number
  status: QuoteResponseStatus
  token?: string
  received_at?: string
  notes?: string
  supplier?: Supplier
  response_items: QuoteResponseItem[]
}

export interface QuoteRequest {
  id: number
  requester_name: string
  requester_email: string
  requester_company?: string
  status: QuoteStatus
  created_at: string
  updated_at: string
  items: QuoteRequestItem[]
  responses: QuoteResponse[]
}

export interface QuoteRequestCreate {
  requester_name: string
  requester_email: string
  requester_company?: string
  items: {
    product_id: number
    quantity: number
    unit?: string
    notes?: string
  }[]
}

// ── Cart (client-side only) ───────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
  unit: string
  notes: string
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface Stats {
  supplier_count: number
  product_count: number
  price_count: number
  recent_updates: number
}

// ── Paginated response ────────────────────────────────────────────────────────

export interface Paginated<T> {
  total: number
  skip: number
  limit: number
  items: T[]
}
