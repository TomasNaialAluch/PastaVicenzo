"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

// Definición del tipo de usuario extendido con datos de Firestore
export type UserProfile = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: 'user' | 'admin'
  phone?: string
  createdAt?: any
}

type AuthContextType = {
  user: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Usuario logueado, buscar o crear perfil en Firestore
          const userRef = doc(db, "users", firebaseUser.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            // Usuario ya existe, cargar datos pero asegurar que email y displayName vengan de Firebase Auth
            const firestoreData = userSnap.data()
            
            // Validación TypeScript: asegurar que role sea válido ('user' | 'admin')
            const validRole: 'user' | 'admin' = 
              firestoreData.role === 'admin' || firestoreData.role === 'user' 
                ? firestoreData.role 
                : 'user' // Valor por defecto si el role no es válido
            
            const updatedUser: UserProfile = {
              ...firestoreData,
              uid: firebaseUser.uid,
              email: firebaseUser.email || firestoreData.email || null, // Priorizar Firebase Auth
              displayName: firebaseUser.displayName || firestoreData.displayName || null, // Priorizar Firebase Auth
              photoURL: firebaseUser.photoURL || firestoreData.photoURL || null,
              role: validRole, // Asegurar que siempre tenga un role válido
            }
            
            // Si los datos de Firebase Auth son diferentes o falta el role, actualizar Firestore
            if (
              firebaseUser.email !== firestoreData.email || 
              firebaseUser.displayName !== firestoreData.displayName ||
              !firestoreData.role ||
              (firestoreData.role !== 'user' && firestoreData.role !== 'admin')
            ) {
              await setDoc(userRef, {
                ...firestoreData,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: validRole, // Asegurar que el role esté guardado correctamente
              }, { merge: true })
            }
            
            setUser(updatedUser)
          } else {
            // Nuevo usuario, crear documento por defecto
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'user', // Rol por defecto
              createdAt: serverTimestamp()
            }
            await setDoc(userRef, newUser)
            setUser(newUser)
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUser(null)
        }
      } else {
        // No hay usuario
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      // Ignorar errores de COOP que son solo warnings
      if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('Cross-Origin-Opener-Policy')) {
        // El usuario cerró el popup o hay un warning de COOP, no es un error crítico
        return
      }
      console.error("Error al iniciar sesión con Google:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


