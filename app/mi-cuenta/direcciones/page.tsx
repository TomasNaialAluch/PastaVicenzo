"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { User, Package, MapPin, LogOut, Settings, ChevronLeft, Plus, Trash2, Pencil, Home as HomeIcon, Briefcase, Map } from "lucide-react"
import Link from "next/link"
import { AddressDialog, type Address } from "@/components/address-dialog"

const initialAddresses: Address[] = [
  {
    id: "1",
    name: "Casa",
    type: "home",
    street: "Av. Libertador 1234, 5A",
    city: "Palermo, CABA",
    zipCode: "1425",
    notes: "Dejar en portería si no atiendo",
    isDefault: true,
  },
  {
    id: "2",
    name: "Oficina",
    type: "work",
    street: "Av. Corrientes 456, Piso 3",
    city: "San Nicolás, CABA",
    zipCode: "1043",
    notes: "Horario de oficina 9 a 18hs",
    isDefault: false,
  },
]

export default function DireccionesPage() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const handleOpenDialog = (address?: Address) => {
    setEditingAddress(address || null)
    setIsDialogOpen(true)
  }

  const handleSave = (address: Address) => {
    if (editingAddress) {
      // Edit
      setAddresses(addresses.map((addr) => (addr.id === address.id ? address : addr)))
    } else {
      // Create
      setAddresses([...addresses, address])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta dirección?")) {
      setAddresses(addresses.filter((addr) => addr.id !== id))
    }
  }

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map((addr) => ({ ...addr, isDefault: addr.id === id })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "home": return <HomeIcon className="h-5 w-5 text-primary" />
      case "work": return <Briefcase className="h-5 w-5 text-primary" />
      default: return <Map className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          
          {/* Sidebar (Reutilizado) */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-6 hidden md:block">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border shadow-sm">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <User className="h-12 w-12" />
              </div>
              <h2 className="font-serif text-xl font-bold">Juan Pérez</h2>
              <p className="text-muted-foreground text-sm">juan.perez@email.com</p>
            </div>

            <nav className="flex flex-col gap-2">
              <Button variant="ghost" asChild className="justify-start gap-3 font-medium hover:bg-background hover:shadow-sm w-full">
                <Link href="/mi-cuenta">
                  <Package className="h-4 w-4" />
                  Mis Pedidos
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start gap-3 font-medium bg-background border shadow-sm w-full">
                <Link href="/mi-cuenta/direcciones">
                  <MapPin className="h-4 w-4" />
                  Direcciones
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start gap-3 font-medium hover:bg-background hover:shadow-sm w-full">
                <Link href="/mi-cuenta/configuracion">
                  <Settings className="h-4 w-4" />
                  Configuración
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start gap-3 font-medium text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </nav>
          </aside>

          {/* Contenido Principal */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="md:hidden">
                  <Link href="/mi-cuenta">
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div>
                  <h1 className="font-serif text-3xl font-bold text-primary">Mis Direcciones</h1>
                  <p className="text-muted-foreground">Gestioná tus lugares de entrega frecuentes.</p>
                </div>
              </div>
              <Button className="hidden sm:flex gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Nueva Dirección
              </Button>
            </div>
            
            <Button className="w-full mb-6 sm:hidden gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Nueva Dirección
            </Button>

            <div className="grid gap-6 sm:grid-cols-2">
              {addresses.map((addr) => (
                <Card key={addr.id} className={`relative overflow-hidden ${addr.isDefault ? 'border-primary/50 bg-primary/5' : ''}`}>
                  {addr.isDefault && (
                    <div className="absolute top-0 right-0 p-2 bg-primary text-primary-foreground text-xs font-bold rounded-bl-lg">
                      Principal
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getIcon(addr.type)}
                      {addr.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">{addr.street}</p>
                    <p className="text-muted-foreground">{addr.city}</p>
                    <p className="text-muted-foreground">CP: {addr.zipCode}</p>
                    {addr.notes && <p className="text-muted-foreground text-xs mt-2 italic">"{addr.notes}"</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-0">
                    {!addr.isDefault && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleSetDefault(addr.id)}>
                        Hacer Principal
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenDialog(addr)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(addr.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <AddressDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          addressToEdit={editingAddress}
          onSave={handleSave}
        />
      </main>
      <Footer />
    </div>
  )
}

