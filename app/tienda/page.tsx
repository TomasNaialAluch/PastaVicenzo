import { ProductsSection } from "@/components/products-section"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TiendaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-secondary/30 py-8 md:py-12 mb-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl font-bold text-primary mb-4">Nuestra Tienda</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explorá nuestra selección de pastas frescas artesanales
            </p>
          </div>
        </div>
        <ProductsSection />
      </main>
      <Footer />
    </div>
  )
}


