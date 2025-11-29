"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, Mail, Calendar, Shield, UserCheck } from "lucide-react"
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserData {
  id: string
  email: string | null
  displayName: string | null
  role: 'user' | 'admin'
  createdAt: any
  phone?: string
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all")

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true)
        const usersRef = collection(db, "users")
        const usersQuery = query(usersRef, orderBy("createdAt", "desc"))
        const usersSnapshot = await getDocs(usersQuery)
        
        const usersData: UserData[] = []
        usersSnapshot.forEach((doc) => {
          const data = doc.data()
          usersData.push({
            id: doc.id,
            email: data.email || null,
            displayName: data.displayName || null,
            role: data.role || 'user',
            createdAt: data.createdAt,
            phone: data.phone || undefined,
          })
        })
        
        setUsers(usersData)
        console.log(`✅ Cargados ${usersData.length} usuarios`)
      } catch (error) {
        console.error("Error cargando usuarios:", error)
        setUsers([])
      } finally {
        setUsersLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    // Validación TypeScript: verificar que el userId sea válido
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error("Error: userId inválido")
      return
    }

    // Validación TypeScript: verificar que el role sea válido
    if (newRole !== 'user' && newRole !== 'admin') {
      console.error("Error: role inválido", newRole)
      return
    }

    // Validación TypeScript: verificar que el usuario existe en la lista
    const userExists = users.some(user => user.id === userId)
    if (!userExists) {
      console.error("Error: usuario no encontrado", userId)
      return
    }

    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, { role: newRole })
      
      // Actualizar estado local solo si la operación fue exitosa
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
    } catch (error: unknown) {
      // Manejo de errores TypeScript: verificar tipo de error
      if (error instanceof Error) {
        console.error("Error actualizando rol:", error.message)
        
        // Si es un error de permisos, informar al usuario
        if (error.message.includes('permission') || error.message.includes('Permission')) {
          console.error("No tenés permisos para cambiar roles. Verificá que tu usuario tenga role: 'admin' en Firestore.")
        }
      } else {
        console.error("Error desconocido actualizando rol:", error)
      }
      // Opcional: mostrar notificación al usuario
      // toast.error("Error al actualizar el rol del usuario")
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesSearch = searchTerm === "" || 
      (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  const getCreatedDate = (createdAt: any) => {
    if (!createdAt) return "Fecha no disponible"
    if (typeof createdAt === "object" && createdAt.toDate) {
      return createdAt.toDate().toLocaleDateString('es-AR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
      })
    }
    return "Fecha no disponible"
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-primary mb-2">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">Administrá los usuarios registrados en la plataforma</p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="user">Usuarios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Usuarios</CardDescription>
            <CardTitle className="text-2xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {users.filter(u => u.role === "admin").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuarios</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {users.filter(u => u.role === "user").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de usuarios */}
      {usersLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== "all" 
                ? "No se encontraron usuarios con estos filtros." 
                : "Aún no hay usuarios registrados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {user.displayName || "Sin nombre"}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email || "Sin email"}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {getCreatedDate(user.createdAt)}
                      </p>
                    </CardDescription>
                  </div>
                  {user.role === "admin" ? (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Usuario
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                  <Select
                    value={user.role}
                    onValueChange={(val) => handleRoleChange(user.id, val as 'user' | 'admin')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

