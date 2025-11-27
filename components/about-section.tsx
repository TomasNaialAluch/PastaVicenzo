import { Button } from "@/components/ui/button"
import { Instagram, MessageCircle } from "lucide-react"

export function AboutSection() {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold text-primary mb-6 md:text-4xl">Sobre Pasta Vicenzo</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Somos un taller de pastas artesanales que combina técnicas tradicionales con ingredientes frescos de primera
            calidad. Nuestro objetivo es llevar a tu mesa el sabor casero de siempre, con opciones para todos los
            gustos. Hacemos todo en el día, con dedicación y mucha pasión por la cocina.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              <Instagram className="h-5 w-5" />
              <a href="https://instagram.com/pastasvicenzo" target="_blank" rel="noopener noreferrer">
                Seguinos en Instagram
              </a>
            </Button>
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <MessageCircle className="h-5 w-5" />
              <a href="https://wa.me/5491123456789" target="_blank" rel="noopener noreferrer">
                Escribinos por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
