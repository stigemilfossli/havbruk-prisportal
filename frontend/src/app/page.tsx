import Link from 'next/link'
import { Search, Package, TrendingDown, Mail, ArrowRight, Fish, Anchor, Droplets, Wrench } from 'lucide-react'

const CATEGORIES = [
  { name: 'Slanger', icon: '🌊', desc: 'PE, hydraulikk, fôr- og kjemikalieslanger', href: '/produkter?category=Slanger' },
  { name: 'Rørdeler', icon: '🔧', desc: 'PE-rør SDR11/17, bøy, muffe, T-stykke', href: '/produkter?category=Rørdeler' },
  { name: 'Tau og fortøyning', icon: '⚓', desc: 'Fortøyningsline, kjetting, sjakkel, bøyer', href: '/produkter?category=Tau+og+fortøyning' },
  { name: 'Kjemikalier', icon: '🧪', desc: 'Desinfeksjon, pH-regulering, H₂O₂', href: '/produkter?category=Kjemikalier' },
  { name: 'Pumper', icon: '⚙️', desc: 'Sentrifugal-, neddykks- og dosepumper', href: '/produkter?category=Pumper' },
  { name: 'Ventiler', icon: '🔩', desc: 'Kule-, sluseventiler og sjekklokk', href: '/produkter?category=Ventiler' },
  { name: 'Filtre', icon: '🔬', desc: 'Trommelfilter, UV-desinfeksjon', href: '/produkter?category=Filtre' },
  { name: 'Sikkerhetsutstyr', icon: '🦺', desc: 'Verneklær, hansker, øyeskylling', href: '/produkter?category=Sikkerhetsutstyr' },
]

const STEPS = [
  {
    step: '1',
    title: 'Finn produkter',
    desc: 'Søk blant hundrevis av havbruksprodukter. Se alle kjente priser fra ulike leverandører.',
    icon: Search,
    color: 'bg-sky-500',
  },
  {
    step: '2',
    title: 'Bygg forespørsel',
    desc: 'Legg produkter i kurven og spesifiser ønskede mengder. Vi sender automatisk til relevante leverandører.',
    icon: Package,
    color: 'bg-teal-500',
  },
  {
    step: '3',
    title: 'Sammenlign og velg',
    desc: 'Motta tilbud direkte i portalen. Sammenlign pris og leveringstid – velg beste alternativ.',
    icon: TrendingDown,
    color: 'bg-green-500',
  },
]

async function getStats() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/stats`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white py-24 px-4"
        style={{ background: 'linear-gradient(135deg, #0f3460 0%, #0ea5e9 100%)' }}
      >
        {/* Decorative waves */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6 backdrop-blur">
            <Fish className="w-4 h-4" />
            Norges havbruksportal for priser og tilbud
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Finn beste pris på
            <br />
            <span className="text-sky-300">havbruksutstyr</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Sammenlign priser fra over 25 norske leverandører på slanger, rørdeler, tau,
            kjemikalier og mer. Send tilbudsforespørsel til alle relevante leverandører
            med ett klikk.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <form action="/produkter" method="GET">
                <input
                  name="q"
                  type="text"
                  placeholder="Søk etter produkt, f.eks. PE-slange 100mm..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-base
                             focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-lg"
                />
              </form>
            </div>
            <Link
              href="/produkter"
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-4 rounded-xl
                         shadow-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Se alle
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-300">{stats.supplier_count}</div>
                <div className="text-blue-200">Leverandører</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-300">{stats.product_count}</div>
                <div className="text-blue-200">Produkter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-300">{stats.price_count}</div>
                <div className="text-blue-200">Prisdata</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-300">{stats.recent_updates}</div>
                <div className="text-blue-200">Oppdatert siste 7 dager</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bla i kategorier</h2>
        <p className="text-gray-500 mb-8">Finn riktig utstyr for ditt oppdrettsanlegg</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-sky-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Slik fungerer det</h2>
            <p className="text-gray-500">Tre enkle steg for å finne beste pris</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, desc, icon: Icon, color }) => (
              <div key={step} className="text-center">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Steg {step}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/produkter" className="btn-primary inline-flex items-center gap-2">
              Kom i gang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Klar til å spare penger på innkjøp?
        </h2>
        <p className="text-gray-500 mb-6">
          Registrer et tilbud i dag og la leverandørene konkurrere om din ordre.
        </p>
        <Link
          href="/tilbudsforesporsler"
          className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3"
        >
          <Mail className="w-5 h-5" />
          Send tilbudsforespørsel
        </Link>
      </section>
    </div>
  )
}
