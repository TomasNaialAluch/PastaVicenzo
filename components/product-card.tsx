"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Plus, Minus, ShoppingCart, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image: string
  category?: string
  isPromo?: boolean
  isVeggie?: boolean
  isGlutenFree?: boolean
  unitsPerPackage?: number
  servesPeople?: number
  variants?: { id: string; label: string; price: number }[]
}

export function ProductCard({ id, name, description, price, image, category, isPromo, isVeggie, isGlutenFree, unitsPerPackage, servesPeople, variants }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants && variants.length > 0 ? variants[0].id : "")
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const { addItem } = useCart()

  const currentPrice = variants && variants.length > 0 && selectedVariantId
    ? variants.find(v => v.id === selectedVariantId)?.price || price
    : price

  const handleAddToCart = () => {
    setIsAdding(true)
    
    const variant = variants?.find(v => v.id === selectedVariantId)
    const finalId = variant ? `${id}-${variant.id}` : id
    const finalName = variant ? `${name} (${variant.label})` : name
    const finalPrice = variant ? variant.price : price

    // Simular pequeña demora para la animación
    setTimeout(() => {
      for (let i = 0; i < quantity; i++) {
        addItem({ id: finalId, name: finalName, price: finalPrice, image })
      }
      
      toast.custom((t) => (
        <div className="flex items-center gap-4 w-full p-4 bg-background border border-primary/20 rounded-lg shadow-lg">
          <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h4 className="font-serif font-bold text-primary">¡Agregado al carrito!</h4>
            <p className="text-sm text-muted-foreground">
              Has agregado <span className="font-semibold text-foreground">{quantity}x {finalName}</span>
            </p>
          </div>
        </div>
      ), { duration: 3000 })

      setQuantity(1)
      
      // Resetear estado del botón después de un momento
      setTimeout(() => setIsAdding(false), 1000)
    }, 300)
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
          <span className="sr-only">Agregar a favoritos</span>
        </Button>
        {isPromo && <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">Promo</Badge>}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {isVeggie && (
            <Badge variant="secondary" className="text-xs">
              Veggie
            </Badge>
          )}
          {isGlutenFree && (
            <Badge variant="secondary" className="text-xs">
              Sin TACC
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-serif text-xl font-bold text-primary mb-2 drop-shadow-sm">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
        {category === "rellenas" && unitsPerPackage && (
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            {unitsPerPackage} unidades por paquete
          </p>
        )}
        
        {/* Selector de Variantes */}
        {variants && variants.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Elegí una opción:</p>
            <div className="grid grid-cols-1 gap-3">
              {variants.map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariantId === variant.id ? "default" : "outline"}
                  size="lg"
                  className={`justify-between h-12 px-4 ${
                    selectedVariantId === variant.id 
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20" 
                      : "hover:bg-primary/5 hover:border-primary/50 border-muted-foreground/30"
                  }`}
                  onClick={() => setSelectedVariantId(variant.id)}
                >
                  <span className="text-sm font-medium">{variant.label}</span>
                  <span className={`text-base font-bold ${
                    selectedVariantId === variant.id ? "text-primary-foreground" : "text-primary"
                  }`}>
                    ${variant.price.toLocaleString('es-AR')}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {!variants?.length && (
          <p className="text-2xl font-bold text-primary mt-3">
            ${typeof currentPrice === 'number' ? currentPrice.toLocaleString('es-AR') : currentPrice}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <div className="flex items-center border rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-semibold">{quantity}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(quantity + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          className={`flex-1 font-semibold gap-2 transition-all duration-300 ${
            isAdding 
              ? "bg-green-600 hover:bg-green-700 text-white scale-95" 
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <Check className="h-4 w-4 animate-in zoom-in" />
              <span>¡Listo!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span>Agregar</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
