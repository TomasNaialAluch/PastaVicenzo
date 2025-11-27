"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Package, MapPin, LogOut, Settings, ChevronLeft } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          
          {/* Sidebar / Perfil Resumen (Reutilizado para consistencia visual) */}
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
              <Button variant="ghost" className="justify-start gap-3 font-medium text-destructive hover:text-destructive hover:bg-destructive/10">
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
                <CardTitle>Preferencias de la Cuenta</CardTitle>
                <CardDescription>Personalizá tu experiencia en Pasta Vicenzo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Notificaciones */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notificaciones</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Emails de marketing</Label>
                      <p className="text-sm text-muted-foreground">Recibir novedades y promociones por correo.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Mensajes de WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">Recibir estado de pedidos por WhatsApp.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <Separator />
                
                {/* Seguridad */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Seguridad</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Contraseña Actual</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">Nueva Contraseña</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto">Actualizar Contraseña</Button>
                </div>

                <Separator />

                {/* Preferencias */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preferencias Alimentarias</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Vegetariano</Label>
                      <p className="text-sm text-muted-foreground">Destacar opciones sin carne en el menú.</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Sin TACC</Label>
                      <p className="text-sm text-muted-foreground">Mostrar solo opciones libres de gluten.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

