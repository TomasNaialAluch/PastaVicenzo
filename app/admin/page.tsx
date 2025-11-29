"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package } from "lucide-react"

type OrderStatus = "entregado" | "en_camino" | "preparacion" | "cancelado"

interface Order {
  id: string
  userId?: string // Solo para pedidos de usuarios
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

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a pedidos por defecto
    router.push("/admin/pedidos")
  }, [router])

  return null
}

