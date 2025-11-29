import type React from "react"
import type { Metadata } from "next"
import { Bodoni_Moda, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pasta Vicenzo - Pastas Artesanales Frescas",
  description: "Pastas artesanales hechas con ingredientes seleccionados. Pedí online y retiralo o recibilo.",
  generator: "v0.app",
}

import { CartProvider } from "@/lib/cart-context"
import { AuthProvider } from "@/lib/auth-context"
import { ConfirmModalProvider } from "@/components/ui/global-confirmation-modal"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${bodoni.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ConfirmModalProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ConfirmModalProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
