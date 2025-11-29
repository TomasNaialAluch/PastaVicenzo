"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Package, MapPin, LogOut, Settings, ChevronLeft, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { toast } from "sonner"

export default function ConfiguracionPage() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    preferences: {
      marketingEmails: true,
      whatsappUpdates: true,
      isVegetarian: false,
      isGlutenFree: false
    }
  })

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        try {
          setLoading(true)
          // Cargar datos básicos de Auth
          const nameParts = user.displayName?.split(" ") || []
          const firstName = nameParts[0] || ""
          const lastName = nameParts.slice(1).join(" ") || ""
          
          // Cargar datos extra de Firestore
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)
          const userData = userDoc.exists() ? userDoc.data() : {}

          setFormData({
            firstName: firstName,
            lastName: lastName,
            phone: userData.phone || "",
            preferences: {
              marketingEmails: userData.preferences?.marketingEmails ?? true,
              whatsappUpdates: userData.preferences?.whatsappUpdates ?? true,
              isVegetarian: userData.preferences?.isVegetarian ?? false,
              isGlutenFree: userData.preferences?.isGlutenFree ?? false
            }
          })
        } catch (error) {
          console.error("Error cargando datos:", error)
          toast.error("Error al cargar tu información")
        } finally {
          setLoading(false)
        }
      }
      loadUserData()
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      
      // 1. Actualizar Profile en Auth (Nombre visible)
      const displayName = `${formData.firstName} ${formData.lastName}`.trim()
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName })
      }

      // 2. Actualizar Firestore (Teléfono y Preferencias)
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        phone: formData.phone,
        preferences: formData.preferences,
        updatedAt: new Date().toISOString()
      })

      toast.success("¡Cambios guardados correctamente!")
    } catch (error) {
      console.error("Error guardando perfil:", error)
      toast.error("Hubo un problema al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/10">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Cargando...</p>
        </main>
        <Footer />
      </div>
    )
  }
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          
          {/* Sidebar / Perfil Resumen (Reutilizado para consistencia visual) */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-6 hidden md:block">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border shadow-sm">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "Usuario"} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
              <h2 className="font-serif text-xl font-bold">{user.displayName || "Usuario"}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>

            <nav className="flex flex-col gap-2">
              <Button variant="ghost" asChild className="justify-start gap-3 font-medium hover:bg-background hover:shadow-sm w-full">
                <Link href="/mi-cuenta">
                  <Package className="h-4 w-4" />
                  Mis Pedidos
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start gap-3 font-medium hover:bg-background hover:shadow-sm w-full">
                <Link href="/mi-cuenta/direcciones">
                  <MapPin className="h-4 w-4" />
                  Direcciones
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start gap-3 font-medium bg-background border shadow-sm">
                <Settings className="h-4 w-4" />
                Configuración
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
            <div className="mb-6 flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="md:hidden">
                <Link href="/mi-cuenta">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="font-serif text-3xl font-bold text-primary">Configuración</h1>
                <p className="text-muted-foreground">Gestioná tus preferencias y seguridad.</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualizá tus datos de contacto para los envíos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email || ""} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">El email no se puede cambiar.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Ej: 11 1234 5678"
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias</CardTitle>
                  <CardDescription>Personalizá tu experiencia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Vegetariano</Label>
                      <p className="text-sm text-muted-foreground">Destacar opciones sin carne.</p>
                    </div>
                    <Switch 
                      checked={formData.preferences.isVegetarian}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        preferences: {...formData.preferences, isVegetarian: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Sin TACC</Label>
                      <p className="text-sm text-muted-foreground">Mostrar solo opciones libres de gluten.</p>
                    </div>
                    <Switch 
                      checked={formData.preferences.isGlutenFree}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        preferences: {...formData.preferences, isGlutenFree: checked}
                      })}
                    />
                  </div>
                  
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Novedades y Promos</Label>
                      <p className="text-sm text-muted-foreground">Recibir emails con ofertas.</p>
                    </div>
                    <Switch 
                      checked={formData.preferences.marketingEmails}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        preferences: {...formData.preferences, marketingEmails: checked}
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

