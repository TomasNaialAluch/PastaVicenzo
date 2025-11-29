"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type ConfirmModalOptions = {
  title: string
  description: string
  actionLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: "default" | "destructive"
}

type ConfirmModalContextType = {
  openModal: (options: ConfirmModalOptions) => void
}

const ConfirmModalContext = createContext<ConfirmModalContextType | undefined>(undefined)

export function ConfirmModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmModalOptions | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const openModal = useCallback((newOptions: ConfirmModalOptions) => {
    setOptions(newOptions)
    setIsOpen(true)
    setIsConfirming(false)
  }, [])

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true)
    if (options?.onConfirm) {
      try {
        await options.onConfirm()
      } catch (error) {
        console.error("Error en confirmación:", error)
      }
    }
    setIsOpen(false)
    setOptions(null)
    setIsConfirming(false)
  }, [options])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && !isConfirming) {
      // Se cerró sin confirmar (cancelar)
      setIsOpen(false)
      setOptions(null)
    }
  }, [isConfirming])

  return (
    <ConfirmModalContext.Provider value={{ openModal }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title || "Confirmar acción"}</AlertDialogTitle>
            <AlertDialogDescription>
              {options?.description || "¿Estás seguro de que querés continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {options?.cancelLabel || "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                options?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {options?.actionLabel || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmModalContext.Provider>
  )
}

export function useConfirmModal() {
  const context = useContext(ConfirmModalContext)
  if (context === undefined) {
    throw new Error("useConfirmModal must be used within a ConfirmModalProvider")
  }
  return context
}

