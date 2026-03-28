'use client'

import { useState, useEffect } from 'react'
import {
  Package, Users, DollarSign, FileText, Plus, Pencil, Trash2,
  RefreshCw, Save, X, ChevronDown, TrendingUp, Ship, BarChart2,
  ArrowUpRight, ArrowDownRight, Building2,
} from 'lucide-react'
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getPrices, upsertPrice, deletePrice, triggerScrape,
  getQuotes,
} from '@/lib/api'
import type { Product, Supplier, Price, QuoteRequest } from '@/lib/types'
import clsx from 'clsx'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type Tab = 'produkter' | 'leverandorer' | 'priser' | 'tilbud' | 'okonomi'

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'produkter',    label: 'Produkter',    icon: Package },
  { id: 'leverandorer', label: 'Leverandører', icon: Users },
  { id: 'priser',       label: 'Priser',       icon: DollarSign },
  { id: 'tilbud',       label: 'Tilbud',       icon: FileText },
  { id: 'okonomi',      label: 'Økonomi',      icon: TrendingUp },
]

// ── Demo data ──────────────────────────────────────────────────────────────────

// Prismodell: per-fartøy med volumrabatt
// 1 fartøy: 1 490/mnd | 3 fartøy: 3 490/mnd | 5 fartøy: 4 990/mnd | 7 fartøy: 5 990/mnd | Rederi 8+: avtale
const VESSEL_PLAN = (n: number) => {
  if (n === 1) return { label: '1 fartøy', mrr: 1490, color: 'bg-green-100 text-green-800' }
  if (n <= 3)  return { label: '3 fartøy', mrr: 3490, color: 'bg-sky-100 text-sky-800' }
  if (n <= 5)  return { label: '5 fartøy', mrr: 4990, color: 'bg-blue-100 text-blue-800' }
  if (n <= 7)  return { label: '7 fartøy', mrr: 5990, color: 'bg-indigo-100 text-indigo-800' }
  return { label: 'Rederipakke', mrr: Math.round(n * 720), color: 'bg-purple-100 text-purple-800' }
}

const DEMO_CUSTOMERS = [
  {
    id: 1,
    company: 'SalMar / SalmoNor',
    joined: '2024-02-01',
    contact: 'Innkjøpsavdelingen',
    vessels: [
      // Avlusningsenheter (delousing barges)
      { name: 'SLC-01', type: 'Avlusningslekter', orders: 41, spend: 612400 },
      { name: 'SLC-02', type: 'Avlusningslekter', orders: 38, spend: 587200 },
      { name: 'SLC-03', type: 'Avlusningslekter', orders: 35, spend: 534100 },
      { name: 'SLC-04', type: 'Avlusningslekter', orders: 33, spend: 498700 },
      { name: 'SELMA', type: 'Avlusningslekter (8 Hydrolicer)', orders: 44, spend: 672300 },
      { name: 'Langholmen', type: 'Avlusningslekter – SalmoNor', orders: 29, spend: 412300 },
      // Brønnbåter / transportfartøy
      { name: 'MS Namsos', type: 'Brønnbåt 3 200 m³', orders: 34, spend: 487200 },
      { name: 'MS Havtrans', type: 'Brønnbåt', orders: 28, spend: 312400 },
      { name: 'Viknatrans', type: 'Fôrtransport', orders: 19, spend: 218600 },
      { name: 'Novatrans', type: 'Fôrtransport', orders: 22, spend: 267800 },
      { name: 'Ocean Farm 1', type: 'Havmerd – offshore', orders: 41, spend: 623400 },
    ],
  },
  {
    id: 2,
    company: 'Mowi ASA',
    joined: '2024-01-15',
    contact: 'Supply Chain',
    vessels: [
      { name: 'Aqua Spa', type: 'Brønnbåt 3 900 m³', orders: 31, spend: 445300 },
      { name: 'Aqua Maløy', type: 'Brønnbåt 3 900 m³', orders: 27, spend: 389100 },
      { name: 'Aqua Skilsøy', type: 'Brønnbåt 3 900 m³', orders: 24, spend: 312700 },
      { name: 'Aqua Havsøy', type: 'Brønnbåt 3 900 m³', orders: 29, spend: 401200 },
      { name: 'Aqua Tromøy', type: 'Brønnbåt 3 000 m³', orders: 18, spend: 256800 },
      { name: 'Aqua Merdø', type: 'Slakteri/stun fartøy', orders: 16, spend: 234100 },
      { name: 'Mowi Star', type: 'Levende fisk-carrier', orders: 22, spend: 298400 },
    ],
  },
  {
    id: 3,
    company: 'Lerøy Seafood Group',
    joined: '2024-03-10',
    contact: 'Driftsavdelingen',
    vessels: [
      { name: 'Seigrunn', type: 'Brønnbåt 8 000 m³ (verdens største)', orders: 26, spend: 378900 },
      { name: 'Seifjell', type: 'Smolt-carrier 2 200 m³', orders: 19, spend: 224600 },
      { name: 'Seihav', type: 'Brønnbåt', orders: 21, spend: 289300 },
    ],
  },
  {
    id: 4,
    company: 'Frøy ASA',
    joined: '2024-01-20',
    contact: 'Fleet Management',
    vessels: [
      // Brønnbåter (Gåsø-serien og Havtrans-serien)
      { name: 'Gåsø Høvding', type: 'Brønnbåt 7 500 m³ – verdens største', orders: 38, spend: 567400 },
      { name: 'Gåsø Odin', type: 'Brønnbåt 4 500 m³ hybrid + Hydrolicer', orders: 32, spend: 445800 },
      { name: 'Gåsø Jarl', type: 'Brønnbåt', orders: 27, spend: 389100 },
      { name: 'Gåsø Freyja', type: 'Brønnbåt', orders: 24, spend: 345600 },
      { name: 'Gåsø Viking', type: 'Brønnbåt', orders: 22, spend: 312400 },
      { name: 'Åsværfjord', type: 'Brønnbåt 3 250 m³ (Havtrans #6)', orders: 29, spend: 412300 },
      { name: 'Kristiansund', type: 'Brønnbåt 3 250 m³ (Havtrans #4)', orders: 26, spend: 378200 },
      { name: 'Steigen', type: 'Brønnbåt (Havtrans-serie)', orders: 23, spend: 334500 },
      { name: 'Reisa', type: 'Brønnbåt (Havtrans-serie)', orders: 21, spend: 298700 },
      { name: 'Frøydis', type: 'Brønnbåt', orders: 19, spend: 267400 },
      { name: 'Frøygard', type: 'Brønnbåt', orders: 17, spend: 245100 },
      { name: 'Frøy Odin', type: 'Brønnbåt', orders: 20, spend: 289300 },
      { name: 'Frøy Njord', type: 'Brønnbåt', orders: 18, spend: 256800 },
      { name: 'Frøy Finnmark', type: 'Brønnbåt – Finnmark', orders: 16, spend: 223400 },
      { name: 'Frøy Harvest', type: 'Brønnbåt', orders: 21, spend: 301200 },
      // Servicefartøy
      { name: 'Frøy Supporter', type: 'Servicefartøy – Macho 20', orders: 24, spend: 334500 },
      { name: 'Frøy Leader', type: 'Servicefartøy hybrid', orders: 21, spend: 298700 },
      { name: 'Frøy Skuld', type: 'Servicefartøy – Macho 20', orders: 18, spend: 256400 },
      { name: 'Frøy Hild', type: 'Servicefartøy – Macho 20', orders: 17, spend: 234100 },
      { name: 'Frøy Saga', type: 'Servicefartøy', orders: 22, spend: 312100 },
      { name: 'Frøy Server', type: 'Servicefartøy', orders: 19, spend: 267800 },
      { name: 'Frøy Stadt', type: 'Servicekatamarant', orders: 16, spend: 223500 },
      { name: 'Frøy Neptun', type: 'Dykker-katamarant', orders: 14, spend: 198700 },
      { name: 'Frøy Ocean', type: 'Servicefartøy', orders: 18, spend: 245600 },
      { name: 'Frøy Master', type: 'Servicefartøy', orders: 15, spend: 212300 },
      { name: 'Frøy Vestkapp', type: 'Servicefartøy', orders: 13, spend: 187400 },
      { name: 'Frøy Valkyrien', type: 'Servicefartøy', orders: 16, spend: 223100 },
      { name: 'Frøy Loke', type: 'Servicefartøy', orders: 14, spend: 198500 },
      { name: 'Frøy Bas', type: 'Servicefartøy', orders: 12, spend: 167800 },
      { name: 'Frøy Junior', type: 'Servicefartøy', orders: 11, spend: 154300 },
      { name: 'Frøysprint', type: 'Servicefartøy', orders: 13, spend: 178900 },
    ],
  },
  {
    id: 5,
    company: 'FSV Group (Aquaship)',
    joined: '2024-04-01',
    contact: 'Fleet Operations – Molde',
    vessels: [
      { name: 'Multi Commander', type: 'Servicefartøy 27m – ROV Sperre SF30K', orders: 28, spend: 412400 },
      { name: 'Multi Explorer', type: 'Servicefartøy 27m – ROV Sperre SF30K', orders: 26, spend: 378600 },
      { name: 'Multi Energy', type: 'Servicefartøy 27m – hybrid 270 kWh', orders: 24, spend: 345800 },
      { name: 'Multi Power', type: 'Servicefartøy 27m – ROV Sperre SF10K', orders: 22, spend: 312400 },
      { name: 'Multi Green', type: 'Servicefartøy 26.9m – ROV Sperre SF30K', orders: 25, spend: 367200 },
      { name: 'Multi Safety', type: 'Servicefartøy 39.8m – avlusning + ROV', orders: 31, spend: 456700 },
      { name: 'Multi Quality', type: 'Servicefartøy – Caligus 250 avlusning', orders: 29, spend: 423100 },
      { name: 'Multi Arctic', type: 'Servicefartøy – hybrid, 185 tm kran', orders: 27, spend: 389400 },
      { name: 'Multi Challenger', type: 'Servicefartøy 20m – hybrid', orders: 21, spend: 298700 },
      { name: 'Multi Frontier', type: 'Servicefartøy 20m – hybrid', orders: 19, spend: 267300 },
      { name: 'Multi Navigator', type: 'Servicefartøy 18m – 100 tm kran', orders: 17, spend: 245100 },
      { name: 'Multi North', type: 'Servicefartøy 18m – ROV SF10K', orders: 16, spend: 223400 },
      { name: 'Multi Supporter', type: 'Servicefartøy 18m – ROV SF10K', orders: 15, spend: 212800 },
      { name: 'Multi Electric', type: 'Servicefartøy – helel. 1 050 kWh', orders: 18, spend: 256700 },
      { name: 'Multi Enovation', type: 'Servicefartøy – helel. 1 050 kWh', orders: 17, spend: 234500 },
      { name: 'Multi Vision', type: 'Servicefartøy 15.1m', orders: 13, spend: 187900 },
      { name: 'Multi Ocean', type: 'Servicefartøy 15.1m', orders: 12, spend: 167400 },
      { name: 'Multi Server', type: 'Servicefartøy 24.6m – 145 tm kran', orders: 22, spend: 312300 },
      { name: 'Multi Pioner', type: 'Servicefartøy 24.6m – ROV SF15K', orders: 20, spend: 289100 },
      { name: 'Multi Innovator', type: 'Servicefartøy – Argus Mini ROV', orders: 16, spend: 223600 },
      { name: 'Multi Provider', type: 'Servicefartøy – Argus Mini ROV', orders: 15, spend: 212400 },
      { name: 'Mini Server', type: 'Servicefartøy 15m – 65 tm kran', orders: 13, spend: 187100 },
      { name: 'Taurus', type: 'Servicefartøy – dobbel kran', orders: 14, spend: 198600 },
      { name: 'Enabler II', type: 'Lekter 30m – avlusningssystem', orders: 25, spend: 356800 },
      { name: 'FSV Scotia', type: 'Høstingsfartøy 50m – 480 m³ RSW', orders: 32, spend: 467200 },
      { name: 'FSV Superior', type: 'Servicefartøy 25m – Optimar stun', orders: 28, spend: 401300 },
      { name: 'Multi Storfjord', type: 'Servicefartøy 20m', orders: 17, spend: 245800 },
      { name: 'Multi Installer', type: 'Servicefartøy 27m – 185 tm kran', orders: 19, spend: 267400 },
    ],
  },
  {
    id: 6,
    company: 'Cermaq Norway',
    joined: '2024-05-12',
    contact: 'Technical Dept.',
    vessels: [
      { name: 'MS Veidnes', type: 'Brønnbåt 6 000 m³ hybrid – Finnmark', orders: 35, spend: 512300 },
      { name: 'Cermaq Troms', type: 'Servicefartøy – Troms', orders: 19, spend: 267400 },
    ],
  },
  {
    id: 7,
    company: 'Grieg Seafood',
    joined: '2024-06-03',
    contact: 'Operations',
    vessels: [
      { name: 'Christine', type: 'Brønnbåt – 18 år, solgt til AquaShip', orders: 14, spend: 187600 },
      { name: 'Grieg 01', type: 'Servicefartøy – Shetland', orders: 11, spend: 145300 },
      { name: 'Grieg 02', type: 'Servicefartøy – Shetland', orders: 9, spend: 123400 },
    ],
  },
  {
    id: 8,
    company: 'Rostein AS',
    joined: '2024-07-15',
    contact: 'Fleet Dept.',
    vessels: [
      { name: 'Ro Vision', type: 'Brønnbåt – verdens første hybrid', orders: 28, spend: 389200 },
      { name: 'Ro Sunrise', type: 'Brønnbåt', orders: 23, spend: 312800 },
      { name: 'Ro Spirit', type: 'Brønnbåt', orders: 19, spend: 256400 },
      { name: 'Ro Senja', type: 'Brønnbåt', orders: 21, spend: 289100 },
      { name: 'Ro Sailor', type: 'Brønnbåt', orders: 17, spend: 234500 },
      { name: 'Ro Venture', type: 'Brønnbåt', orders: 16, spend: 223100 },
      { name: 'Ro Fortune', type: 'Brønnbåt', orders: 18, spend: 256700 },
    ],
  },
]

// MRR kalkulert etter ny per-fartøy prismodell
// SalMar 11 fartøy → rederipakke ≈ 7 920/mnd
// Mowi 7 fartøy → 5 990/mnd
// Lerøy 3 fartøy → 3 490/mnd
// Frøy 31 fartøy → rederipakke ≈ 22 320/mnd
// FSV 28 fartøy → rederipakke ≈ 20 160/mnd
// Cermaq 2 fartøy → 1 490/mnd (en pakke 1-fartøy pr fartøy = 2×1490)
// Grieg 3 fartøy → 3 490/mnd
// Rostein 7 fartøy → 5 990/mnd
// Total MRR ≈ 71 340/mnd

const MRR_HISTORY = [
  { month: 'Aug 24', mrr: 11980, kunder: 2 },
  { month: 'Sep 24', mrr: 21450, kunder: 3 },
  { month: 'Okt 24', mrr: 36890, kunder: 5 },
  { month: 'Nov 24', mrr: 49230, kunder: 6 },
  { month: 'Des 24', mrr: 59780, kunder: 7 },
  { month: 'Jan 25', mrr: 65340, kunder: 8 },
  { month: 'Feb 25', mrr: 68920, kunder: 8 },
  { month: 'Mar 25', mrr: 71340, kunder: 8 },
]

const ORDER_HISTORY = [
  { month: 'Okt 24', bestillinger: 189, verdi: 2823400 },
  { month: 'Nov 24', bestillinger: 267, verdi: 3967800 },
  { month: 'Des 24', bestillinger: 223, verdi: 3334500 },
  { month: 'Jan 25', bestillinger: 312, verdi: 4624700 },
  { month: 'Feb 25', bestillinger: 378, verdi: 5656900 },
  { month: 'Mar 25', bestillinger: 441, verdi: 6634100 },
]

// ── Economics tab ──────────────────────────────────────────────────────────────

function OkonomiTab() {
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null)

  const totalMrr = DEMO_CUSTOMERS.reduce((s, c) => s + VESSEL_PLAN(c.vessels.length).mrr, 0)
  const totalArr = totalMrr * 12
  const totalOrders = DEMO_CUSTOMERS.flatMap(c => c.vessels).reduce((s, v) => s + v.orders, 0)
  const totalSpend  = DEMO_CUSTOMERS.flatMap(c => c.vessels).reduce((s, v) => s + v.spend, 0)
  const totalVessels = DEMO_CUSTOMERS.flatMap(c => c.vessels).length

  const fmt = (n: number) => n.toLocaleString('nb-NO')
  const fmtKr = (n: number) => n.toLocaleString('nb-NO', { maximumFractionDigits: 0 }) + ' kr'

  const selected = selectedCustomer ? DEMO_CUSTOMERS.find(c => c.id === selectedCustomer) : null

  return (
    <div className="space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Månedlig inntekt (MRR)', value: fmtKr(totalMrr), sub: `ARR: ${fmtKr(totalArr)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', trend: '+12%' },
          { label: 'Aktive kunder', value: fmt(DEMO_CUSTOMERS.length), sub: `${DEMO_CUSTOMERS.filter(c => VESSEL_PLAN(c.vessels.length).label === 'Enterprise').length} Enterprise`, icon: Building2, color: 'text-sky-600', bg: 'bg-sky-50', trend: '+2 siste mnd' },
          { label: 'Fartøy registrert', value: fmt(totalVessels), sub: 'Servicebåter og brønnbåter', icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `+${totalVessels} totalt` },
          { label: 'Bestillinger (12 mnd)', value: fmt(totalOrders), sub: `Verdi: ${fmtKr(totalSpend)}`, icon: BarChart2, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+34% MoM' },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={clsx('p-2 rounded-lg', kpi.bg)}>
                <kpi.icon className={clsx('w-5 h-5', kpi.color)} />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />{kpi.trend}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">MRR utvikling</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MRR_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v/1000)+'k'} />
              <Tooltip formatter={(v: number) => [fmtKr(v), 'MRR']} />
              <Line type="monotone" dataKey="mrr" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Bestillingsvolum per måned</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ORDER_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, name: string) => [name === 'bestillinger' ? fmt(v) : fmtKr(v), name === 'bestillinger' ? 'Bestillinger' : 'Verdi']} />
              <Bar dataKey="bestillinger" fill="#6366f1" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer table */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Kunder og fartøy</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Bedrift</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Plan</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-700">MRR</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Fartøy</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Bestillinger</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Handleverdi</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Kunde siden</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {DEMO_CUSTOMERS.map((c) => {
                const custOrders = c.vessels.reduce((s, v) => s + v.orders, 0)
                const custSpend  = c.vessels.reduce((s, v) => s + v.spend, 0)
                const plan = VESSEL_PLAN(c.vessels.length)
                const isOpen = selectedCustomer === c.id
                return (
                  <>
                    <tr key={c.id} className={clsx('border-b border-gray-100 hover:bg-gray-50 cursor-pointer', isOpen && 'bg-indigo-50/40')}
                        onClick={() => setSelectedCustomer(isOpen ? null : c.id)}>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.company}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', plan.color)}>{plan.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{fmtKr(plan.mrr)}/mnd</td>
                      <td className="px-4 py-3 text-right text-gray-600">{c.vessels.length}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(custOrders)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">{fmtKr(custSpend)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.joined).toLocaleDateString('nb-NO')}</td>
                      <td className="px-4 py-3">
                        <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${c.id}-vessels`}>
                        <td colSpan={8} className="px-6 py-4 bg-indigo-50/30 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Fartøy og bestillinger</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {c.vessels.map((v) => (
                              <div key={v.name} className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 flex items-center gap-3">
                                <Ship className="w-4 h-4 text-sky-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-gray-800 truncate">{v.name}</div>
                                  <div className="text-xs text-gray-400 truncate">{(v as any).type}</div>
                                  <div className="text-xs text-gray-500">{v.orders} bestillinger · {fmtKr(v.spend)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300">
                <td className="px-4 py-3 font-bold text-gray-900">Totalt</td>
                <td />
                <td className="px-4 py-3 text-right font-bold text-green-700">{fmtKr(totalMrr)}/mnd</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{totalVessels}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{fmt(totalOrders)}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{fmtKr(totalSpend)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Revenue breakdown per plan tier */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Rederipakke (8+ fartøy)', color: 'bg-purple-500', keys: [11, 31, 28] },
            { label: '7 fartøy', color: 'bg-indigo-500', keys: [7] },
            { label: '3–5 fartøy', color: 'bg-sky-500', keys: [3, 5] },
            { label: '1–2 fartøy', color: 'bg-green-500', keys: [1, 2] },
          ].map((row) => {
            const matching = DEMO_CUSTOMERS.filter(c => row.keys.includes(c.vessels.length) || (row.label.includes('8+') && c.vessels.length > 7))
            const mrr = matching.reduce((s, c) => s + VESSEL_PLAN(c.vessels.length).mrr, 0)
            return (
              <div key={row.label} className="rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={clsx('w-3 h-10 rounded-full flex-shrink-0', row.color)} />
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{row.label}</div>
                  <div className="text-xs text-gray-500">{matching.length} kunder · {fmtKr(mrr)}/mnd</div>
                  <div className="text-xs text-gray-400">{fmtKr(mrr * 12)}/år</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Potential */}
      <div className="card p-5 border-l-4 border-l-amber-400 bg-amber-50/30">
        <h3 className="font-semibold text-gray-800 mb-1">Vekstpotensial — per-fartøy modell</h3>
        <p className="text-sm text-gray-600 mb-3">
          Norge har <strong>~800 aktive oppdrettslokaliteter</strong> og anslagsvis <strong>400+ servicefartøy og brønnbåter</strong>.
          Snittabonnement per fartøy estimert til ~<strong>900 kr/mnd</strong> (volumrabatt inkludert).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: '50 fartøy', mrr: fmtKr(50 * 900), scenario: 'Realistisk 2025', sub: '~8 kunder' },
            { label: '150 fartøy', mrr: fmtKr(150 * 900), scenario: 'Mål 2026', sub: '~15 kunder' },
            { label: '400 fartøy', mrr: fmtKr(400 * 900), scenario: 'Markedsleder', sub: '~30 kunder' },
            { label: '1 000 fartøy', mrr: fmtKr(1000 * 900), scenario: 'Norden', sub: 'Sverige + Danmark' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-amber-200 p-3">
              <div className="text-lg font-bold text-gray-900">{s.mrr}</div>
              <div className="text-xs font-semibold text-gray-700">{s.label}</div>
              <div className="text-xs text-gray-500">{s.sub}</div>
              <div className="text-xs text-gray-400">{s.scenario}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

const CATEGORIES = ['Slanger','Rørdeler','Tau og fortøyning','Kjemikalier','Pumper','Ventiler','Filtre','Sikkerhetsutstyr']

// ── Products tab ───────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = () => getProducts({ limit: 100 }).then((r) => setProducts(r.items)).catch(() => {})
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing) return
    try {
      if (isNew) await createProduct(editing as any)
      else await updateProduct(editing.id!, editing as any)
      setEditing(null)
      load()
    } catch (e: any) { alert(e.message) }
  }

  const remove = async (id: number) => {
    if (!confirm('Slette produkt?')) return
    await deleteProduct(id)
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{products.length} produkter</p>
        <button
          onClick={() => { setEditing({ category: 'Slanger', unit: 'stk' }); setIsNew(true) }}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" /> Nytt produkt
        </button>
      </div>

      {editing && (
        <div className="card p-5 mb-4 border-sky-200 border">
          <h3 className="font-semibold mb-3">{isNew ? 'Nytt produkt' : 'Rediger produkt'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Navn *</label>
              <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Kategori *</label>
              <select className="input" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Enhet</label>
              <input className="input" value={editing.unit || ''} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
            </div>
            <div>
              <label className="label">Varenummer</label>
              <input className="input" value={editing.part_number || ''} onChange={(e) => setEditing({ ...editing, part_number: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Beskrivelse</label>
              <textarea className="input" rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={save} className="btn-primary flex items-center gap-1.5 text-sm"><Save className="w-3.5 h-3.5" /> Lagre</button>
            <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Avbryt</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Navn</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Kategori</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Enhet</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-900">{p.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.category}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.unit}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => { setEditing({ ...p }); setIsNew(false) }} className="p-1.5 text-gray-400 hover:text-sky-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Suppliers tab ──────────────────────────────────────────────────────────────

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = () => getSuppliers().then(setSuppliers).catch(() => {})
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing) return
    try {
      if (isNew) await createSupplier(editing as any)
      else await updateSupplier(editing.id!, editing as any)
      setEditing(null)
      load()
    } catch (e: any) { alert(e.message) }
  }

  const remove = async (id: number) => {
    if (!confirm('Slette leverandør?')) return
    await deleteSupplier(id)
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{suppliers.length} leverandører</p>
        <button
          onClick={() => { setEditing({ categories: [], has_online_shop: false }); setIsNew(true) }}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" /> Ny leverandør
        </button>
      </div>

      {editing && (
        <div className="card p-5 mb-4 border-sky-200 border">
          <h3 className="font-semibold mb-3">{isNew ? 'Ny leverandør' : 'Rediger leverandør'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Navn *</label>
              <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Nettside</label>
              <input className="input" value={editing.website || ''} onChange={(e) => setEditing({ ...editing, website: e.target.value })} />
            </div>
            <div>
              <label className="label">E-post</label>
              <input className="input" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Region</label>
              <input className="input" value={editing.region || ''} onChange={(e) => setEditing({ ...editing, region: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 self-end">
              <input type="checkbox" id="onlineshop" checked={editing.has_online_shop || false}
                onChange={(e) => setEditing({ ...editing, has_online_shop: e.target.checked })} />
              <label htmlFor="onlineshop" className="text-sm text-gray-700">Har nettbutikk</label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={save} className="btn-primary flex items-center gap-1.5 text-sm"><Save className="w-3.5 h-3.5" /> Lagre</button>
            <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Avbryt</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Navn</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Region</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Priser</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-900">{s.name}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs">{s.region}</td>
                <td className="px-4 py-2.5 text-gray-500">{s.price_count ?? 0}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => { setEditing({ ...s }); setIsNew(false) }} className="p-1.5 text-gray-400 hover:text-sky-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(s.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Prices tab ────────────────────────────────────────────────────────────────

function PricesTab() {
  const [prices, setPrices] = useState<Price[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState({ product_id: '', supplier_id: '', price: '', unit: '', source: 'manual' as const, notes: '' })
  const [scrapeStatus, setScrapeStatus] = useState('')

  const load = () => getPrices().then(setPrices).catch(() => {})
  useEffect(() => {
    load()
    getProducts({ limit: 200 }).then((r) => setProducts(r.items)).catch(() => {})
    getSuppliers().then(setSuppliers).catch(() => {})
  }, [])

  const handleAdd = async () => {
    if (!form.product_id || !form.supplier_id || !form.price) return alert('Fyll ut alle påkrevde felt')
    try {
      await upsertPrice({
        product_id: Number(form.product_id),
        supplier_id: Number(form.supplier_id),
        price: Number(form.price),
        unit: form.unit || undefined,
        source: form.source,
        notes: form.notes || undefined,
      })
      setForm({ product_id: '', supplier_id: '', price: '', unit: '', source: 'manual', notes: '' })
      load()
    } catch (e: any) { alert(e.message) }
  }

  const handleScrape = async () => {
    setScrapeStatus('Starter skraping...')
    try {
      const res = await triggerScrape()
      setScrapeStatus(res.message)
    } catch (e: any) {
      setScrapeStatus('Feil: ' + e.message)
    }
  }

  return (
    <div>
      {/* Manual price form */}
      <div className="card p-5 mb-5">
        <h3 className="font-semibold mb-3">Legg til / oppdater pris manuelt</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2">
            <label className="label">Produkt *</label>
            <select className="input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Velg produkt</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Leverandør *</label>
            <select className="input" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">Velg leverandør</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pris (NOK) *</label>
            <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label className="label">Enhet</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="stk" />
          </div>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-1.5 text-sm mt-3">
          <Plus className="w-4 h-4" /> Lagre pris
        </button>
      </div>

      {/* Scrape button */}
      <div className="card p-5 mb-5 flex items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold">Automatisk priskraping</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Hent priser fra nettbutikker: Ahlsell, Brødrene Dahl, Slangeportalen, ParkerStore
          </p>
          {scrapeStatus && <p className="text-xs text-sky-700 mt-1">{scrapeStatus}</p>}
        </div>
        <button onClick={handleScrape} className="btn-secondary flex items-center gap-1.5 text-sm">
          <RefreshCw className="w-4 h-4" /> Start skraping
        </button>
      </div>

      {/* Prices table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Produkt</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Leverandør</th>
              <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Pris</th>
              <th className="text-center px-4 py-2.5 font-semibold text-gray-700">Kilde</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-900 text-xs">{p.product?.name}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs">{p.supplier?.name}</td>
                <td className="px-4 py-2.5 text-right font-medium">{p.price.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} kr</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={clsx('text-xs px-1.5 py-0.5 rounded-full',
                    p.source === 'scraped' ? 'bg-blue-100 text-blue-700'
                    : p.source === 'quoted' ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
                  )}>
                    {p.source}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={async () => { await deletePrice(p.id); load() }} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Quotes tab ────────────────────────────────────────────────────────────────

function QuotesTab() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => { getQuotes().then(setQuotes).catch(() => {}) }, [])

  const STATUS_COLOR: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    partial: 'bg-yellow-100 text-yellow-700',
    complete: 'bg-green-100 text-green-700',
  }
  const STATUS_LABEL: Record<string, string> = {
    draft: 'Kladd', sent: 'Sendt', partial: 'Delvis mottatt', complete: 'Komplett',
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{quotes.length} forespørsler totalt</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">#</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Avsender</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Bedrift</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Dato</th>
              <th className="text-center px-4 py-2.5 font-semibold text-gray-700">Svar</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <>
                <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">#{q.id}</td>
                  <td className="px-4 py-2.5 text-gray-900">{q.requester_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{q.requester_company || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLOR[q.status] ?? 'bg-gray-100')}>
                      {STATUS_LABEL[q.status] ?? q.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                    {new Date(q.created_at).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="px-4 py-2.5 text-center text-gray-600">
                    {q.responses.filter((r) => r.status === 'received').length}/{q.responses.length}
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="text-gray-400 hover:text-gray-600">
                      <ChevronDown className={clsx('w-4 h-4 transition-transform', expanded === q.id && 'rotate-180')} />
                    </button>
                  </td>
                </tr>
                {expanded === q.id && (
                  <tr key={`${q.id}-detail`} className="bg-sky-50/50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <h5 className="font-semibold text-gray-700 mb-1">Produkter ({q.items.length})</h5>
                          <ul className="space-y-0.5">
                            {q.items.map((item) => (
                              <li key={item.id} className="text-gray-600">
                                {item.product?.name ?? `Produkt #${item.product_id}`} — {item.quantity} {item.unit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-700 mb-1">Leverandørsvar</h5>
                          <ul className="space-y-0.5">
                            {q.responses.map((r) => (
                              <li key={r.id} className="flex items-center gap-2 text-gray-600">
                                <span className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                                  r.status === 'received' ? 'bg-green-500' : r.status === 'declined' ? 'bg-red-400' : 'bg-yellow-400'
                                )} />
                                {r.supplier?.name ?? `#${r.supplier_id}`}
                                {r.response_items.length > 0 && (
                                  <span className="text-gray-400">({r.response_items.length} priser)</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Admin page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('produkter')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin-panel</h1>
        <p className="text-gray-500 text-sm mt-1">Administrer produkter, leverandører, priser og tilbud</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card p-6">
        {tab === 'produkter'    && <ProductsTab />}
        {tab === 'leverandorer' && <SuppliersTab />}
        {tab === 'priser'       && <PricesTab />}
        {tab === 'tilbud'       && <QuotesTab />}
        {tab === 'okonomi'      && <OkonomiTab />}
      </div>
    </div>
  )
}
