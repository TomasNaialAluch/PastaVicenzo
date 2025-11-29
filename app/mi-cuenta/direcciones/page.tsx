"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { User, Package, MapPin, LogOut, Settings, ChevronLeft, Plus, Trash2, Pencil, Home as HomeIcon, Briefcase, Map } from "lucide-react"
import Link from "next/link"
import { AddressDialog, type Address } from "@/components/address-dialog"
import { useConfirmModal } from "@/components/ui/global-confirmation-modal"
import { useAuth } from "@/lib/auth-context"
import { LoginView } from "@/components/auth/login-view"
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DireccionesPage() {
  const { user, loading, logout } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressesLoading, setAddressesLoading] = useState(true)
  const { openModal } = useConfirmModal()

  // Cargar direcciones desde Firestore - DEBE estar antes de cualquier retorno condicional
  useEffect(() => {
    if (!user?.uid) {
      setAddresses([])
      setAddressesLoading(false)
      return
    }

    const loadAddresses = async () => {
      try {
        setAddressesLoading(true)
        // Usar subcolección: users/{userId}/addresses
        const addressesRef = collection(db, "users", user.uid, "addresses")
        const querySnapshot = await getDocs(addressesRef)
        const addressesData: Address[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          addressesData.push({
            id: doc.id,
            name: data.name || "",
            type: data.type || "other",
            street: data.street || "",
            city: data.city || "",
            zipCode: data.zipCode || "",
            notes: data.notes || "",
            isDefault: data.isDefault || false,
          })
        })
        setAddresses(addressesData)
      } catch (error) {
        console.error("Error cargando direcciones:", error)
        setAddresses([])
      } finally {
        setAddressesLoading(false)
      }
    }

    loadAddresses()
  }, [user?.uid])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/10">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
          <LoginView />
        </main>
        <Footer />
      </div>
    )
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "Tu cuenta"
  const userEmail = user.email || "Sin email"

  const handleOpenDialog = (address?: Address) => {
    setEditingAddress(address || null)
    setIsDialogOpen(true)
  }

  const handleSave = async (address: Address) => {
    if (!user?.uid) return

    try {
      if (editingAddress) {
        // Edit en Firestore - usar subcolección
        const addressRef = doc(db, "users", user.uid, "addresses", address.id)
        await updateDoc(addressRef, {
          name: address.name,
          type: address.type,
          street: address.street,
          city: address.city,
          zipCode: address.zipCode,
          notes: address.notes,
          isDefault: address.isDefault,
        })
        setAddresses(addresses.map((addr) => (addr.id === address.id ? address : addr)))
      } else {
        // Create en Firestore - usar subcolección (ya no necesitamos userId en el documento)
        const newAddressRef = await addDoc(collection(db, "users", user.uid, "addresses"), {
          name: address.name,
          type: address.type,
          street: address.street,
          city: address.city,
          zipCode: address.zipCode,
          notes: address.notes,
          isDefault: address.isDefault,
        })
        setAddresses([...addresses, { ...address, id: newAddressRef.id }])
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error guardando dirección:", error)
    }
  }

  const handleDelete = (id: string) => {
    if (!user?.uid) return
    
    openModal({
      title: "¿Eliminar dirección?",
      description: "Esta acción no se puede deshacer. ¿Estás seguro de que querés eliminar esta dirección?",
      actionLabel: "Sí, eliminar",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", user.uid, "addresses", id))
          setAddresses(addresses.filter((addr) => addr.id !== id))
        } catch (error) {
          console.error("Error eliminando dirección:", error)
        }
      },
    })
  }

  const handleSetDefault = async (id: string) => {
    if (!user?.uid) return

    try {
      // Primero quitar el default de todas las direcciones
      const updates = addresses.map(async (addr) => {
        const addressRef = doc(db, "users", user.uid, "addresses", addr.id)
        await updateDoc(addressRef, {
          isDefault: addr.id === id,
        })
      })
      await Promise.all(updates)
      setAddresses(addresses.map((addr) => ({ ...addr, isDefault: addr.id === id })))
    } catch (error) {
      console.error("Error actualizando dirección por defecto:", error)
    }
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
              <h2 className="font-serif text-xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground text-sm">{userEmail}</p>
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
              <Button 
                variant="ghost" 
                className="justify-start gap-3 font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
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

            {addressesLoading ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Cargando direcciones...</p>
              </div>
            ) : addresses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-serif text-xl font-bold mb-2">No tenés direcciones guardadas</h3>
                  <p className="text-muted-foreground mb-6">
                    Agregá tus direcciones de entrega para facilitar tus pedidos. Podés crear más de una dirección.
                  </p>
                  <Button onClick={() => handleOpenDialog()} size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar primera dirección
                  </Button>
                </CardContent>
              </Card>
            ) : (
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
            )}
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

