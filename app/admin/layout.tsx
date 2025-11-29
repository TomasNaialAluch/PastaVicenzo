"use client"

import { useAuth } from "@/lib/auth-context"
import { useIsAdmin } from "@/lib/use-is-admin"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Package, Users, ShoppingBag, Settings, LogOut, BookOpen } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LoginView } from "@/components/auth/login-view"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading, logout } = useAuth()
  const { isAdmin, loading: adminCheckLoading } = useIsAdmin()
  const pathname = usePathname()

  // Validación TypeScript: esperar a que termine la carga de autenticación y verificación de admin
  if (authLoading || adminCheckLoading) {
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

  // Validación TypeScript: verificar que el usuario esté autenticado
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

  // Validación TypeScript: verificar que el usuario sea admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/10">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Acceso Denegado</h1>
          <p className="text-lg text-muted-foreground mb-8">
            No tenés permisos para acceder a esta página.
          </p>
          <Button asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const navItems = [
    { href: "/admin/pedidos", label: "Pedidos", icon: Package },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/productos", label: "Productos", icon: ShoppingBag },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
    { href: "/admin/guia", label: "Guía de Uso", icon: BookOpen },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestioná tu tienda desde aquí</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar de navegación */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2 bg-card rounded-xl border p-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "default" : "ghost"}
                    asChild
                    className="justify-start gap-3 font-medium"
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
              <div className="border-t my-2" />
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

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

