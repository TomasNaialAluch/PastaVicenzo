"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, Search, Heart, ShoppingCart, User, Home, Store, Phone, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetFooter } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { CartSheet } from "@/components/cart-sheet"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 md:h-12 md:w-12">
              <Image src="/images/logo.jpg" alt="Pasta Vicenzo" fill className="object-contain rounded-full" />
            </div>
            <span className="font-serif text-xl font-bold text-primary md:text-2xl">Pasta Vicenzo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="/tienda" className="text-sm font-medium hover:text-primary transition-colors">
              Tienda
            </Link>
            <Link href="/#contacto" className="text-sm font-medium hover:text-primary transition-colors">
              Contacto
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Favoritos</span>
            </Button>
            
            {isMounted ? <CartSheet /> : (
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Carrito</span>
              </Button>
            )}

            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <User className="h-5 w-5" />
              <span className="sr-only">Perfil</span>
            </Button>

            {/* Mobile Menu */}
            {isMounted ? (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="-mr-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col border-l-primary/20">
                  <SheetHeader className="text-left border-b pb-4 mb-4">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="relative h-8 w-8">
                        <Image src="/images/logo.jpg" alt="Pasta Vicenzo" fill className="object-contain rounded-full" />
                      </div>
                      <span className="font-serif text-lg font-bold text-primary">Pasta Vicenzo</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <nav className="flex flex-col gap-2 flex-1 px-4">
                    <Link
                      href="/"
                      className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <Home className="h-5 w-5" />
                      Inicio
                    </Link>
                    <Link
                      href="/tienda"
                      className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <Store className="h-5 w-5" />
                      Tienda
                    </Link>
                    <Link
                      href="/#contacto"
                      className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <Phone className="h-5 w-5" />
                      Contacto
                    </Link>
                    
                    <Separator className="my-4 bg-border/60" />
                    
                    <Link
                      href="/mi-cuenta"
                      className="flex items-center gap-4 px-2 py-3 text-lg font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Mi Cuenta
                    </Link>
                  </nav>

                  <SheetFooter className="border-t pt-4 sm:flex-col sm:items-start">
                    <div className="flex flex-col w-full gap-3">
                      <p className="text-xs text-muted-foreground text-center w-full">
                        Seguinos en nuestras redes
                      </p>
                      <div className="flex justify-center gap-4 w-full">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <span className="sr-only">Instagram</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <span className="sr-only">Facebook</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        </Button>
                      </div>
                    </div>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="icon" className="md:hidden -mr-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menú</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
