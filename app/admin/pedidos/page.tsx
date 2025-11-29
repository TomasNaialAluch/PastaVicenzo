"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Package, User, Phone, MapPin, Calendar, Filter, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

type OrderStatus = "entregado" | "en_camino" | "preparacion" | "cancelado"

interface Order {
  id: string
  userId?: string
  isGuest: boolean
  name: string
  phone: string
  email?: string | null
  deliveryMethod: "delivery" | "pickup"
  address?: string | null
  city?: string | null
  paymentMethod: string
  notes?: string
  items: Array<{
    name: string
    image: string
    quantity: number
    price: number
  }>
  total: number
  status: OrderStatus
  createdAt: any
  date: string
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Cargar todos los pedidos (usuarios + invitados)
  useEffect(() => {
    const loadAllOrders = async () => {
      try {
        setOrdersLoading(true)
        const allOrders: Order[] = []

        // Cargar pedidos de usuarios logueados
        try {
          const usersSnapshot = await getDocs(collection(db, "users"))
          for (const userDoc of usersSnapshot.docs) {
            const ordersRef = collection(db, "users", userDoc.id, "orders")
            const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"))
            const ordersSnapshot = await getDocs(ordersQuery)
            
            ordersSnapshot.forEach((orderDoc) => {
              const data = orderDoc.data()
              allOrders.push({
                id: orderDoc.id,
                userId: userDoc.id,
                isGuest: false,
                name: data.name || "",
                phone: data.phone || "",
                email: data.email || null,
                deliveryMethod: data.deliveryMethod || "pickup",
                address: data.address || null,
                city: data.city || null,
                paymentMethod: data.paymentMethod || "",
                notes: data.notes || "",
                items: data.items || [],
                total: data.total || 0,
                status: data.status || "preparacion",
                createdAt: data.createdAt,
                date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              })
            })
          }
        } catch (error) {
          console.error("Error cargando pedidos de usuarios:", error)
        }

        // Cargar pedidos de invitados
        try {
          const guestOrdersRef = collection(db, "guest_orders")
          const guestOrdersQuery = query(guestOrdersRef, orderBy("createdAt", "desc"))
          const guestOrdersSnapshot = await getDocs(guestOrdersQuery)
          
          guestOrdersSnapshot.forEach((orderDoc) => {
            const data = orderDoc.data()
            allOrders.push({
              id: orderDoc.id,
              isGuest: true,
              name: data.name || "",
              phone: data.phone || "",
              email: data.email || null,
              deliveryMethod: data.deliveryMethod || "pickup",
              address: data.address || null,
              city: data.city || null,
              paymentMethod: data.paymentMethod || "",
              notes: data.notes || "",
              items: data.items || [],
              total: data.total || 0,
              status: data.status || "preparacion",
              createdAt: data.createdAt,
              date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            })
          })
        } catch (error) {
          console.error("Error cargando pedidos de invitados:", error)
        }

        // Ordenar por fecha (más reciente primero)
        allOrders.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        })

        setOrders(allOrders)
        console.log(`✅ Cargados ${allOrders.length} pedidos (${allOrders.filter(o => !o.isGuest).length} usuarios, ${allOrders.filter(o => o.isGuest).length} invitados)`)
      } catch (error) {
        console.error("Error cargando pedidos:", error)
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    loadAllOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, isGuest: boolean) => {
    // Validación TypeScript: verificar que el orderId sea válido
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      console.error("Error: orderId inválido")
      return
    }

    // Validación TypeScript: verificar que el status sea válido
    const validStatuses: OrderStatus[] = ["entregado", "en_camino", "preparacion", "cancelado"]
    if (!validStatuses.includes(newStatus)) {
      console.error("Error: status inválido", newStatus)
      return
    }

    try {
      if (isGuest) {
        const orderRef = doc(db, "guest_orders", orderId)
        await updateDoc(orderRef, { status: newStatus })
      } else {
        const order = orders.find(o => o.id === orderId && !o.isGuest)
        
        // Validación TypeScript: verificar que el pedido existe y tiene userId
        if (!order) {
          console.error("Error: pedido no encontrado", orderId)
          return
        }
        
        if (!order.userId || typeof order.userId !== 'string') {
          console.error("Error: userId inválido para pedido", orderId)
          return
        }
        
        const orderRef = doc(db, "users", order.userId, "orders", orderId)
        await updateDoc(orderRef, { status: newStatus })
      }
      
      // Actualizar estado local solo si la operación fue exitosa
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error: unknown) {
      // Manejo de errores TypeScript: verificar tipo de error
      if (error instanceof Error) {
        console.error("Error actualizando estado:", error.message)
      } else {
        console.error("Error desconocido actualizando estado:", error)
      }
      // Opcional: mostrar notificación al usuario
      // toast.error("Error al actualizar el estado del pedido")
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      entregado: "bg-green-100 text-green-700",
      en_camino: "bg-blue-100 text-blue-700",
      preparacion: "bg-yellow-100 text-yellow-700",
      cancelado: "bg-red-100 text-red-700",
    }
    const labels = {
      entregado: "Entregado",
      en_camino: "En camino",
      preparacion: "En preparación",
      cancelado: "Cancelado",
    }
    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesSearch = searchTerm === "" || 
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-primary mb-2">Gestión de Pedidos</h2>
        <p className="text-muted-foreground">Visualizá y gestioná todos los pedidos de la tienda</p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o ID de pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="preparacion">En preparación</SelectItem>
            <SelectItem value="en_camino">En camino</SelectItem>
            <SelectItem value="entregado">Entregados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pedidos</CardDescription>
            <CardTitle className="text-2xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Preparación</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {orders.filter(o => o.status === "preparacion").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Camino</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {orders.filter(o => o.status === "en_camino").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entregados</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {orders.filter(o => o.status === "entregado").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de pedidos */}
      {ordersLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando pedidos...</p>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "No se encontraron pedidos con estos filtros." 
                : "Aún no hay pedidos registrados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                      {getStatusBadge(order.status)}
                      {order.isGuest && (
                        <Badge variant="outline" className="text-xs">Invitado</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-3 flex-wrap text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.date).toLocaleDateString('es-AR', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </CardDescription>
                  </div>
                  <Select
                    value={order.status}
                    onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus, order.isGuest)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preparacion">En preparación</SelectItem>
                      <SelectItem value="en_camino">En camino</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PRODUCTOS DEL PEDIDO - Más destacado */}
                <div className="bg-muted/50 rounded-lg p-4 border-2 border-primary/20">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Productos del Pedido
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-background p-3 rounded-md border">
                        {item.image && (
                          <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Cantidad: <strong>{item.quantity}</strong>
                          </p>
                          <p className="text-sm font-bold text-primary mt-1">
                            ${(item.price * item.quantity).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total del pedido:</span>
                    <span className="text-xl font-bold text-primary">
                      ${order.total.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Información del cliente y entrega - Layout más compacto */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      Cliente
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Nombre:</strong> {order.name}</p>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <strong>Teléfono:</strong> {order.phone}
                      </p>
                      {order.email && (
                        <p><strong>Email:</strong> {order.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Entrega
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Método:</strong> {order.deliveryMethod === "delivery" ? "Envío a domicilio" : "Retiro por local"}</p>
                      {order.deliveryMethod === "delivery" && order.address && (
                        <p className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span><strong>Dirección:</strong> {order.address}{order.city ? `, ${order.city}` : ""}</span>
                        </p>
                      )}
                      <p><strong>Pago:</strong> {order.paymentMethod}</p>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="pt-3 border-t">
                    <p className="text-sm">
                      <strong>Notas del cliente:</strong> 
                      <span className="ml-2 text-muted-foreground">{order.notes}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

