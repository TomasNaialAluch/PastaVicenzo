"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart-context"
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

// Mock user addresses
const initialUserAddresses: Address[] = [
  { id: "addr1", name: "Casa", street: "Av. Libertador 1234, 5A", city: "Palermo, CABA", type: "home", zipCode: "1425", isDefault: true },
  { id: "addr2", name: "Oficina", street: "Av. Corrientes 456, Piso 3", city: "San Nicolás, CABA", type: "work", zipCode: "1043", isDefault: false },
]

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 caracteres"),
  // Make address/city optional initially because they might be filled by selecting an existing address
  address: z.string().optional(),
  city: z.string().optional(),
  selectedAddressId: z.string().min(1, "Seleccioná una dirección"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["efectivo", "transferencia", "mp"], {
    required_error: "Seleccioná un método de pago",
  }),
  deliveryMethod: z.enum(["delivery", "pickup"], {
    required_error: "Seleccioná un método de entrega",
  }),
})

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [userAddresses, setUserAddresses] = useState<Address[]>(initialUserAddresses)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "efectivo",
      deliveryMethod: "delivery",
      selectedAddressId: initialUserAddresses[0]?.id || "",
    },
  })

  const handleAddressSave = (newAddress: Address) => {
    setUserAddresses([...userAddresses, newAddress])
    form.setValue("selectedAddressId", newAddress.id)
    toast.success("Dirección agregada correctamente")
  }

  // Watch for changes
  const deliveryMethod = form.watch("deliveryMethod")

  function onSubmit(values: z.infer<typeof formSchema>) {
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

    console.log({ ...values, finalAddress, finalCity })
    
    const message = `*Nuevo Pedido - Pasta Vicenzo*%0A%0A*Cliente:* ${values.name}%0A*Teléfono:* ${values.phone}%0A*Método de Entrega:* ${values.deliveryMethod === 'delivery' ? 'Envío a domicilio' : 'Retiro por local'}%0A${values.deliveryMethod === 'delivery' ? `*Dirección:* ${finalAddress}, ${finalCity}%0A` : ''}*Pago:* ${values.paymentMethod}%0A%0A*Pedido:*%0A${items.map(i => `- ${i.quantity}x ${i.name} ($${i.price * i.quantity})`).join('%0A')}%0A%0A*Total: $${totalPrice}*`
    
    const whatsappUrl = `https://wa.me/5491123456789?text=${message}`
    
    setIsSubmitted(true)
    clearCart()
    
    window.open(whatsappUrl, '_blank')
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-6 text-green-600">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-4">¡Gracias por tu compra!</h1>
          <p className="text-lg text-muted-foreground max-w-md mb-8">
            Tu pedido ha sido recibido correctamente. Te hemos enviado los detalles por WhatsApp para coordinar la entrega.
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
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="efectivo" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Efectivo (10% descuento)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="transferencia" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Transferencia Bancaria
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="mp" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Mercado Pago
                                </FormLabel>
                              </FormItem>
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

