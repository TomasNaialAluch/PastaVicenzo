/**
 * Script de migración para mover direcciones y pedidos a subcolecciones
 * 
 * Estructura anterior:
 * - addresses/{addressId} con campo userId
 * - orders/{orderId} con campo userId
 * 
 * Estructura nueva:
 * - users/{userId}/addresses/{addressId}
 * - users/{userId}/orders/{orderId}
 * 
 * Uso:
 * node scripts/migrate-to-subcollections.js
 * 
 * IMPORTANTE: Este script debe ejecutarse con cuidado y hacer backup antes
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Necesitas descargar esto desde Firebase Console

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateAddresses() {
  console.log('🔄 Iniciando migración de direcciones...');
  
  try {
    const addressesSnapshot = await db.collection('addresses').get();
    console.log(`📦 Encontradas ${addressesSnapshot.size} direcciones para migrar`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const doc of addressesSnapshot.docs) {
      try {
        const data = doc.data();
        const userId = data.userId;
        
        if (!userId) {
          console.warn(`⚠️ Dirección ${doc.id} no tiene userId, saltando...`);
          errors++;
          continue;
        }
        
        // Crear en la nueva ubicación (subcolección)
        await db.collection('users').doc(userId).collection('addresses').doc(doc.id).set({
          ...data,
          // Remover userId ya que está implícito en la ruta
          userId: admin.firestore.FieldValue.delete()
        });
        
        // Opcional: Eliminar de la ubicación antigua (descomentar cuando estés seguro)
        // await db.collection('addresses').doc(doc.id).delete();
        
        migrated++;
        if (migrated % 10 === 0) {
          console.log(`✅ Migradas ${migrated} direcciones...`);
        }
      } catch (error) {
        console.error(`❌ Error migrando dirección ${doc.id}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Migración de direcciones completada: ${migrated} migradas, ${errors} errores`);
  } catch (error) {
    console.error('❌ Error en migración de direcciones:', error);
  }
}

async function migrateOrders() {
  console.log('🔄 Iniciando migración de pedidos...');
  
  try {
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`📦 Encontrados ${ordersSnapshot.size} pedidos para migrar`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const doc of ordersSnapshot.docs) {
      try {
        const data = doc.data();
        const userId = data.userId;
        
        if (!userId) {
          console.warn(`⚠️ Pedido ${doc.id} no tiene userId, saltando...`);
          errors++;
          continue;
        }
        
        // Crear en la nueva ubicación (subcolección)
        await db.collection('users').doc(userId).collection('orders').doc(doc.id).set({
          ...data,
          // Remover userId ya que está implícito en la ruta
          userId: admin.firestore.FieldValue.delete()
        });
        
        // Opcional: Eliminar de la ubicación antigua (descomentar cuando estés seguro)
        // await db.collection('orders').doc(doc.id).delete();
        
        migrated++;
        if (migrated % 10 === 0) {
          console.log(`✅ Migrados ${migrated} pedidos...`);
        }
      } catch (error) {
        console.error(`❌ Error migrando pedido ${doc.id}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Migración de pedidos completada: ${migrated} migrados, ${errors} errores`);
  } catch (error) {
    console.error('❌ Error en migración de pedidos:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando migración a subcolecciones...\n');
  
  await migrateAddresses();
  console.log('\n');
  await migrateOrders();
  
  console.log('\n✅ Migración completada!');
  console.log('⚠️ IMPORTANTE: Revisa los datos antes de eliminar las colecciones antiguas.');
  console.log('⚠️ Descomenta las líneas de delete() en el script cuando estés seguro.');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

