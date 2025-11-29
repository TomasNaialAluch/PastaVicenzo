# Guía de Migración a Subcolecciones

Este script migra los datos existentes de las colecciones separadas (`addresses` y `orders`) a subcolecciones dentro de cada usuario.

## Estructura Antigua vs Nueva

### Antes:
```
addresses/{addressId}
  - userId: "user123"
  - name: "Casa"
  - ...

orders/{orderId}
  - userId: "user123"
  - items: [...]
  - ...
```

### Después:
```
users/{userId}/addresses/{addressId}
  - name: "Casa"
  - ... (sin campo userId)

users/{userId}/orders/{orderId}
  - items: [...]
  - ... (sin campo userId)
```

## Pasos para Migrar

### 1. Preparación

1. **Hacer backup de Firestore**:
   - Ve a Firebase Console → Firestore → Exportar datos
   - O usa `gcloud firestore export`

2. **Instalar dependencias**:
   ```bash
   npm install firebase-admin
   ```

3. **Descargar credenciales de servicio**:
   - Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio
   - Genera una nueva clave privada
   - Guarda el archivo JSON como `serviceAccountKey.json` en la raíz del proyecto
   - ⚠️ **NO commitees este archivo** (debe estar en .gitignore)

### 2. Ejecutar Migración

```bash
node scripts/migrate-to-subcollections.js
```

### 3. Verificar Datos

1. Revisa en Firebase Console que los datos estén en las nuevas ubicaciones
2. Verifica que la aplicación funcione correctamente
3. Prueba crear, editar y eliminar direcciones/pedidos

### 4. Limpiar Datos Antiguos (Opcional)

Una vez verificado que todo funciona:

1. Descomenta las líneas de `delete()` en el script
2. Ejecuta el script nuevamente para eliminar los datos antiguos
3. O elimina manualmente las colecciones `addresses` y `orders` desde Firebase Console

## Notas Importantes

- ⚠️ El script **NO elimina** los datos antiguos por defecto (líneas comentadas)
- ✅ Los datos se copian a la nueva ubicación, no se mueven
- 🔍 Revisa los logs para verificar que todo se migró correctamente
- 📊 El script muestra progreso cada 10 documentos migrados

## Alternativa: Migración Manual

Si prefieres migrar manualmente o tienes pocos datos:

1. Ve a Firebase Console → Firestore
2. Para cada documento en `addresses`:
   - Copia el contenido
   - Crea el documento en `users/{userId}/addresses/{addressId}`
   - Elimina el campo `userId`
3. Repite para `orders`

## Rollback

Si necesitas volver atrás:

1. Los datos antiguos siguen existiendo (si no los eliminaste)
2. Puedes revertir los cambios en el código
3. O restaurar desde el backup

