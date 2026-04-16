'use client'

import { useState } from 'react'
import { Download, FileText, Database, Archive, ChevronDown } from 'lucide-react'
import { useToast } from './Toast'

interface ExportButtonProps {
  productId?: number
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export function ExportButton({ productId, variant = 'default', className = '' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { showError, showSuccess } = useToast()

  const handleExport = async (type: string) => {
    try {
      setLoading(true)

      let url = '/api/export/'
      let filename = 'export'

      switch (type) {
        case 'prices':
          url += 'prices.csv'
          filename = 'prices.csv'
          break
        case 'products':
          url += 'products.csv'
          filename = 'products.csv'
          break
        case 'suppliers':
          url += 'suppliers.csv'
          filename = 'suppliers.csv'
          break
        case 'history':
          if (!productId) throw new Error('Product ID required for history export')
          url += `products/${productId}/history.csv`
          filename = `price_history_product_${productId}.csv`
          break
        case 'all':
          url += 'all.zip'
          filename = 'havbruk_prisportal_export.zip'
          break
        default:
          throw new Error('Unknown export type')
      }

      // Trigger download
      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      showSuccess('Eksport fullført', `Filen ${filename} er lastet ned`)

    } catch (err) {
      showError('Eksport feilet', 'Kunne ikke eksportere data')
      console.error(err)
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const buttonClass = {
    default: 'bg-sky-500 hover:bg-sky-600 text-white',
    outline: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  }[variant]

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${buttonClass} ${className}`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Eksporterer...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Eksporter
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Eksporter data
              </div>

              <button
                onClick={() => handleExport('prices')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Alle priser</div>
                  <div className="text-xs text-gray-500">CSV-fil med alle priser</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('products')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Database className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Produkter</div>
                  <div className="text-xs text-gray-500">CSV-fil med alle produkter</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('suppliers')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Database className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Leverandører</div>
                  <div className="text-xs text-gray-500">CSV-fil med alle leverandører</div>
                </div>
              </button>

              {productId && (
                <button
                  onClick={() => handleExport('history')}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">Prishistorikk</div>
                    <div className="text-xs text-gray-500">CSV-fil med prishistorikk</div>
                  </div>
                </button>
              )}

              <div className="border-t border-gray-200 my-2" />

              <button
                onClick={() => handleExport('all')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Archive className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Komplett eksport</div>
                  <div className="text-xs text-gray-500">ZIP-fil med alle data</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
