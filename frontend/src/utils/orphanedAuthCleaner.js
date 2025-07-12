// frontend/src/utils/orphanedAuthCleaner.js
// Utility to help identify and suggest cleanup for orphaned Auth accounts

import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, deleteUser } from 'firebase/auth';

export class OrphanedAuthCleaner {
  /**
   * Check if an email has an orphaned Auth account (exists in Auth but not in Firestore)
   * @param {string} email - Email to check
   * @returns {Promise<{isOrphaned: boolean, canCleanup: boolean, message: string}>}
   */
  static async checkForOrphanedAuth(email) {
    try {
      // Try to sign in with a temporary password to see if auth account exists
      // This is a heuristic approach since we can't list Auth users from frontend
      
      const tempPasswords = ['123456', 'password', 'temp123', 'default123'];
      let authExists = false;
      
      for (const tempPassword of tempPasswords) {
        try {
          await signInWithEmailAndPassword(auth, email, tempPassword);
          authExists = true;
          break;
        } catch (error) {
          if (error.code === 'auth/wrong-password') {
            // Account exists but wrong password
            authExists = true;
            break;
          } else if (error.code === 'auth/user-not-found') {
            // Account doesn't exist
            authExists = false;
            break;
          }
          // For other errors, continue trying
        }
      }
      
      return {
        isOrphaned: authExists,
        canCleanup: false, // Cannot cleanup from frontend
        message: authExists 
          ? 'חשבון Authentication קיים אבל לא במסד הנתונים - יש צורך בניקוי ידני'
          : 'לא נמצא חשבון Authentication קיים'
      };
      
    } catch (error) {
      return {
        isOrphaned: false,
        canCleanup: false,
        message: `שגיאה בבדיקת חשבון Authentication: ${error.message}`
      };
    }
  }
  
  /**
   * Generate a report of potential cleanup actions needed
   * @param {Array} emails - List of emails to check
   * @returns {Promise<Object>}
   */
  static async generateCleanupReport(emails) {
    const report = {
      orphanedAccounts: [],
      cleanupNeeded: false,
      recommendations: []
    };
    
    for (const email of emails) {
      const result = await this.checkForOrphanedAuth(email);
      if (result.isOrphaned) {
        report.orphanedAccounts.push({
          email,
          ...result
        });
      }
    }
    
    if (report.orphanedAccounts.length > 0) {
      report.cleanupNeeded = true;
      report.recommendations.push(
        'יש צורך בניקוי ידני של חשבונות Authentication יתומים',
        'השתמש בכלי Admin או Firebase Console למחיקת החשבונות',
        'חלופית: השתמש ב-backend API עם הרשאות Admin'
      );
    }
    
    return report;
  }
}

export default OrphanedAuthCleaner;
