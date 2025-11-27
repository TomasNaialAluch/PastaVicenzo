"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type Address = {
  id: string
  name: string
  type: "home" | "work" | "other"
  street: string
  city: string
  zipCode: string
  notes?: string
  isDefault: boolean
}

interface AddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addressToEdit?: Address | null
  onSave: (address: Address) => void
}

export function AddressDialog({ open, onOpenChange, addressToEdit, onSave }: AddressDialogProps) {
  const [formData, setFormData] = useState<Partial<Address>>({
    type: "home",
    isDefault: false
  })

  // Reset form when dialog opens or addressToEdit changes
  useEffect(() => {
    if (open) {
      if (addressToEdit) {
        setFormData(addressToEdit)
      } else {
        setFormData({ type: "home", isDefault: false, name: "", street: "", city: "", zipCode: "", notes: "" })
      }
    }
  }, [open, addressToEdit])

  const handleSave = () => {
    // Basic validation could go here
    if (!formData.street || !formData.city) return

    const addressToSave = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
    } as Address

    onSave(addressToSave)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{addressToEdit ? "Editar Dirección" : "Nueva Dirección"}</DialogTitle>
          <DialogDescription>
            Ingresá los datos de tu dirección para envíos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre (ej: Casa, Oficina)</Label>
            <Input 
              id="name" 
              value={formData.name || ""} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Tipo de lugar</Label>
            <RadioGroup 
              value={formData.type || "home"} 
              onValueChange={(val) => setFormData({...formData, type: val as any})}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="home" id="r-home" />
                <Label htmlFor="r-home">Casa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="work" id="r-work" />
                <Label htmlFor="r-work">Trabajo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="r-other" />
                <Label htmlFor="r-other">Otro</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="street">Calle y Altura</Label>
            <Input 
              id="street" 
              value={formData.street || ""} 
              onChange={(e) => setFormData({...formData, street: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">Ciudad / Barrio</Label>
              <Input 
                id="city" 
                value={formData.city || ""} 
                onChange={(e) => setFormData({...formData, city: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">Código Postal</Label>
              <Input 
                id="zip" 
                value={formData.zipCode || ""} 
                onChange={(e) => setFormData({...formData, zipCode: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observaciones (Opcional)</Label>
            <Textarea 
              id="notes" 
              placeholder="Timbre, piso, entre calles..." 
              value={formData.notes || ""} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Guardar Dirección</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


