"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { Chrome, Eye, EyeOff } from "lucide-react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function LoginView() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [resetDialogMode, setResetDialogMode] = useState<"none" | "wrong-password" | "email-in-use" | "user-not-found">("none")
  const [showPassword, setShowPassword] = useState(false)
  
  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const isResetDialogOpen = resetDialogMode !== "none"
  const dialogEmailValue = email || ""
  const dialogEmailText = dialogEmailValue || "tu correo"

  const resetDialogTitle =
    resetDialogMode === "email-in-use"
      ? "Este correo ya tiene una cuenta"
      : resetDialogMode === "user-not-found"
        ? "No encontramos tu cuenta"
        : "Contraseña incorrecta"

  const resetDialogDescription = (() => {
    switch (resetDialogMode) {
      case "email-in-use":
        return `El email ingresado ya está registrado. Podés iniciar sesión o restablecer la contraseña enviando un enlace a ${dialogEmailText}.`
      case "user-not-found":
        return `No encontramos una cuenta asociada a ${dialogEmailText}. Creá una nueva para continuar.`
      case "wrong-password":
        return `La contraseña ingresada no es correcta. Podés recibir un correo para restablecerla en ${dialogEmailText}.`
      default:
        return "Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
    }
  })()

  const resetDialogPrimaryLabel =
    resetDialogMode === "user-not-found"
      ? "Crear cuenta"
      : resetDialogMode === "email-in-use"
        ? "Restablecer acceso"
        : "Enviar correo"

  const openResetDialog = (mode: "wrong-password" | "email-in-use" | "user-not-found") => {
    setResetDialogMode(mode)
  }

  const closeResetDialog = () => setResetDialogMode("none")

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await signInWithGoogle()
    } catch (error) {
      console.error(error)
      toast.error("Error al iniciar sesión con Google")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error("Por favor completá todos los campos")
      return
    }

    try {
      setIsLoading(true)
      if (isRegistering) {
        if (!name) {
          toast.error("El nombre es requerido")
          setIsLoading(false)
          return
        }
        const existingMethods = await fetchSignInMethodsForEmail(auth, email)
        if (existingMethods.length > 0) {
          toast.error("Este correo ya está registrado. Iniciá sesión o recuperá tu contraseña.")
          setIsRegistering(false)
          openResetDialog("email-in-use")
          setIsLoading(false)
          return
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(userCredential.user, { displayName: name })
        toast.success("¡Cuenta creada con éxito!")
      } else {
        // Verificar primero si el usuario existe antes de intentar iniciar sesión
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, email)
          if (signInMethods.length === 0) {
            // El usuario no existe
            toast.error("No encontramos una cuenta con ese email")
            openResetDialog("user-not-found")
            setIsLoading(false)
            return
          }
        } catch (checkError: any) {
          // Si hay error al verificar, puede ser que el email no existe
          if (checkError.code === 'auth/invalid-email') {
            toast.error("El email ingresado no es válido")
            setIsLoading(false)
            return
          }
          // Si no podemos verificar, continuamos con el intento de login
        }
        
        // Si llegamos aquí, el usuario existe, intentamos iniciar sesión
        await signInWithEmailAndPassword(auth, email, password)
        toast.success("¡Bienvenido de nuevo!")
      }
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Este correo ya está registrado. Por favor inicia sesión o restablecé tu contraseña.")
        setIsRegistering(false)
        openResetDialog("email-in-use")
      } else if (error.code === 'auth/user-not-found') {
        toast.error("No encontramos una cuenta con ese email")
        openResetDialog("user-not-found")
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // Si llegamos aquí y es invalid-credential, significa que la contraseña es incorrecta
        // porque ya verificamos que el usuario existe antes
        openResetDialog("wrong-password")
      } else {
        toast.error("Error de autenticación: " + error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Por favor ingresá tu email")
      return
    }
    try {
      setIsLoading(true)
      await sendPasswordResetEmail(auth, email)
      toast.success("Se envió un correo para restablecer tu contraseña. Revisá tu bandeja de entrada y SPAM.")
      closeResetDialog()
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/user-not-found') {
        toast.error("No existe cuenta con este email")
      } else {
        toast.error("Error al enviar correo de recuperación")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogPrimaryAction = async () => {
    if (resetDialogMode === "user-not-found") {
      if (!email) {
        toast.error("Ingresá un email válido para crear tu cuenta")
        return
      }
      setIsRegistering(true)
      closeResetDialog()
      toast("Completá los datos para crear tu cuenta")
      return
    }
    await handleResetPassword()
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-serif font-bold text-primary">
            {isRegistering ? "Crear Cuenta" : "Bienvenido"}
          </CardTitle>
          <CardDescription>
            {isRegistering 
              ? "Registrate para gestionar tus pedidos" 
              : "Ingresá a tu cuenta para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
            {isLoading ? (
              "Cargando..." 
            ) : (
              <>
                <Chrome className="mr-2 h-4 w-4" />
                {isRegistering ? "Registrarse con Google" : "Continuar con Google"}
              </>
            )}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O con email
              </span>
            </div>
          </div>
          
          {isRegistering && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                placeholder="Juan Pérez" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@ejemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              {!isRegistering && (
                <Button 
                  variant="link" 
                  className="px-0 h-auto text-xs text-muted-foreground"
                  onClick={() => openResetDialog("wrong-password")}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              )}
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleEmailAuth} disabled={isLoading}>
            {isLoading ? "Procesando..." : (isRegistering ? "Registrarse" : "Ingresar")}
          </Button>
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering 
              ? "¿Ya tenés cuenta? Iniciá sesión" 
              : "¿No tenés cuenta? Registrate"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isResetDialogOpen} onOpenChange={(open) => (!open ? closeResetDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resetDialogTitle}</DialogTitle>
            <DialogDescription>
              {resetDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@ejemplo.com"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={closeResetDialog}>
              Cancelar
            </Button>
            <Button onClick={handleDialogPrimaryAction}>
              {resetDialogPrimaryLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
