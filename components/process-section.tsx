import { ShoppingBag, CreditCard, UtensilsCrossed } from "lucide-react"

const steps = [
  {
    icon: ShoppingBag,
    title: "Elegí",
    description: "Navegá nuestro catálogo y seleccioná tus pastas favoritas",
  },
  {
    icon: CreditCard,
    title: "Pagá",
    description: "Completá tu pedido de forma segura y rápida",
  },
  {
    icon: UtensilsCrossed,
    title: "Disfrutá",
    description: "Retirá o recibí tus pastas frescas y disfrutá",
  },
]

export function ProcessSection() {
  return (
    <section className="py-12 md:py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-primary mb-4 md:text-4xl">Cómo Funciona</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Tres simples pasos para disfrutar de nuestras pastas artesanales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4">
                <step.icon className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
