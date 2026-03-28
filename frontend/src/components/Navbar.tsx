'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Fish, Package, MessageSquare, Users, Settings, Menu, X, ChevronDown, User, LogOut, CreditCard, Tag, FileText } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/lib/AuthContext'

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: 'Gratis', className: 'bg-gray-200 text-gray-700' },
  basis: { label: 'Basis', className: 'bg-blue-100 text-blue-700' },
  pro: { label: 'Pro', className: 'bg-sky-400 text-white' },
  enterprise: { label: 'Enterprise', className: 'bg-purple-100 text-purple-700' },
}

const navLinks = [
  { href: '/produkter', label: 'Produkter', icon: Package },
  { href: '/tilbudsforesporsler', label: 'Tilbudsforespørsel', icon: MessageSquare },
  { href: '/leverandorer', label: 'Leverandører', icon: Users },
  { href: '/priser', label: 'Priser', icon: Tag },
  { href: '/notater', label: 'Notater', icon: FileText },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const planBadge = user ? (PLAN_BADGE[user.plan] ?? PLAN_BADGE.free) : null

  return (
    <nav className="bg-navy-900 shadow-lg sticky top-0 z-50" style={{ backgroundColor: '#0f3460' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Fish className="w-6 h-6 text-sky-400" />
            <span className="hidden sm:block">Havbruk Prisportal</span>
            <span className="sm:hidden">HP</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-sky-500 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop auth - placeholder */}
          <div className="hidden md:flex items-center gap-2" />

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 py-2 pb-4">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'text-sky-400 bg-white/5'
                    : 'text-gray-300 hover:text-white hover:bg-white/5',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

          </div>
        )}
      </div>
    </nav>
  )
}
