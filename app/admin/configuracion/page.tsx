"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Save, Phone, Mail, MapPin, Info, Globe, CreditCard, Plus, Trash2 } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { toast } from "sonner"
import Image from "next/image"
import { ImageIcon, Upload, X } from "lucide-react"

interface PaymentMethod {
  id: string
  name: string
  details: string
  active: boolean
}

interface SiteConfig {
  storeName: string
  storeDescription: string
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  openingHours: string
  deliveryInfo: string
  pickupInfo: string
  paymentMethods: string // Legacy (texto libre)
  paymentOptions: PaymentMethod[] // Nuevo sistema estructurado
  heroImage?: string
  socialMedia: {
    instagram?: string
    facebook?: string
  }
}

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<SiteConfig>({
    storeName: "Pasta Vicenzo",
    storeDescription: "Pastas artesanales hechas con ingredientes seleccionados",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    openingHours: "",
    deliveryInfo: "",
    pickupInfo: "",
    paymentMethods: "",
    paymentOptions: [],
    heroImage: "",
    socialMedia: {},
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState<string>("")
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const configRef = doc(db, "config", "site")
      const configSnap = await getDoc(configRef)
      
        if (configSnap.exists()) {
        const data = configSnap.data()
        setConfig({ 
          ...config, 
          ...data,
          // Si no hay paymentOptions (legacy), inicializar con valores por defecto
          paymentOptions: data.paymentOptions || [
            { id: "efectivo", name: "Efectivo", details: "10% descuento", active: true },
            { id: "transferencia", name: "Transferencia Bancaria", details: "", active: true },
            { id: "mp", name: "Mercado Pago", details: "", active: true }
          ]
        })
        if (data.heroImage) {
          setHeroImagePreview(data.heroImage)
        }
      }
    } catch (error) {
      console.error("Error cargando configuración:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleHeroImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validación: verificar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor seleccioná un archivo de imagen válido")
        return
      }
      
      // Validación: verificar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. Máximo 5MB")
        return
      }

      setHeroImageFile(file)
      
      // Crear preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddPaymentMethod = () => {
    const newMethod: PaymentMethod = {
      id: `custom_${Date.now()}`,
      name: "",
      details: "",
      active: true
    }
    setConfig({ ...config, paymentOptions: [...(config.paymentOptions || []), newMethod] })
  }

  const handleUpdatePaymentMethod = (id: string, field: keyof PaymentMethod, value: any) => {
    setConfig({
      ...config,
      paymentOptions: config.paymentOptions.map(pm => 
        pm.id === id ? { ...pm, [field]: value } : pm
      )
    })
  }

  const handleRemovePaymentMethod = (id: string) => {
    setConfig({
      ...config,
      paymentOptions: config.paymentOptions.filter(pm => pm.id !== id)
    })
  }

  const uploadHeroImageToStorage = async (file: File): Promise<string> => {
    const fileName = `config/hero_${Date.now()}_${file.name}`
    const storageRef = ref(storage, fileName)
    
    // Subir archivo
    await uploadBytes(storageRef, file)
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Si hay una imagen nueva para subir, subirla primero
      let heroImageUrl = config.heroImage
      if (heroImageFile) {
        setUploadingHeroImage(true)
        try {
          heroImageUrl = await uploadHeroImageToStorage(heroImageFile)
          toast.success("Imagen del inicio subida correctamente")
          setHeroImageFile(null)
        } catch (error) {
          console.error("Error subiendo imagen:", error)
          toast.error("Error al subir la imagen. Intentá nuevamente.")
          setUploadingHeroImage(false)
          return
        } finally {
          setUploadingHeroImage(false)
        }
      }

      const configRef = doc(db, "config", "site")
      const updatedConfig = { ...config, heroImage: heroImageUrl }
      await setDoc(configRef, updatedConfig, { merge: true })
      
      // Actualizar el estado local para mostrar la nueva imagen
      setConfig(updatedConfig)
      if (heroImageUrl) {
        setHeroImagePreview(heroImageUrl)
      }
      
      toast.success("Configuración guardada correctamente")
    } catch (error) {
      console.error("Error guardando configuración:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Cargando configuración...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-primary mb-2">Configuración del Sitio</h2>
        <p className="text-muted-foreground">Gestioná la información general de la tienda</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Información General
              </CardTitle>
              <CardDescription>Datos básicos de la tienda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre de la Tienda</Label>
                <Input
                  id="storeName"
                  value={config.storeName}
                  onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Descripción</Label>
                <Textarea
                  id="storeDescription"
                  value={config.storeDescription}
                  onChange={(e) => setConfig({ ...config, storeDescription: e.target.value })}
                  rows={3}
                />
              </div>
              
              {/* Imagen del Hero */}
              <div className="space-y-2">
                <Label htmlFor="heroImage">Imagen del Inicio (Hero)</Label>
                <div className="space-y-3">
                  <div>
                    <Input
                      id="heroImage"
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageSelect}
                      disabled={uploadingHeroImage}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceptados: JPG, PNG, WEBP. Tamaño máximo: 5MB
                    </p>
                  </div>
                  
                  {/* Preview de imagen */}
                  {(heroImagePreview || config.heroImage) && (
                    <div className="relative w-full h-64 rounded-md overflow-hidden bg-muted border">
                      <Image 
                        src={heroImagePreview || config.heroImage || ""} 
                        alt="Preview imagen del inicio" 
                        fill 
                        className="object-cover" 
                      />
                      {uploadingHeroImage && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                          </div>
                        </div>
                      )}
                      {!uploadingHeroImage && (heroImagePreview || config.heroImage) && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setHeroImageFile(null)
                            setHeroImagePreview("")
                            setConfig({ ...config, heroImage: "" })
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {!heroImagePreview && !config.heroImage && (
                    <div className="border-2 border-dashed rounded-md p-8 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No hay imagen configurada. Se usará la imagen por defecto.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
              <CardDescription>Datos de contacto y ubicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    placeholder="11 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={config.whatsapp}
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    placeholder="5491123456789"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="contacto@pastavicenzo.com"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={config.address}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    placeholder="Av. Libertador 1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={config.city}
                    onChange={(e) => setConfig({ ...config, city: e.target.value })}
                    placeholder="CABA"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horarios e Información */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Información Adicional
              </CardTitle>
              <CardDescription>Horarios, métodos de entrega y pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openingHours">Horarios de Atención</Label>
                <Textarea
                  id="openingHours"
                  value={config.openingHours}
                  onChange={(e) => setConfig({ ...config, openingHours: e.target.value })}
                  placeholder="Lunes a Viernes: 9:00 - 20:00"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryInfo">Información de Envíos</Label>
                <Textarea
                  id="deliveryInfo"
                  value={config.deliveryInfo}
                  onChange={(e) => setConfig({ ...config, deliveryInfo: e.target.value })}
                  placeholder="Costo y zonas de envío..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupInfo">Información de Retiro</Label>
                <Textarea
                  id="pickupInfo"
                  value={config.pickupInfo}
                  onChange={(e) => setConfig({ ...config, pickupInfo: e.target.value })}
                  placeholder="Horarios y ubicación para retiro..."
                  rows={2}
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Métodos de Pago
                  </Label>
                  <Button type="button" onClick={handleAddPaymentMethod} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Agregar
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {config.paymentOptions?.map((method) => (
                    <div key={method.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border">
                      <div className="mt-2">
                        <Input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={method.active}
                          onChange={(e) => handleUpdatePaymentMethod(method.id, "active", e.target.checked)}
                        />
                      </div>
                      <div className="flex-1 grid gap-2">
                        <Input
                          value={method.name}
                          onChange={(e) => handleUpdatePaymentMethod(method.id, "name", e.target.value)}
                          placeholder="Nombre (ej: Efectivo)"
                          className="h-8"
                        />
                        <Input
                          value={method.details}
                          onChange={(e) => handleUpdatePaymentMethod(method.id, "details", e.target.value)}
                          placeholder="Detalle (ej: 10% descuento, Alias...)"
                          className="h-8 text-xs text-muted-foreground"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {(!config.paymentOptions || config.paymentOptions.length === 0) && (
                    <div className="text-center p-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                      No hay métodos de pago configurados. Agregá uno.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redes Sociales */}
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>Enlaces a redes sociales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={config.socialMedia.instagram || ""}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    socialMedia: { ...config.socialMedia, instagram: e.target.value }
                  })}
                  placeholder="@pastavicenzo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={config.socialMedia.facebook || ""}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    socialMedia: { ...config.socialMedia, facebook: e.target.value }
                  })}
                  placeholder="facebook.com/pastavicenzo"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

