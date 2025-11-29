"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function Hero() {
  const [heroImage, setHeroImage] = useState<string>("/images/hero-pasta.jpg")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHeroImage = async () => {
      try {
        setIsLoading(true)
        const configRef = doc(db, "config", "site")
        const configSnap = await getDoc(configRef)
        
        if (configSnap.exists()) {
          const data = configSnap.data()
          if (data.heroImage && data.heroImage.trim() !== "") {
            setHeroImage(data.heroImage)
          }
        }
      } catch (error) {
        console.error("Error cargando imagen del hero:", error)
        // Mantener imagen por defecto si hay error
      } finally {
        setIsLoading(false)
      }
    }

    loadHeroImage()
  }, [])

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <h1 className="font-serif text-4xl font-bold leading-tight text-balance md:text-5xl lg:text-6xl text-primary">
              Pastas artesanales, frescas y al instante
            </h1>
            <p className="text-lg text-muted-foreground text-pretty md:text-xl leading-relaxed">
              Hechas con ingredientes seleccionados. Pedí online y retiralo o recibilo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" asChild>
                <Link href="/tienda">Ver menú</Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                <MessageCircle className="h-5 w-5" />
                <a href="https://wa.me/5491123456789" target="_blank" rel="noopener noreferrer">
                  Escribir por WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Cargando...</div>
              </div>
            ) : (
              <Image
                src={heroImage}
                alt="Pastas artesanales frescas"
                fill
                className="object-cover"
                priority
                unoptimized={heroImage.startsWith('http') || heroImage.startsWith('https')} // Desactivar optimización para URLs externas de Firebase Storage
                onError={() => {
                  // Fallback a imagen por defecto si falla
                  setHeroImage("/images/hero-pasta.jpg")
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
