'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Noe gikk galt</h2>
          <p className="text-gray-600 mb-4">
            Beklager, det oppstod en feil. Prøv å laste siden på nytt.
          </p>
          {this.state.error && (
            <details className="text-sm text-gray-500 max-w-md">
              <summary className="cursor-pointer mb-2">Teknisk informasjon</summary>
              <code className="block p-3 bg-gray-50 rounded overflow-auto">
                {this.state.error.toString()}
              </code>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            Last siden på nytt
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
