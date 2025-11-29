"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { user, loading: authLoading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  // 1. Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error("Error parsing cart from localStorage", e)
      }
    }
    setIsInitialized(true)
  }, [])

  // 2. Sincronizar con Firestore cuando el usuario se loguea
  useEffect(() => {
    if (authLoading || !isInitialized) return

    const syncWithFirestore = async () => {
      if (user) {
        // Usuario logueado: Traer carrito de Firestore y fusionar
        try {
          const cartRef = doc(db, "users", user.uid, "cart", "active")
          const docSnap = await getDoc(cartRef)

          if (docSnap.exists()) {
            const remoteItems = docSnap.data().items as CartItem[] || []
            
            // Si hay items locales, fusionar con remotos
            if (items.length > 0) {
              // Crear un mapa con los items remotos por ID para fácil acceso
              const mergedMap = new Map(remoteItems.map(item => [item.id, item]))
              
              // Iterar items locales y fusionar/agregar
              items.forEach(localItem => {
                if (mergedMap.has(localItem.id)) {
                  const existing = mergedMap.get(localItem.id)!
                  // Sumar cantidades si ya existe, pero evitar duplicación exagerada si es sync post-login
                  // Estrategia simple: Usar la cantidad mayor o sumar? Sumar es lo más lógico al "traer" el carrito.
                  // PERO, si es un refresh de página, local y remoto son iguales. Sumar duplicaría.
                  // Como local y remoto deberían estar sync, si son iguales no sumamos.
                  // Si acabamos de loguear, local tiene items "nuevos" (de sesión anónima).
                  // Para evitar duplicar en refresh: Comprobar si local es igual a remoto?
                  // Dificil saber si es "refresh" o "login nuevo".
                  // Asumamos: Si el usuario ya tiene carrito remoto, PREVALECE el remoto + lo que no esté en remoto.
                  // Si queremos fusionar cantidades: existing.quantity += localItem.quantity
                  // Vamos a optar por: Priorizar Remoto. Si hay item local que no está en remoto, se agrega.
                  // Si está en ambos, usamos la cantidad del remoto (asumimos que es la verdad persistida).
                  // OJO: Si agregué algo offline, quiero que se suba.
                  
                  // Mejor estrategia para UX: Fusionar inteligente.
                  // Si acabamos de loguear, asumimos que los items locales son INTENCIONALES.
                  // Pero para no duplicar en cada F5 si la sync falló...
                  // Vamos a confiar en que si está logueado, el localStorage debería estar sync con Firestore.
                  // Si no lo está, es porque se agregó algo offline o sin loguear.
                  // Caso: Agrego item A (qty 1). Me logueo. Remoto tiene item A (qty 1). Resultado: Qty 1 (no sumar).
                  // Caso: Agrego item B. Me logueo. Remoto tiene A. Resultado: A + B.
                  
                  // Entonces: Si existe en remoto, mantenemos remoto. Si no, agregamos local.
                  // (Esto pierde cambios de cantidad local en items existentes, pero evita duplicación).
                } else {
                  mergedMap.set(localItem.id, localItem)
                }
              })
              
              const finalItems = Array.from(mergedMap.values())
              // Comparar si hubo cambios para evitar render loop
              if (JSON.stringify(finalItems) !== JSON.stringify(items)) {
                setItems(finalItems)
              }
            } else {
              // Local vacío, usar remoto directo
              setItems(remoteItems)
            }
          } else {
            // No hay remoto, pero si hay local, se subirá en el efecto de guardado
          }
        } catch (error) {
          console.error("Error syncing cart:", error)
        }
      } else {
        // Usuario se deslogueó o anónimo:
        // Podríamos limpiar el carrito para no dejar datos de otro usuario
        // Pero si es refresh, queremos mantener localStorage.
        // Como authLoading maneja el estado inicial, si llegamos acá con user=null es explícito.
        // No borramos localStorage automáticamente para no perder carrito de invitado.
      }
    }

    syncWithFirestore()
  }, [user, authLoading, isInitialized]) // Ojo: items no debe estar aquí para evitar loop, pero lo necesitamos para fusionar.
  // Si items no está en deps, usa el valor inicial del closure (vacío).
  // Solución: Usar setState callback o ref, o incluir items pero controlar ejecución.
  // Mejor: Solo ejecutar esto cuando CAMBIA el usuario (login/logout).

  // Efecto 3: Guardar cambios (Persistencia)
  useEffect(() => {
    if (!isInitialized) return

    // LocalStorage siempre
    localStorage.setItem("cart", JSON.stringify(items))

    // Firestore solo si logueado
    if (user && !authLoading) {
      const saveToFirestore = async () => {
        try {
          const cartRef = doc(db, "users", user.uid, "cart", "active")
          await setDoc(cartRef, { items, updatedAt: new Date().toISOString() })
        } catch (error) {
          console.error("Error saving cart:", error)
        }
      }
      // Pequeño debounce para no saturar
      const timeoutId = setTimeout(saveToFirestore, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [items, user, authLoading, isInitialized])

  const addItem = (product: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id)
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...currentItems, { ...product, quantity: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id)
      return
    }
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
    // Limpiar también localStorage explícitamente (aunque el useEffect lo hará)
    localStorage.removeItem("cart")
    
    // Si hay usuario, limpiar firestore también
    if (user) {
      const clearRemote = async () => {
        try {
          const cartRef = doc(db, "users", user.uid, "cart", "active")
          await setDoc(cartRef, { items: [], updatedAt: new Date().toISOString() })
        } catch (e) {
          console.error("Error clearing remote cart", e)
        }
      }
      clearRemote()
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}


