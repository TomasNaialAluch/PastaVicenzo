"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "./product-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isVeggie?: boolean
  isGlutenFree?: boolean
  isPromo?: boolean
  isActive?: boolean
  unitsPerPackage?: number
  servesPeople?: number
  variants?: { id: string; label: string; price: number }[]
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")

  // Cargar productos desde Firestore
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true)
        const productsRef = collection(db, "products")
        const productsQuery = query(productsRef, orderBy("name"))
        const productsSnapshot = await getDocs(productsQuery)
        
        const productsData: Product[] = []
        productsSnapshot.forEach((doc) => {
          const data = doc.data()
          // Solo incluir productos activos (isActive !== false)
          if (data.isActive !== false) {
            productsData.push({
              id: doc.id,
              name: data.name || "",
              description: data.description || "",
              price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
              image: data.image || "",
              category: data.category || "rellenas",
              isVeggie: data.isVeggie || false,
              isGlutenFree: data.isGlutenFree || false,
              isPromo: data.isPromo || false,
              unitsPerPackage: data.unitsPerPackage ? Number(data.unitsPerPackage) : undefined,
              servesPeople: data.servesPeople ? Number(data.servesPeople) : undefined,
              variants: data.variants || [],
            })
          }
        })
        
        setProducts(productsData)
        console.log(`✅ Cargados ${productsData.length} productos activos`)
      } catch (error) {
        console.error("Error cargando productos:", error)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [])

  const categories = [
    { id: "all", label: "Todas" },
    { id: "rellenas", label: "Pastas Rellenas" },
    { id: "cintas", label: "Cintas" },
    { id: "placas", label: "Placas" },
    { id: "especiales", label: "Especiales" },
    { id: "noqui", label: "Ñoqui" },
  ]

  // Filtrar y ordenar productos
  const filteredProducts = products
    .filter((product) => selectedCategory === "all" || product.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "bestseller":
          // Por ahora, ordenar por nombre si no hay datos de ventas
          return a.name.localeCompare(b.name)
        case "relevance":
        default:
          // Mantener orden original (por nombre desde Firestore)
          return 0
      }
    })

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
        {productsLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {selectedCategory === "all" 
                ? "Aún no hay productos disponibles." 
                : "No hay productos en esta categoría."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                image={product.image}
                category={product.category}
                isPromo={product.isPromo}
                isVeggie={product.isVeggie}
                isGlutenFree={product.isGlutenFree}
                unitsPerPackage={product.unitsPerPackage}
                servesPeople={product.servesPeople}
                variants={product.variants}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
