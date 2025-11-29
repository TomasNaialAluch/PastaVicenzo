"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Package, Users, ShoppingBag, Settings, Image as ImageIcon, ListPlus } from "lucide-react"

export default function AdminGuiaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-primary mb-2">Guía de Administración</h2>
        <p className="text-muted-foreground">Documentación detallada sobre cómo gestionar tu tienda</p>
      </div>

      <div className="grid gap-6">
        {/* Gestión de Pedidos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Gestión de Pedidos</CardTitle>
            </div>
            <CardDescription>Cómo ver y administrar las compras de los clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="ver-pedidos">
                <AccordionTrigger>Ver todos los pedidos</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>En la sección de <strong>Pedidos</strong> verás una lista completa de todas las compras realizadas, tanto por usuarios registrados como invitados.</p>
                  <p>La lista muestra primero los pedidos más recientes. Cada fila indica:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>ID:</strong> Código único del pedido.</li>
                    <li><strong>Cliente:</strong> Nombre y teléfono de contacto.</li>
                    <li><strong>Estado:</strong> Estado actual (Preparación, En Camino, Entregado, Cancelado).</li>
                    <li><strong>Total:</strong> Monto total de la compra.</li>
                    <li><strong>Fecha:</strong> Cuándo se realizó el pedido.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cambiar-estado">
                <AccordionTrigger>Cambiar estado de un pedido</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Es fundamental mantener el estado actualizado para el control interno:</p>
                  <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Identificá el pedido en la lista.</li>
                    <li>Hacé clic en el selector de estado (el botón con el color del estado actual).</li>
                    <li>Elegí el nuevo estado:
                      <ul className="list-disc pl-5 mt-1">
                        <li><Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Preparación</Badge>: Pedido recibido y en cocina.</li>
                        <li><Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">En Camino</Badge>: Pedido despachado o listo para retirar.</li>
                        <li><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Entregado</Badge>: El cliente ya recibió su pedido.</li>
                        <li><Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>: Pedido anulado.</li>
                      </ul>
                    </li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="detalles-pedido">
                <AccordionTrigger>Ver detalle de productos</AccordionTrigger>
                <AccordionContent>
                  <p>Para ver qué productos pidió el cliente, hacé clic en el botón <strong>"Ver Productos"</strong> a la derecha de la fila. Se abrirá una ventana con el listado exacto de ítems, cantidades y variantes elegidas.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Gestión de Productos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <CardTitle>Gestión de Productos</CardTitle>
            </div>
            <CardDescription>Crear, editar y organizar tu catálogo</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="crear-producto">
                <AccordionTrigger>Crear un nuevo producto</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Andá a la sección <strong>Productos</strong>.</li>
                    <li>Hacé clic en el botón <strong>"+ Nuevo Producto"</strong> arriba a la derecha.</li>
                    <li>Completá la <strong>Información Básica</strong>: Nombre, Categoría y Descripción.</li>
                    <li>En la sección <strong>Precios y Opciones</strong>, definí el precio base.</li>
                    <li>Si el producto tiene diferentes tamaños (ej: Ñoquis 2 vs 4 porciones), usá las <strong>Variantes</strong>.</li>
                    <li>Subí una imagen atractiva y completá los detalles específicos si corresponden.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="variantes">
                <AccordionTrigger>Precios y Variantes (Porciones)</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>El sistema de precios es flexible:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Precio Base:</strong> Es el precio único del producto. Si agregás variantes, este precio se usará como referencia "desde".</li>
                    <li><strong>Variantes:</strong> Ideales para diferenciar tamaños (ej: "2 Porciones" - $14.500 / "4 Porciones" - $25.000).</li>
                    <li>Al agregar variantes, el cliente verá botones claros para elegir su opción antes de agregar al carrito.</li>
                    <li>La información de "para cuántos comensales" ahora está implícita en el nombre de la variante (ej: "4 Porciones"), por lo que ya no hace falta aclararlo en otro campo.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="campos-especiales">
                <AccordionTrigger>Detalles Específicos (Pastas Rellenas)</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Para las <strong>Pastas Rellenas</strong> (Ravioles, Sorrentinos, etc.), aparecerá un campo especial:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Unidades por Paquete:</strong> Indicá cuántas unidades trae la caja (ej: 12 grandes, 24 chicos). Esto ayuda al cliente a calcular cuánto necesita.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="imagenes">
                <AccordionTrigger>Subir imágenes</AccordionTrigger>
                <AccordionContent>
                  <p>Podés subir imágenes directamente desde tu computadora o celular. El sistema las guardará automáticamente y las optimizará. Intentá usar fotos cuadradas o rectangulares de buena calidad, preferiblemente en formato JPG o WEBP para que carguen rápido.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Configuración General */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Configuración del Sitio</CardTitle>
            </div>
            <CardDescription>Personalizar la información visible de la tienda</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="hero-image">
                <AccordionTrigger>Imagen de Portada (Inicio)</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Podés cambiar la imagen grande que aparece al entrar a la web (Hero):</p>
                  <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Andá a <strong>Configuración</strong>.</li>
                    <li>Buscá la sección "Imagen del Inicio (Hero)".</li>
                    <li>Subí una nueva foto atractiva de tus pastas.</li>
                    <li>Guardá los cambios. La actualización es inmediata.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="datos-contacto">
                <AccordionTrigger>Datos de Contacto y Horarios</AccordionTrigger>
                <AccordionContent>
                  <p>Mantené siempre actualizados el teléfono, WhatsApp y horarios de atención. Estos datos se muestran en el pie de página y en la sección de contacto. Si cambiás el número de WhatsApp, el botón flotante y los enlaces de pedido se actualizarán automáticamente.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Gestión de Usuarios */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Usuarios</CardTitle>
            </div>
            <CardDescription>Control de accesos y roles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Aquí podés ver quiénes se han registrado en tu tienda.
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Roles:</strong> Podés cambiar el rol de un usuario de "User" a "Admin".</li>
              <li><strong>Cuidado:</strong> Un usuario "Admin" tiene acceso total a este panel de control. Solo dales este permiso a personas de confianza.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

