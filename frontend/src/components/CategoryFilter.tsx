'use client'

import clsx from 'clsx'

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

interface CategoryFilterProps {
  categories: string[]
  selected: string
  onChange: (category: string) => void
  layout?: 'sidebar' | 'pills'
}

export default function CategoryFilter({
  categories,
  selected,
  onChange,
  layout = 'sidebar',
}: CategoryFilterProps) {
  if (layout === 'pills') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange('')}
          className={clsx(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            !selected
              ? 'bg-sky-500 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-sky-300',
          )}
        >
          Alle kategorier
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat === selected ? '' : cat)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
              cat === selected
                ? 'bg-sky-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-sky-300',
            )}
          >
            <span>{CATEGORY_ICONS[cat] || '📦'}</span>
            {cat}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => onChange('')}
        className={clsx(
          'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          !selected
            ? 'bg-sky-50 text-sky-700 border border-sky-200'
            : 'text-gray-600 hover:bg-gray-50',
        )}
      >
        Alle kategorier
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat === selected ? '' : cat)}
          className={clsx(
            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
            cat === selected
              ? 'bg-sky-50 text-sky-700 border border-sky-200 font-medium'
              : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          <span className="text-base">{CATEGORY_ICONS[cat] || '📦'}</span>
          {cat}
        </button>
      ))}
    </div>
  )
}
