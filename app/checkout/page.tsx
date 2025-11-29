"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, CheckCircle2, Plus, MapPin } from "lucide-react"
import { toast } from "sonner"
import { AddressDialog, type Address } from "@/components/address-dialog"
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 caracteres"),
  // Make address/city optional initially because they might be filled by selecting an existing address
  address: z.string().optional(),
  city: z.string().optional(),
  selectedAddressId: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.string({
    required_error: "Seleccioná un método de pago",
  }),
  deliveryMethod: z.enum(["delivery", "pickup"], {
    required_error: "Seleccioná un método de entrega",
  }),
}).refine((data) => {
  // Si es delivery, debe tener una dirección seleccionada
  if (data.deliveryMethod === "delivery") {
    return !!data.selectedAddressId && data.selectedAddressId.length > 0
  }
  return true
}, {
  message: "Seleccioná una dirección",
  path: ["selectedAddressId"]
})

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { user, signInWithGoogle } = useAuth()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [userAddresses, setUserAddresses] = useState<Address[]>([])
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [orderEmail, setOrderEmail] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string, details: string, active: boolean}[]>([])
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      selectedAddressId: "",
      notes: "",
      paymentMethod: "efectivo",
      deliveryMethod: "delivery",
    },
  })

  // Cargar datos del usuario y direcciones
  useEffect(() => {
    if (!user?.uid) {
      setAddressesLoading(false)
      return
    }

    const loadUserData = async () => {
      try {
        setAddressesLoading(true)
        
        // Cargar configuración de métodos de pago
        const configRef = doc(db, "config", "site")
        const configSnap = await getDoc(configRef)
        
        // Valores por defecto
        let methods = [
          { id: "efectivo", name: "Efectivo", details: "10% descuento", active: true },
          { id: "transferencia", name: "Transferencia Bancaria", details: "", active: true },
          { id: "mp", name: "Mercado Pago", details: "", active: true }
        ]

        if (configSnap.exists()) {
          const data = configSnap.data()
          // Solo sobrescribir si hay opciones configuradas válidas
          if (data.paymentOptions && Array.isArray(data.paymentOptions) && data.paymentOptions.length > 0) {
            methods = data.paymentOptions.filter((pm: any) => pm.active)
          }
        }
        
        setPaymentMethods(methods)

        // 1. Cargar perfil del usuario (para teléfono)
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const userData = userDoc.data()
          // Pre-rellenar teléfono si no se escribió nada aún
          if (userData.phone && !form.getValues("phone")) {
            form.setValue("phone", userData.phone)
          }
        }

        // Pre-rellenar nombre si no se escribió nada aún
        if (user.displayName && !form.getValues("name")) {
          form.setValue("name", user.displayName)
        }

        // 2. Cargar direcciones
        const addressesRef = collection(db, "users", user.uid, "addresses")
        const q = query(addressesRef, orderBy("isDefault", "desc"))
        const querySnapshot = await getDocs(q)
        const addressesData: Address[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          addressesData.push({
            id: doc.id,
            name: data.name || "",
            type: data.type || "other",
            street: data.street || "",
            city: data.city || "",
            zipCode: data.zipCode || "",
            notes: data.notes || "",
            isDefault: data.isDefault || false,
          })
        })
        setUserAddresses(addressesData)
        
        // Establecer la dirección por defecto si existe y no se seleccionó ninguna
        if (!form.getValues("selectedAddressId")) {
          const defaultAddress = addressesData.find(addr => addr.isDefault) || addressesData[0]
          if (defaultAddress) {
            form.setValue("selectedAddressId", defaultAddress.id)
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        setAddressesLoading(false)
      }
    }

    loadUserData()
  }, [user?.uid, form])

  const handleAddressSave = async (newAddress: Address) => {
    if (!user?.uid) {
      // Si no está autenticado, solo agregar localmente
      setUserAddresses([...userAddresses, newAddress])
      form.setValue("selectedAddressId", newAddress.id)
      toast.success("Dirección agregada correctamente")
      return
    }

    try {
      // Guardar en Firestore usando subcolección
      const newAddressRef = await addDoc(collection(db, "users", user.uid, "addresses"), {
        name: newAddress.name,
        type: newAddress.type,
        street: newAddress.street,
        city: newAddress.city,
        zipCode: newAddress.zipCode,
        notes: newAddress.notes,
        isDefault: newAddress.isDefault,
      })
      
      const savedAddress = { ...newAddress, id: newAddressRef.id }
      setUserAddresses([...userAddresses, savedAddress])
      form.setValue("selectedAddressId", savedAddress.id)
      toast.success("Dirección agregada correctamente")
    } catch (error) {
      console.error("Error guardando dirección:", error)
      toast.error("Error al guardar la dirección")
    }
  }

  // Watch for changes
  const deliveryMethod = form.watch("deliveryMethod")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Resolve final address
      let finalAddress = ""
      let finalCity = ""
      
      if (values.deliveryMethod === "delivery") {
        const selected = userAddresses.find(a => a.id === values.selectedAddressId)
        if (selected) {
          finalAddress = selected.street
          finalCity = selected.city
        }
      }

      // Preparar datos del pedido
      const orderData = {
        name: values.name,
        phone: values.phone,
        email: user?.email || null,
        deliveryMethod: values.deliveryMethod,
        address: values.deliveryMethod === "delivery" ? finalAddress : null,
        city: values.deliveryMethod === "delivery" ? finalCity : null,
        paymentMethod: values.paymentMethod,
        notes: values.notes || "",
        items: items.map(item => ({
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        })),
        total: totalPrice,
        status: "preparacion" as const,
        createdAt: serverTimestamp(),
      }

      // Guardar pedido en Firestore
      if (user?.uid) {
        // Usuario logueado: guardar en subcolección del usuario
        await addDoc(collection(db, "users", user.uid, "orders"), orderData)
        console.log("✅ Pedido guardado en cuenta de usuario")
      } else {
        // Usuario invitado: guardar en guest_orders
        await addDoc(collection(db, "guest_orders"), orderData)
        console.log("✅ Pedido guardado como invitado")
        // Guardar email para ofrecer crear cuenta después
        setOrderEmail(values.phone) // Usamos el teléfono como identificador temporal
      }

      // Mensaje de éxito
      setIsSubmitted(true)
      clearCart()
      
      toast.success("¡Pedido confirmado correctamente!")
    } catch (error) {
      console.error("Error guardando pedido:", error)
      toast.error("Error al guardar el pedido. Por favor intentá nuevamente.")
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-6 text-green-600">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          
          {!user && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 mb-3">
                💡 <strong>¿Querés crear una cuenta?</strong> Así podés ver el estado de tus pedidos y guardar tus direcciones favoritas.
              </p>
              <Button 
                onClick={signInWithGoogle}
                variant="outline"
                className="w-full"
              >
                Crear cuenta con Google
              </Button>
            </div>
          )}
          <h1 className="text-3xl font-bold text-primary mb-4">¡Gracias por tu compra!</h1>
          <p className="text-lg text-muted-foreground max-w-md mb-8">
            Tu pedido ha sido recibido correctamente. Nos comunicaremos por WhatsApp para coordinar la entrega y el cobro.
          </p>
          <Button asChild size="lg">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Tu carrito está vacío</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Agregá algunos productos deliciosos antes de finalizar la compra.
          </p>
          <Button asChild size="lg">
            <Link href="/">Ver catálogo</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
            <Link href="/">
              <ChevronLeft className="h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-serif text-primary mt-2">Finalizar Compra</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Datos de Envío y Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono / WhatsApp</FormLabel>
                            <FormControl>
                              <Input placeholder="11 1234 5678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Método de Entrega</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="delivery" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Envío a domicilio (Costo a coordinar)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="pickup" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Retiro por local (Sin cargo)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {deliveryMethod === "delivery" && (
                      <FormField
                        control={form.control}
                        name="selectedAddressId"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Dirección de Entrega</FormLabel>
                            <FormControl>
                              {addressesLoading ? (
                                <div className="text-center py-4 text-muted-foreground">
                                  Cargando direcciones...
                                </div>
                              ) : userAddresses.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                  <p className="mb-2">No tenés direcciones guardadas</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddressDialogOpen(true)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar primera dirección
                                  </Button>
                                </div>
                              ) : (
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="grid gap-4"
                                >
                                  {userAddresses.map((addr) => (
                                  <FormItem key={addr.id}>
                                    <FormControl>
                                      <RadioGroupItem value={addr.id} className="peer sr-only" />
                                    </FormControl>
                                    <Label
                                      htmlFor={addr.id}
                                      className="flex flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="font-semibold">{addr.name}</span>
                                      </div>
                                      <span className="text-sm text-muted-foreground">{addr.street}, {addr.city}</span>
                                    </Label>
                                  </FormItem>
                                ))}
                                
                                  <FormItem>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full h-auto min-h-[80px] flex items-center justify-center gap-2 border-2 border-dashed hover:bg-accent hover:text-accent-foreground"
                                      onClick={() => setIsAddressDialogOpen(true)}
                                    >
                                      <Plus className="h-4 w-4" />
                                      <span className="font-semibold">Nueva Dirección</span>
                                    </Button>
                                  </FormItem>
                                </RadioGroup>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Address Modal */}
                    <AddressDialog 
                      open={isAddressDialogOpen} 
                      onOpenChange={setIsAddressDialogOpen} 
                      onSave={handleAddressSave}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Método de Pago</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              {paymentMethods.length > 0 ? (
                                paymentMethods.map((method) => (
                                  <FormItem key={method.id} className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value={method.id} />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer w-full py-1">
                                      <span className="font-medium">{method.name}</span>
                                      {method.details && (
                                        <span className="text-sm text-muted-foreground ml-2">({method.details})</span>
                                      )}
                                    </FormLabel>
                                  </FormItem>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">Cargando métodos de pago...</p>
                              )}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas adicionales</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Aclaraciones sobre el envío, timbre, etc."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" size="lg">
                      Confirmar Pedido
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="text-muted-foreground italic">A coordinar</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
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

