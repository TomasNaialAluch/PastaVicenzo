"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Pencil, Trash2, ShoppingBag, Image as ImageIcon, X, DollarSign, Package } from "lucide-react"
import Image from "next/image"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { toast } from "sonner"
import { useConfirmModal } from "@/components/ui/global-confirmation-modal"
import { useAuth } from "@/lib/auth-context"
import { useIsAdmin } from "@/lib/use-is-admin"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isVeggie?: boolean
  isGlutenFree?: boolean
  isPromo?: boolean
  isActive?: boolean
  unitsPerPackage?: number // Unidades por paquete (solo para pastas rellenas)
  servesPeople?: number // Para cuántas personas rinde (solo para ñoquis)
  variants?: { id: string; label: string; price: number }[] // Variantes de producto (ej: 2 porciones, 4 porciones)
}

const categories = [
  { id: "rellenas", label: "Pastas Rellenas" },
  { id: "cintas", label: "Cintas" },
  { id: "placas", label: "Placas" },
  { id: "especiales", label: "Especiales" },
  { id: "noqui", label: "Ñoqui" },
]

export default function AdminProductosPage() {
  const { user } = useAuth()
  const { isAdmin } = useIsAdmin()
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { openModal } = useConfirmModal()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    category: "rellenas",
    isVeggie: false,
    isGlutenFree: false,
    isPromo: false,
    isActive: true,
    unitsPerPackage: "",
    servesPeople: "",
    variants: [] as { id: string; label: string; price: number }[],
  })
  // Estados para variantes
  const [variantLabel, setVariantLabel] = useState("")
  const [variantPrice, setVariantPrice] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setProductsLoading(true)
      const productsRef = collection(db, "products")
      
      // Intentar con orderBy primero, si falla por índice, intentar sin orderBy
      let productsSnapshot
      try {
        const productsQuery = query(productsRef, orderBy("name"))
        productsSnapshot = await getDocs(productsQuery)
      } catch (orderByError: any) {
        // Si falla por índice, intentar sin orderBy y ordenar en el cliente
        console.warn("Query con orderBy falló, cargando sin orden:", orderByError)
        productsSnapshot = await getDocs(productsRef)
      }
      
      const productsData: Product[] = []
      productsSnapshot.forEach((doc) => {
        const data = doc.data()
        productsData.push({
          id: doc.id,
          name: data.name || "",
          description: data.description || "",
          price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
          image: data.image || "",
          category: data.category || "rellenas",
          isVeggie: data.isVeggie || false,
          isGlutenFree: data.isGlutenFree || false,
          isPromo: data.isPromo || false,
          isActive: data.isActive !== undefined ? data.isActive : true,
          unitsPerPackage: data.unitsPerPackage ? Number(data.unitsPerPackage) : undefined,
          servesPeople: data.servesPeople ? Number(data.servesPeople) : undefined,
          variants: data.variants || [],
        })
      })
      
      // Ordenar por nombre en el cliente si no se pudo ordenar en la query
      productsData.sort((a, b) => a.name.localeCompare(b.name))
      
      setProducts(productsData)
    } catch (error: unknown) {
      console.error("Error cargando productos:", error)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        image: product.image,
        category: product.category,
        isVeggie: product.isVeggie || false,
        isGlutenFree: product.isGlutenFree || false,
        isPromo: product.isPromo || false,
        isActive: product.isActive !== undefined ? product.isActive : true,
        unitsPerPackage: product.unitsPerPackage?.toString() || "",
        servesPeople: product.servesPeople?.toString() || "",
        variants: product.variants || [],
      })
      setImageFile(null)
      setImagePreview(product.image)
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        image: "",
        category: "rellenas",
        isVeggie: false,
        isGlutenFree: false,
        isPromo: false,
        isActive: true,
        unitsPerPackage: "",
        servesPeople: "",
        variants: [],
      })
      setImageFile(null)
      setImagePreview("")
    }
    setIsDialogOpen(true)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setImageFile(file)
      
      // Crear preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Limpiar campo de URL si se sube un archivo
      setFormData({ ...formData, image: "" })
    }
  }

  const uploadImageToStorage = async (file: File, productId?: string): Promise<string> => {
    // Crear nombre único para el archivo
    const fileName = productId 
      ? `products/${productId}_${Date.now()}_${file.name}`
      : `products/${Date.now()}_${file.name}`
    
    const storageRef = ref(storage, fileName)
    
    // Subir archivo
    await uploadBytes(storageRef, file)
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  }

  const handleSave = async () => {
    try {
      // Validación: verificar que el usuario sea admin
      if (!isAdmin) {
        toast.error("No tenés permisos para crear productos. Verificá que tu usuario tenga role: 'admin' en Firestore.")
        return
      }

      // Validaciones TypeScript
      if (!formData.name || !formData.price) {
        toast.error("Completá nombre y precio (campos obligatorios)")
        return
      }

      // Validación: debe tener imagen (subida o URL)
      if (!imageFile && !formData.image) {
        toast.error("Subí una imagen o ingresá una URL de imagen")
        return
      }

      let imageUrl = formData.image

      // Si hay un archivo para subir, subirlo primero
      if (imageFile) {
        setUploadingImage(true)
        try {
          imageUrl = await uploadImageToStorage(imageFile, editingProduct?.id)
          toast.success("Imagen subida correctamente")
        } catch (error: unknown) {
          console.error("Error subiendo imagen:", error)
          if (error instanceof Error) {
            toast.error(`Error al subir la imagen: ${error.message}`)
          } else {
            toast.error("Error al subir la imagen. Intentá nuevamente.")
          }
          setUploadingImage(false)
          return
        } finally {
          setUploadingImage(false)
        }
      }

      const productData: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: imageUrl,
        category: formData.category,
        isVeggie: formData.isVeggie,
        isGlutenFree: formData.isGlutenFree,
        isPromo: formData.isPromo,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      }

      // Solo agregar unitsPerPackage si es pasta rellena y tiene valor
      if (formData.category === "rellenas" && formData.unitsPerPackage && formData.unitsPerPackage.trim() !== "") {
        productData.unitsPerPackage = parseInt(formData.unitsPerPackage)
      }

      // Solo agregar servesPeople si es ñoqui y tiene valor
      if (formData.category === "noqui" && formData.servesPeople && formData.servesPeople.trim() !== "") {
        productData.servesPeople = parseInt(formData.servesPeople)
      }
      
      // Agregar variantes si existen
      if (formData.variants && formData.variants.length > 0) {
        productData.variants = formData.variants
      } else {
        productData.variants = [] // Asegurar que se limpie si no hay variantes
      }

      if (editingProduct) {
        // Actualizar producto existente
        const productRef = doc(db, "products", editingProduct.id)
        await updateDoc(productRef, productData)
        toast.success("Producto actualizado correctamente")
      } else {
        // Crear nuevo producto
        await addDoc(collection(db, "products"), productData)
        toast.success("Producto creado correctamente")
      }

      setIsDialogOpen(false)
      setImageFile(null)
      setImagePreview("")
      loadProducts()
    } catch (error: unknown) {
      console.error("Error guardando producto:", error)
      
      // Manejo específico de errores de permisos
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('Permission')) {
          toast.error("No tenés permisos para crear productos. Verificá que tu usuario tenga role: 'admin' en Firestore.")
        } else if (error.message.includes('Missing or insufficient')) {
          toast.error("Permisos insuficientes. Verificá que tu usuario tenga role: 'admin' en Firestore.")
        } else {
          toast.error(`Error al guardar el producto: ${error.message}`)
        }
      } else {
        toast.error("Error al guardar el producto. Revisá la consola para más detalles.")
      }
    }
  }

  const handleAddVariant = () => {
    if (!variantLabel || !variantPrice) {
      toast.error("Completá nombre y precio de la variante")
      return
    }
    
    const newVariant = {
      id: Date.now().toString(),
      label: variantLabel,
      price: parseFloat(variantPrice)
    }
    
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant]
    })
    
    setVariantLabel("")
    setVariantPrice("")
  }

  const handleRemoveVariant = (id: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter(v => v.id !== id)
    })
  }

  const handleDelete = (productId: string, productName: string) => {
    openModal({
      title: "¿Eliminar producto?",
      description: `¿Estás seguro de que querés eliminar "${productName}"? Esta acción no se puede deshacer.`,
      actionLabel: "Sí, eliminar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "products", productId))
          toast.success("Producto eliminado correctamente")
          loadProducts()
        } catch (error) {
          console.error("Error eliminando producto:", error)
          toast.error("Error al eliminar el producto")
        }
      },
    })
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">Gestión de Productos</h2>
          <p className="text-muted-foreground">Creá, editá y eliminá productos del catálogo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Modificá los datos del producto" : "Completá los datos del nuevo producto"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              
              {/* 1. Información Básica */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Producto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Ravioles de Ricota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formData.category} onValueChange={(val) => {
                      setFormData({ 
                        ...formData, 
                        category: val, 
                        unitsPerPackage: val !== "rellenas" ? "" : formData.unitsPerPackage,
                        servesPeople: val !== "noqui" ? "" : formData.servesPeople
                      })
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción breve del producto (ingredientes, recomendaciones...)"
                    rows={2}
                  />
                </div>
              </div>

              {/* 2. Precios y Variantes */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center gap-2 text-primary font-medium border-b pb-2">
                  <DollarSign className="h-4 w-4" />
                  <h3>Precios y Opciones</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio Base (o Precio Único) *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-bold">$</span>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Ej: 1200"
                        className="max-w-[200px]"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.variants.length > 0 
                        ? "Este precio se mostrará como referencia 'desde' si hay variantes." 
                        : "Este es el precio final del producto si no agregás variantes."}
                    </p>
                  </div>

                  {/* Sección de Variantes */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Variantes / Porciones (Opcional)</Label>
                      <Badge variant="outline" className="font-normal">
                        {formData.variants.length} opciones activas
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Usá esto para ofrecer diferentes tamaños o cantidades (ej: "2 Porciones" y "4 Porciones").
                      Los clientes elegirán una de estas opciones al comprar.
                    </p>
                    
                    <div className="flex gap-2 items-end bg-background p-3 rounded border">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="variantLabel" className="text-xs">Nombre de la opción</Label>
                        <Input 
                          id="variantLabel"
                          placeholder="Ej: 4 Porciones" 
                          value={variantLabel}
                          onChange={(e) => setVariantLabel(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label htmlFor="variantPrice" className="text-xs">Precio</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                          <Input 
                            id="variantPrice"
                            type="number"
                            placeholder="2000" 
                            value={variantPrice}
                            onChange={(e) => setVariantPrice(e.target.value)}
                            className="h-8 pl-5"
                          />
                        </div>
                      </div>
                      <Button type="button" onClick={handleAddVariant} size="sm" variant="secondary" className="h-8">
                        <Plus className="h-4 w-4 mr-1" /> Agregar
                      </Button>
                    </div>

                    {formData.variants.length > 0 && (
                      <div className="grid gap-2">
                        {formData.variants.map((variant) => (
                          <div key={variant.id} className="flex items-center justify-between bg-white p-2 rounded border shadow-sm text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{variant.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-green-600">${variant.price}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleRemoveVariant(variant.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Imagen y Detalles */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="image">Imagen del Producto *</Label>
                  <div className="space-y-3 border rounded-lg p-3">
                    {/* Preview de imagen */}
                    {(imagePreview || formData.image) ? (
                      <div className="relative h-40 w-full rounded-md overflow-hidden bg-muted border">
                        <Image 
                          src={imagePreview || formData.image} 
                          alt="Preview" 
                          fill 
                          className="object-cover" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview("")
                            setFormData({ ...formData, image: "" })
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                              <p className="text-sm text-muted-foreground">Subiendo...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-muted/50 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs">Sin imagen seleccionada</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="imageFile" className="sr-only">Subir archivo</Label>
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          disabled={uploadingImage}
                          className="cursor-pointer text-xs"
                        />
                      </div>
                      <div className="relative flex items-center py-1">
                        <span className="w-full border-t" />
                        <span className="px-2 text-xs text-muted-foreground uppercase bg-background">O URL</span>
                        <span className="w-full border-t" />
                      </div>
                      <Input
                        id="imageUrl"
                        value={formData.image}
                        onChange={(e) => {
                          setFormData({ ...formData, image: e.target.value })
                          if (e.target.value) {
                            setImageFile(null)
                            setImagePreview(e.target.value)
                          }
                        }}
                        placeholder="https://..."
                        disabled={!!imageFile || uploadingImage}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Campos Específicos de Categoría */}
                  <div className="space-y-2">
                     <Label>Detalles Específicos</Label>
                     <div className="p-3 bg-muted/30 rounded-lg border min-h-[100px]">
                        {formData.category === "rellenas" ? (
                          <div className="space-y-2">
                            <Label htmlFor="unitsPerPackage" className="text-xs">Unidades por Paquete</Label>
                            <Input
                              id="unitsPerPackage"
                              type="number"
                              min="1"
                              value={formData.unitsPerPackage}
                              onChange={(e) => setFormData({ ...formData, unitsPerPackage: e.target.value })}
                              placeholder="Ej: 12"
                              className="bg-background"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Cantidad de unidades que trae cada paquete/caja
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center h-full justify-center italic">
                            No hay campos extra para esta categoría.
                          </p>
                        )}
                     </div>
                  </div>

                  {/* Configuración (Checkboxes) */}
                  <div className="space-y-2">
                    <Label>Configuración</Label>
                    <div className="grid grid-cols-1 gap-2 p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                        />
                        <Label htmlFor="isActive" className="cursor-pointer text-sm">Visible en Tienda</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isPromo"
                          checked={formData.isPromo}
                          onCheckedChange={(checked) => setFormData({ ...formData, isPromo: !!checked })}
                        />
                        <Label htmlFor="isPromo" className="cursor-pointer text-sm">En Promoción</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isVeggie"
                          checked={formData.isVeggie}
                          onCheckedChange={(checked) => setFormData({ ...formData, isVeggie: !!checked })}
                        />
                        <Label htmlFor="isVeggie" className="cursor-pointer text-sm">Vegetariano</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isGlutenFree"
                          checked={formData.isGlutenFree}
                          onCheckedChange={(checked) => setFormData({ ...formData, isGlutenFree: !!checked })}
                        />
                        <Label htmlFor="isGlutenFree" className="cursor-pointer text-sm">Sin Gluten</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingProduct ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Productos</CardDescription>
            <CardTitle className="text-2xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {products.filter(p => p.isActive !== false).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Promoción</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {products.filter(p => p.isPromo).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vegetarianos</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {products.filter(p => p.isVeggie).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de productos */}
      {productsLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando productos...</p>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" 
                ? "No se encontraron productos con estos filtros." 
                : "Aún no hay productos. Creá el primero!"}
            </p>
            {!searchTerm && categoryFilter === "all" && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Producto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={product.isActive === false ? "opacity-60" : ""}>
              <div className="relative h-48 w-full">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {product.isPromo && <Badge className="bg-red-500">Promo</Badge>}
                  {product.isVeggie && <Badge className="bg-green-500">Veggie</Badge>}
                  {product.isGlutenFree && <Badge className="bg-blue-500">Sin Gluten</Badge>}
                  {product.isActive === false && <Badge variant="outline">Inactivo</Badge>}
                </div>
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary">
                    ${product.price.toLocaleString('es-AR')}
                  </span>
                  <Badge variant="outline">{categories.find(c => c.id === product.category)?.label}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(product)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(product.id, product.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

