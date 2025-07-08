#!/usr/bin/env node

// Debug script to check Firebase config after build
console.log('🔧 Checking Firebase configuration...')

// Check if we're in browser environment
if (typeof window === 'undefined') {
  console.log('Running in Node.js environment')
  process.exit(0)
}

// Import Firebase config
try {
  const { db } = await import('./src/firebaseConfig.js')
  
  console.log('Firebase config loaded:')
  console.log('  - db exists:', !!db)
  console.log('  - app name:', db?.app?.name)
  console.log('  - Environment:', import.meta.env?.MODE)
  
  // Try a simple query
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  
  console.log('Testing Firebase connection...')
  const q = query(collection(db, "user"), where("userType", "==", 2))
  const querySnapshot = await getDocs(q)
  console.log('✅ Firebase query successful, docs:', querySnapshot.size)
  
} catch (error) {
  console.error('❌ Firebase config error:', error)
  console.error('Error type:', typeof error)
  console.error('Error constructor:', error.constructor.name)
  
  if (error.message?.includes('<!DOCTYPE')) {
    console.error('🚨 Getting HTML instead of Firebase response - this indicates a routing/hosting issue')
  }
}
