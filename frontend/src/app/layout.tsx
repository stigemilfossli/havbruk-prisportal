import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/lib/AuthContext'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Havbruk Prisportal',
  description: 'Finn beste pris på havbruksutstyr – sammenlign leverandører og be om tilbud',
  keywords: ['havbruk', 'akvakultur', 'priser', 'leverandører', 'tilbud', 'slanger', 'rørdeler'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          <footer className="bg-navy-900 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-sky-400">Havbruk Prisportal</h3>
                  <p className="text-gray-400 text-sm">
                    Norges ledende prisportal for havbruksutstyr. Sammenlign priser fra ledende
                    leverandører og spar tid på innkjøp.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Kategorier</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>Slanger</li>
                    <li>Rørdeler</li>
                    <li>Tau og fortøyning</li>
                    <li>Kjemikalier</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Kontakt</h4>
                  <p className="text-gray-400 text-sm">post@havbrukprisportal.no</p>
                  <p className="text-gray-400 text-sm mt-1">© {new Date().getFullYear()} Havbruk Prisportal</p>
                </div>
              </div>
            </div>
          </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

