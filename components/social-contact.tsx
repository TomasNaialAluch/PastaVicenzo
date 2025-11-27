import { Instagram, MessageCircle, Clock, MapPin } from "lucide-react"

export function SocialContact() {
  return (
    <section id="contacto" className="py-12 md:py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg">
            <Instagram className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Instagram</h3>
            <p className="text-sm text-muted-foreground mb-3">Seguinos para ver novedades y promos</p>
            <a
              href="https://instagram.com/pastasvicenzo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm font-medium"
            >
              @pastasvicenzo
            </a>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg">
            <MessageCircle className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">WhatsApp</h3>
            <p className="text-sm text-muted-foreground mb-3">Pedidos y consultas</p>
            <a
              href="https://wa.me/5491123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm font-medium"
            >
              +54 9 11 2345-6789
            </a>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg">
            <Clock className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Horarios</h3>
            <p className="text-sm text-muted-foreground">Lun a Vie: 9:00 - 20:00</p>
            <p className="text-sm text-muted-foreground">Sáb: 9:00 - 14:00</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg">
            <MapPin className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Zona de Entrega</h3>
            <p className="text-sm text-muted-foreground">CABA y GBA Norte</p>
            <p className="text-sm text-muted-foreground">Consultá tu zona</p>
          </div>
        </div>
      </div>
    </section>
  )
}
