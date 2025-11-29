"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Package, MapPin, LogOut, Settings, ChevronDown, Filter } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { LoginView } from "@/components/auth/login-view"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Tipo para pedidos
type OrderStatus = "entregado" | "en_camino" | "preparacion" | "cancelado"

interface Order {
  id: string
  date: string
  status: OrderStatus
  total: number
  items: { name: string; image: string }[]
  itemCount: number
}

export default function MiCuentaPage() {
  const { user, loading, logout } = useAuth()
  const [visibleCount, setVisibleCount] = useState(3)
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Cargar pedidos desde Firestore - DEBE estar antes de cualquier retorno condicional
  useEffect(() => {
    if (!user?.uid) {
      setOrders([])
      setOrdersLoading(false)
      return
    }

    const loadOrders = async () => {
      try {
        setOrdersLoading(true)
        console.log("🔍 Buscando pedidos para userId:", user.uid)
        // Usar subcolección: users/{userId}/orders
        const ordersRef = collection(db, "users", user.uid, "orders")
        
        // Con subcolección, podemos usar orderBy directamente sin necesidad de índice compuesto
        let querySnapshot
        let needsClientSort = false
        try {
          const q = query(
            ordersRef,
            orderBy("createdAt", "desc")
          )
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          // Si falla por algún motivo, intentar sin orderBy y ordenar en el cliente
          console.warn("⚠️ No se pudo ordenar en la query, ordenando en el cliente...")
          querySnapshot = await getDocs(ordersRef)
          needsClientSort = true
        }
        
        console.log("📦 Pedidos encontrados:", querySnapshot.size)
        const ordersData: Order[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📄 Pedido:", doc.id, data)
          ordersData.push({
            id: doc.id,
            date: data.createdAt?.toDate?.()?.toISOString() || data.date || new Date().toISOString(),
            status: data.status || "preparacion",
            total: data.total || 0,
            items: data.items || [],
            itemCount: data.items?.length || 0
          })
        })
        
        // Si no usamos orderBy en la query, ordenar en el cliente
        if (needsClientSort && ordersData.length > 0) {
          ordersData.sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateB - dateA // Descendente (más reciente primero)
          })
        }
        
        setOrders(ordersData)
        console.log("✅ Pedidos cargados:", ordersData.length)
      } catch (error: any) {
        console.error("❌ Error cargando pedidos:", error)
        // En cualquier caso, establecer array vacío para que la UI muestre el estado correcto
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    loadOrders()
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

  const createdAtDate = (() => {
    if (!user.createdAt) return null
    if (typeof user.createdAt === "number" || typeof user.createdAt === "string") {
      const date = new Date(user.createdAt)
      return isNaN(date.getTime()) ? null : date
    }
    if (typeof user.createdAt === "object") {
      if (typeof (user.createdAt as any).toDate === "function") {
        return (user.createdAt as any).toDate()
      }
      if ((user.createdAt as any).seconds) {
        return new Date((user.createdAt as any).seconds * 1000)
      }
    }
    return null
  })()

  const memberSinceLabel = createdAtDate
    ? `Miembro desde ${createdAtDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
    : "Miembro activo"

  // Datos del usuario desde Firestore (sin valores hardcodeados)
  const displayName = user.displayName || user.email?.split("@")[0] || "Tu cuenta"
  const userEmail = user.email || "Sin email"
  const nameParts = (user.displayName ?? "").trim().split(/\s+/).filter(Boolean)
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.slice(1).join(" ")
  const userPhone = user.phone ?? ""
  const userAddress = (user as any)?.address ?? ""

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "entregado": return <span className="text-sm font-normal px-3 py-1 bg-green-100 text-green-700 rounded-full">Entregado</span>
      case "en_camino": return <span className="text-sm font-normal px-3 py-1 bg-blue-100 text-blue-700 rounded-full">En camino</span>
      case "preparacion": return <span className="text-sm font-normal px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">En preparación</span>
      case "cancelado": return <span className="text-sm font-normal px-3 py-1 bg-red-100 text-red-700 rounded-full">Cancelado</span>
    }
  }

  // Filtrar y ordenar (más reciente primero)
  const filteredOrders = orders
    .filter(order => statusFilter === "all" || order.status === statusFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const visibleOrders = filteredOrders.slice(0, visibleCount)
  const hasMore = visibleCount < filteredOrders.length

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          
          {/* Sidebar / Perfil Resumen */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border shadow-sm">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <User className="h-12 w-12" />
              </div>
              <h2 className="font-serif text-xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground text-sm">{userEmail}</p>
              <p className="text-xs text-muted-foreground mt-1">{memberSinceLabel}</p>
            </div>

            <nav className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start gap-3 font-medium bg-background border shadow-sm">
                <Package className="h-4 w-4" />
                Mis Pedidos
              </Button>
              <Button variant="ghost" asChild className="justify-start gap-3 font-medium hover:bg-background hover:shadow-sm w-full">
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
            <div className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-primary">Mi Cuenta</h1>
              <p className="text-muted-foreground">Gestioná tus pedidos y datos personales.</p>
            </div>

            <Tabs defaultValue="pedidos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="pedidos">Mis Pedidos</TabsTrigger>
                <TabsTrigger value="datos">Mis Datos</TabsTrigger>
              </TabsList>
              
              {/* Tab: Pedidos */}
              <TabsContent value="pedidos" className="space-y-6">
                
                {/* Filtros */}
                <div className="flex justify-end mb-4">
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los pedidos</SelectItem>
                      <SelectItem value="en_camino">En curso</SelectItem>
                      <SelectItem value="entregado">Entregados</SelectItem>
                      <SelectItem value="cancelado">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Cargando pedidos...</p>
                  </div>
                ) : visibleOrders.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">
                      {orders.length === 0 
                        ? "Aún no realizaste ningún pedido. ¡Empezá a comprar!" 
                        : "No se encontraron pedidos con este filtro."}
                    </p>
                  </div>
                ) : (
                  visibleOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Pedido #{order.id}</span>
                          {getStatusBadge(order.status)}
                        </CardTitle>
                        <CardDescription>Realizado el {new Date(order.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                          ))}
                          {order.itemCount > order.items.length && (
                            <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                              +{order.itemCount - order.items.length}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center border-t pt-4">
                          <span className="font-medium">Total: ${order.total.toLocaleString('es-AR')}</span>
                          <Button variant="outline" size="sm">Ver Detalle</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {hasMore && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4" 
                    onClick={() => setVisibleCount(prev => prev + 3)}
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Cargar más pedidos
                  </Button>
                )}
              </TabsContent>

              {/* Tab: Datos */}
              <TabsContent value="datos">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>Actualizá tus datos de contacto para los envíos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" defaultValue={firstName} placeholder="Nombre" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastname">Apellido</Label>
                        <Input id="lastname" defaultValue={lastName} placeholder="Apellido" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={userEmail} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" defaultValue={userPhone} placeholder="Ej: 11 1234 5678" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección Principal</Label>
                      <Input id="address" defaultValue={userAddress} placeholder="Ingresá tu dirección" />
                    </div>
                    <Button className="mt-4">Guardar Cambios</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

