"use client"

import { useState } from "react"
import { ProductCard } from "./product-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const products = [
  {
    id: "1",
    name: "Ravioles de Ricota",
    description:
      "Ravioles artesanales rellenos de ricota fresca y espinaca, perfectos para acompañar con tu salsa favorita.",
    price: 1200,
    image: "/images/ravioli.jpg",
    category: "rellenas",
    isVeggie: true,
  },
  {
    id: "2",
    name: "Fettuccine Casero",
    description: "Cintas de pasta fresca hechas con huevos de campo. Textura perfecta para salsas cremosas.",
    price: 900,
    image: "/images/fettuccine.jpg",
    category: "cintas",
  },
  {
    id: "3",
    name: "Ñoquis de Papa",
    description: "Ñoquis tradicionales hechos con papas seleccionadas. Suaves y esponjosos, listos para cocinar.",
    price: 850,
    image: "/images/gnocchi.jpg",
    category: "especiales",
    isGlutenFree: false,
  },
  {
    id: "4",
    name: "Lasagna Fresca",
    description: "Placas de lasagna artesanales, ideales para armar tu lasagna casera con capas perfectas.",
    price: 950,
    image: "/images/lasagna.jpg",
    category: "placas",
  },
  {
    id: "5",
    name: "Ravioles de Verdura",
    description: "Ravioles rellenos de verduras de estación. Opción saludable y deliciosa.",
    price: 1150,
    image: "/images/ravioli.jpg",
    category: "rellenas",
    isVeggie: true,
    isPromo: true,
  },
  {
    id: "6",
    name: "Tallarines Caseros",
    description: "Tallarines tradicionales hechos con la receta de la nonna. Perfectos para cualquier salsa.",
    price: 800,
    image: "/images/fettuccine.jpg",
    category: "cintas",
  },
]

export function ProductsSection() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")

  const categories = [
    { id: "all", label: "Todas" },
    { id: "rellenas", label: "Pastas Rellenas" },
    { id: "cintas", label: "Cintas" },
    { id: "placas", label: "Placas" },
    { id: "especiales", label: "Especiales" },
  ]

  const filteredProducts = products.filter(
    (product) => selectedCategory === "all" || product.category === selectedCategory,
  )

  return (
    <section id="catalogo" className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl font-bold text-primary mb-4 md:text-4xl">Nuestro Catálogo</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Todas nuestras pastas son hechas en el día con ingredientes frescos y de primera calidad
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
          {/* Category Chips */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "rounded-full px-6",
                  selectedCategory === category.id 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "hover:bg-secondary hover:text-secondary-foreground hover:border-secondary"
                )}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Sort */}
          <div className="w-full md:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="bestseller">Más vendidos</SelectItem>
                <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  )
}
