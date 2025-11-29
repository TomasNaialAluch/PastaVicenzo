"use client"

import { useAuth } from "@/lib/auth-context"
import { useMemo } from "react"

/**
 * Hook para verificar si el usuario actual es admin
 * Incluye validaciones TypeScript y manejo de estados de carga
 * @returns { isAdmin: boolean, loading: boolean } - Estado del admin y carga
 */
export function useIsAdmin() {
  const { user, loading } = useAuth()
  
  const isAdmin = useMemo(() => {
    // Si está cargando, retornar false hasta que termine
    if (loading) {
      return false
    }
    
    // Validación TypeScript estricta: verificar que user existe y tiene role
    if (!user || !user.role) {
      return false
    }
    
    // Validar que el role sea exactamente 'admin' (case-sensitive)
    return user.role === 'admin'
  }, [user, loading])
  
  return { isAdmin, loading }
}

