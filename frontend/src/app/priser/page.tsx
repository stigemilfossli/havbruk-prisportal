'use client'

import { useRouter } from 'next/navigation'
import { Check, Star, Ship, Zap, Phone } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { createCheckout } from '@/lib/api'
import { useState } from 'react'
import clsx from 'clsx'

// ── Pricing model: per-vessel tiers with volume discount ──────────────────────
//
// Anbefaling: Per-fartøy med volumrabatt er klart smartest fordi:
//  - Flat rederi-pris mister penger på store aktører (Frøy 50+, FSV 28 fartøy)
//  - Per-fartøy er lett å forstå og rettferdig å skalere
//  - Sammenlignbart med Sea-Flux, Navatom, Marfle (markedsstandard)
//  - Gir naturlig oppgraderingsvei etterhvert som kunden vokser

const VESSEL_TIERS = [
  {
    key: 'vessel_1',
    name: 'Enkeltfartøy',
    vessels: 1,
    price: 1490,
    per_vessel: 1490,
    discount: null,
    highlighted: false,
    badge: null,
    features: [
      '1 fartøy',
      'Produktsøk og prislister',
      '10 tilbudsforespørsler/mnd',
      'E-postvarsler ved nytt tilbud',
      'Leverandørkatalog',
    ],
    cta: 'Kom i gang',
  },
  {
    key: 'vessel_3',
    name: 'Liten flåte',
    vessels: 3,
    price: 3490,
    per_vessel: 1163,
    discount: 22,
    highlighted: false,
    badge: null,
    features: [
      'Inntil 3 fartøy',
      'Alt i Enkeltfartøy',
      'Ubegrenset forespørsler',
      'Prishistorikk og -varslinger',
      'Felles innkjøpsoversikt',
    ],
    cta: 'Velg Liten flåte',
  },
  {
    key: 'vessel_5',
    name: 'Mellomstor flåte',
    vessels: 5,
    price: 4990,
    per_vessel: 998,
    discount: 33,
    highlighted: true,
    badge: 'Mest populær',
    features: [
      'Inntil 5 fartøy',
      'Alt i Liten flåte',
      'Prioritert support',
      'Dedikert kontaktperson',
      'Rapporter og statistikk',
    ],
    cta: 'Velg Mellomstor flåte',
  },
  {
    key: 'vessel_7',
    name: 'Stor flåte',
    vessels: 7,
    price: 5990,
    per_vessel: 856,
    discount: 43,
    highlighted: false,
    badge: null,
    features: [
      'Inntil 7 fartøy',
      'Alt i Mellomstor flåte',
      'API-tilgang',
      'ERP-integrasjon (Visma/SAP)',
      'Skreddersydd opplæring',
    ],
    cta: 'Velg Stor flåte',
  },
]

const FAQ = [
  {
    q: 'Hvorfor betaler vi per fartøy?',
    a: 'Per-fartøy-prising er markedsstandarden i maritim SaaS (Sea-Flux, Navatom, Marfle bruker alle denne modellen). Det er rettferdig: du betaler for det du bruker. Et rederi med 1 servicebåt betaler 1 490 kr/mnd. Et rederi med 28 fartøy kontakter oss for en god volumavtale.',
  },
  {
    q: 'Vi har over 7 fartøy — hva gjør vi?',
    a: 'Ta kontakt direkte på post@havbrukspris.no eller ring oss. Vi tilbyr skreddersydde rederipakker for større flåter med betydelig rabatt. Eksempel: 15 fartøy fra ~600 kr/fartøy/mnd.',
  },
  {
    q: 'Kan vi legge til flere fartøy underveis?',
    a: 'Ja. Du kan oppgradere abonnementet ditt når som helst. Vi beregner differansen pro rata — du betaler kun for gjenværende dager i perioden.',
  },
  {
    q: 'Støtter dere faktura/EHF?',
    a: 'Ja, alle kunder kan betale via faktura eller EHF. Abonnement på 3 fartøy og oppover kan velge kvartalsvise eller årlige fakturaer (10% rabatt ved årsabonnement).',
  },
  {
    q: 'Er prisene inkludert MVA?',
    a: 'Nei, alle priser er ekskludert MVA. MVA på 25% beregnes ved kjøp.',
  },
  {
    q: 'Hva er forskjellen fra å bare ringe leverandøren direkte?',
    a: 'Med Havbruk Prisportal sammenligner du priser fra 25+ leverandører samtidig, sender strukturerte tilbudsforespørsler til alle på én gang, og sparer 2-4 timer per innkjøpsrunde. For et fartøy med 20-30 innkjøp per år er innsparingen langt større enn abonnementskostnaden.',
  },
]

export default function PriserPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  async function handleCta(planKey: string) {
    if (!user) {
      router.push(`/registrer?plan=${planKey}`)
      return
    }
    setLoadingPlan(planKey)
    try {
      const { url } = await createCheckout(planKey)
      window.location.href = url
    } catch {
      alert('Kunne ikke starte betaling. Prøv igjen.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Priser per fartøy</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Betal for det du bruker. Jo flere fartøy, jo billigere per fartøy.
          Ingen bindingstid — avslutter når du vil.
        </p>
      </div>

      {/* Value prop banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 mb-12 max-w-3xl mx-auto text-center">
        <p className="text-sm text-sky-800">
          <strong>Eksempel:</strong> Frøy Supporter bruker 3 timer i uken på å innhente priser fra leverandører.
          Med Havbruk Prisportal: <strong>15 minutter</strong>. Abonnementet koster seg inn på første innkjøpsrunde.
        </p>
      </div>

      {/* Vessel tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {VESSEL_TIERS.map((tier) => (
          <div
            key={tier.key}
            className={clsx(
              'relative rounded-2xl border-2 p-6 flex flex-col',
              tier.highlighted
                ? 'border-sky-500 shadow-xl shadow-sky-100 bg-white'
                : 'border-gray-200 bg-white',
            )}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  <Star className="w-3 h-3" />{tier.badge}
                </span>
              </div>
            )}

            {/* Vessel count indicator */}
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: tier.vessels }).map((_, i) => (
                <Ship key={i} className={clsx('w-4 h-4', tier.highlighted ? 'text-sky-500' : 'text-gray-400')} />
              ))}
            </div>

            <div className="mb-2">
              <h2 className="text-lg font-bold text-gray-900">{tier.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Inntil {tier.vessels} fartøy</p>
            </div>

            <div className="mb-1 flex items-end gap-1">
              <span className="text-3xl font-bold text-gray-900">
                {tier.price.toLocaleString('nb-NO')} kr
              </span>
              <span className="text-gray-500 text-sm mb-1">/mnd</span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-gray-400">
                = {tier.per_vessel.toLocaleString('nb-NO')} kr/fartøy
              </span>
              {tier.discount && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  -{tier.discount}%
                </span>
              )}
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className={clsx('w-4 h-4 mt-0.5 shrink-0', tier.highlighted ? 'text-sky-500' : 'text-gray-400')} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCta(tier.key)}
              disabled={loadingPlan === tier.key || user?.plan === tier.key}
              className={clsx(
                'w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60',
                tier.highlighted
                  ? 'bg-sky-500 hover:bg-sky-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900',
              )}
            >
              {loadingPlan === tier.key ? 'Laster...'
                : user?.plan === tier.key ? 'Din nåværende plan'
                : tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Enterprise / large fleet CTA */}
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 mb-20 text-center max-w-3xl mx-auto">
        <Ship className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Rederi med 8+ fartøy?</h3>
        <p className="text-gray-600 mb-2">
          Vi lager skreddersydde volumavtaler for store rederier. Typiske eksempler:
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-5 text-sm">
          {[
            { label: '10 fartøy', price: '~750 kr/fartøy' },
            { label: '20 fartøy', price: '~600 kr/fartøy' },
            { label: '50+ fartøy', price: 'Ring oss' },
          ].map((ex) => (
            <div key={ex.label} className="bg-white border border-gray-200 rounded-xl px-4 py-2">
              <span className="font-semibold text-gray-800">{ex.label}:</span>{' '}
              <span className="text-gray-600">{ex.price}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:post@havbrukspris.no"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors">
            <Zap className="w-4 h-4" /> Send oss en e-post
          </a>
          <a href="tel:+4700000000"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-900 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
            <Phone className="w-4 h-4" /> Ring oss
          </a>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mb-20 overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sammenlign pakker</h2>
        <table className="w-full text-sm border border-gray-200 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Funksjon</th>
              {VESSEL_TIERS.map((t) => (
                <th key={t.key} className={clsx('text-center px-4 py-3 font-semibold', t.highlighted ? 'text-sky-600' : 'text-gray-700')}>
                  {t.name}
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Rederi</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Antall fartøy', '1', '3', '5', '7', 'Ubegrenset'],
              ['Produktsøk', '✓', '✓', '✓', '✓', '✓'],
              ['Tilbudsforespørsler/mnd', '10', 'Ubegrenset', 'Ubegrenset', 'Ubegrenset', 'Ubegrenset'],
              ['Prishistorikk', '—', '✓', '✓', '✓', '✓'],
              ['Prisvarslinger', '—', '✓', '✓', '✓', '✓'],
              ['Rapporter', '—', '—', '✓', '✓', '✓'],
              ['API-tilgang', '—', '—', '—', '✓', '✓'],
              ['ERP-integrasjon', '—', '—', '—', '✓', '✓'],
              ['Dedikert kontakt', '—', '—', '✓', '✓', '✓'],
              ['Faktura/EHF', '—', '✓', '✓', '✓', '✓'],
            ].map(([feat, ...vals]) => (
              <tr key={feat as string} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700 font-medium">{feat}</td>
                {vals.map((v, i) => (
                  <td key={i} className={clsx('text-center px-4 py-3', v === '—' ? 'text-gray-300' : 'text-gray-800 font-medium')}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-5 py-3 font-bold text-gray-900">Pris/mnd</td>
              {VESSEL_TIERS.map((t) => (
                <td key={t.key} className={clsx('text-center px-4 py-3 font-bold', t.highlighted ? 'text-sky-600' : 'text-gray-900')}>
                  {t.price.toLocaleString('nb-NO')} kr
                </td>
              ))}
              <td className="text-center px-4 py-3 font-bold text-gray-900">Kontakt oss</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Vanlige spørsmål</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 font-medium text-gray-900 flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
                <span className="text-gray-400 text-lg ml-2">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
