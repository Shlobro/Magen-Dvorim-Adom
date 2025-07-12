# Manual Auth Cleanup Guide

## Overview
This project uses frontend-only Firebase SDK to keep costs low. However, this creates a limitation: we cannot delete Firebase Authentication accounts from the frontend for security reasons.

## The Problem
When users are deleted from the system, two scenarios can occur:

1. **Orphaned Auth Accounts**: Users deleted from Firestore but their Firebase Auth accounts remain
2. **Orphaned Firestore Documents**: Users exist in Firestore but have corrupted/missing Auth accounts

## Detection
The system will log warnings when orphaned accounts are detected:

```
⚠️ WARNING: User email@example.com (uid123) deleted from Firestore but Auth account remains!
   This creates an orphaned Auth account that should be cleaned up manually.
```

## Manual Cleanup Options

### Option 1: Firebase Console (Manual)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Authentication > Users
4. Find and delete orphaned users manually

### Option 2: Firebase CLI (Semi-Automated)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# List all auth users
firebase auth:export users.json --project your-project-id

# Review the exported file and identify orphaned accounts
# Use Firebase Admin SDK script to delete them
```

### Option 3: Backend Script (Recommended)
Create a backend script using Firebase Admin SDK:

```javascript
// cleanup-orphaned-auth.js
import admin from 'firebase-admin';

async function cleanupOrphanedAuth() {
  // Get all Auth users
  const authUsers = await admin.auth().listUsers();
  
  // Get all Firestore users
  const firestoreUsers = await admin.firestore().collection('user').get();
  const firestoreUIDs = new Set(firestoreUsers.docs.map(doc => doc.id));
  
  // Find orphaned Auth users
  const orphanedAuthUsers = authUsers.users.filter(user => 
    !firestoreUIDs.has(user.uid)
  );
  
  // Delete orphaned Auth users
  for (const user of orphanedAuthUsers) {
    await admin.auth().deleteUser(user.uid);
    console.log(`Deleted orphaned Auth user: ${user.email}`);
  }
}
```

## Prevention
The updated system now includes better duplicate detection to prevent future orphaned accounts:

1. **Excel Import**: Checks for existing users before creating new ones
2. **Normal Signup**: Validates no duplicates exist
3. **Enhanced Logging**: Better tracking of potential issues

## Monitoring
Check browser console for these warning messages:
- `WARNING: User ... deleted from Firestore but Auth account remains!`
- `Cannot delete orphaned Auth account from frontend`
- `Duplicate found in Firestore`

## Cost Considerations
- Firebase Authentication is free for up to 50,000 MAU (Monthly Active Users)
- Orphaned accounts don't count as "active" but still consume quota
- Regular cleanup is recommended to maintain system health

## Future Improvements
Consider implementing a backend API for complete user management if the project grows and budget allows for backend hosting costs.
