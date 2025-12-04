import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Kitchen Cabinet Drawing Analyzer',
  description: 'Professional kitchen cabinet analysis with AI-powered dimension detection',
  keywords: 'kitchen cabinet, drawing analysis, cutting list, cabinet maker, woodworking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}