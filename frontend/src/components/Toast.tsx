'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onRemove: (id: string) => void
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
}

const COLORS = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

export function Toast({ toast, onRemove }: ToastProps) {
  const Icon = ICONS[toast.type]
  
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm animate-in slide-in-from-right-5',
        COLORS[toast.type]
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-90 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Lukk"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook for using toast notifications
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showSuccess = useCallback((title: string, message?: string, duration = 5000) => {
    addToast({ type: 'success', title, message, duration })
  }, [addToast])

  const showError = useCallback((title: string, message?: string, duration = 5000) => {
    addToast({ type: 'error', title, message, duration })
  }, [addToast])

  const showInfo = useCallback((title: string, message?: string, duration = 5000) => {
    addToast({ type: 'info', title, message, duration })
  }, [addToast])

  const showWarning = useCallback((title: string, message?: string, duration = 5000) => {
    addToast({ type: 'warning', title, message, duration })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }
}

// Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast()

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  )
}