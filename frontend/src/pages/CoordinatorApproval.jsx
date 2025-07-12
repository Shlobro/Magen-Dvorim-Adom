import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { userService } from '../services/firebaseService';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../styles/CoordinatorApproval.css';

export default function CoordinatorApproval() {
  const [pendingCoordinators, setPendingCoordinators] = useState([]);
  const [existingCoordinators, setExistingCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'existing'
  const { currentUser, userRole, loading: authLoading } = useAuth();
  
  // Safe notification hook usage with error handling
  let notificationContext;
  try {
    notificationContext = useNotification();
  } catch (error) {
    console.warn('Notification context not available:', error);
    notificationContext = {
      showSuccess: (msg) => console.log('Success:', msg),
      showError: (msg) => console.error('Error:', msg),
      showInfo: (msg) => console.log('Info:', msg)
    };
  }
  
  const { showSuccess, showError, showInfo } = notificationContext;

  // Generate coordinator signup link
  const coordinatorSignupLink = `${window.location.origin}/coordinator-register`;
  useEffect(() => {
    fetchPendingCoordinators();
    fetchExistingCoordinators();
  }, []);
  
  // Helper function to convert Firestore timestamp to JavaScript Date
  const convertFirestoreDate = (timestamp) => {
    if (!timestamp) return new Date();
    
    // Handle Firestore Timestamp object
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000);
    }
    
    // Handle regular date string/object
    return new Date(timestamp);
  };
  
  const fetchPendingCoordinators = async () => {
    try {
      setLoading(true);
      
      // Get pending coordinators from Firebase (userType = 1 and approved = false)
      const q = query(
        collection(db, 'user'),
        where('userType', '==', 1),
        where('approved', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const pending = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pending.push({
          id: doc.id,
          ...data,
          createdAt: convertFirestoreDate(data.createdAt)
        });
      });
      
      // Sort by creation date (newest first)
      const processedPending = pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setPendingCoordinators(processedPending);
    } catch (err) {
      console.error('Error fetching pending coordinators:', err);
      showError('שגיאה בטעינת רשימת הרכזים הממתינים');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingCoordinators = async () => {
    try {
      setLoadingExisting(true);
      
      // Get all coordinators (userType = 1), filter by approved status later
      const q = query(
        collection(db, 'user'),
        where('userType', '==', 1)
      );
      
      const querySnapshot = await getDocs(q);
      const existing = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Include coordinators that are approved OR don't have the approved field (legacy users)
        if (data.approved === true || data.approved === undefined) {
          existing.push({
            id: doc.id,
            ...data,
            createdAt: convertFirestoreDate(data.createdAt),
            approvedAt: convertFirestoreDate(data.approvedAt || data.createdAt),
            isApproved: data.approved === true || data.approved === undefined // Set the display status
          });
        }
      });
      
      // Sort by creation date (newest first)
      const processedExisting = existing.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setExistingCoordinators(processedExisting);
    } catch (err) {
      console.error('Error fetching existing coordinators:', err);
      // Don't set main error for existing coordinators, just log it
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleApprove = async (pendingCoordinator) => {
    setProcessingId(pendingCoordinator.id);
    try {
      // Update the user's approved status to true
      await updateDoc(doc(db, 'user', pendingCoordinator.id), {
        approved: true,
        approvedAt: new Date(),
        approvedBy: currentUser.uid
      });

      // Remove from pending list and refresh existing coordinators
      setPendingCoordinators(prev => prev.filter(p => p.id !== pendingCoordinator.id));
      
      // Also add to existing coordinators list immediately for better UX
      const approvedCoordinator = {
        ...pendingCoordinator,
        approved: true,
        approvedAt: new Date(),
        approvedBy: currentUser.uid,
        isApproved: true
      };
      setExistingCoordinators(prev => [approvedCoordinator, ...prev]);
      
      showSuccess('הרכז אושר בהצלחה!');
    } catch (err) {
      console.error('Error approving coordinator:', err);
      showError('שגיאה באישור הרכז');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (pendingId) => {
    setProcessingId(pendingId);
    try {
      // Delete the pending coordinator from Firebase
      await deleteDoc(doc(db, 'user', pendingId));
      
      // Remove from local state
      setPendingCoordinators(prev => prev.filter(p => p.id !== pendingId));
      showSuccess('הבקשה נדחתה והוסרה מהמערכת');
    } catch (err) {
      console.error('Error rejecting coordinator:', err);
      showError('שגיאה בדחיית הבקשה');
    } finally {
      setProcessingId(null);
    }
  };
  const copySignupLink = () => {
    const tempInput = document.createElement('input');
    tempInput.value = coordinatorSignupLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showSuccess('קישור הרשמת רכזים הועתק בהצלחה!');
  };

  if (authLoading || loading) {
    return (
      <div className="coordinator-approval-loading-container">
        <div className="coordinator-approval-loading-content">
          טוען נתונים...
        </div>
      </div>
    );
  }

  if (!currentUser || userRole !== 1) {
    return (
      <div className="coordinator-approval-error-container">
        <div className="coordinator-approval-error-content">
          רק רכזים יכולים לגשת לדף זה.
        </div>
      </div>
    );
  }

  return (
    <div className="coordinator-approval-container">
      <div className="coordinator-approval-content">
        <div className="coordinator-approval-main-card">
          {/* Header Section */}
          <div className="coordinator-approval-header">
            <h1 className="coordinator-approval-title">
              אישור רכזים חדשים
            </h1>
            <div className="coordinator-approval-subtitle">
              ניהול בקשות הצטרפות רכזים למערכת
            </div>
          </div>

          <div className="coordinator-approval-inner-content">
            {/* Signup Link Section */}
            <div className="signup-link-section">
              <div className="signup-link-title">
                קישור הרשמת רכזים חדשים
              </div>
              <button
                onClick={copySignupLink}
                className="signup-link-button"
              >
                📋 העתק קישור הרשמה
              </button>
            </div>            {/* Tab Navigation */}
            <div className="tab-navigation">
              <div className="tab-buttons-container">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`tab-button ${activeTab === 'pending' ? 'active' : 'inactive'}`}
                >
                  רכזים ממתינים לאישור ({pendingCoordinators.length})
                </button>
                <button
                  onClick={() => setActiveTab('existing')}
                  className={`tab-button ${activeTab === 'existing' ? 'active' : 'inactive'}`}
                >
                  רכזים קיימים ({existingCoordinators.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'pending' ? (
              /* Pending Coordinators Section */
              <div className="tab-content-section">
                {pendingCoordinators.length === 0 ? (
                  <div className="empty-state-container">
                    אין רכזים ממתינים לאישור כרגע
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="coordinator-table">
                      <thead className="pending-table-header">
                        <tr>
                          {[
                            'שם פרטי', 'שם משפחה', 'אימייל', 'טלפון', 'עיר', 'תאריך בקשה', 'פעולות'
                          ].map((header) => (
                            <th key={header} className="pending-table-header-cell">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pendingCoordinators.map((coordinator, index) => (
                          <tr
                            key={coordinator.id}
                            className={`pending-table-row ${index % 2 === 0 ? 'even' : 'odd'}`}
                          >
                            <td className="table-cell">{coordinator.firstName}</td>
                            <td className="table-cell">{coordinator.lastName}</td>
                            <td className="table-cell">{coordinator.email}</td>
                            <td className="table-cell">{coordinator.phoneNumber}</td>
                            <td className="table-cell">{coordinator.city}</td>
                            <td className="table-cell">
                              {coordinator.createdAt?.toLocaleDateString('he-IL')}
                            </td>
                            <td className="table-cell">
                              <div className="action-buttons-container">
                                <button
                                  onClick={() => handleApprove(coordinator)}
                                  disabled={processingId === coordinator.id}
                                  className="approve-button"
                                >
                                  {processingId === coordinator.id ? 'מעבד...' : '✅ אשר'}
                                </button>
                                <button
                                  onClick={() => handleReject(coordinator.id)}
                                  disabled={processingId === coordinator.id}
                                  className="reject-button"
                                >
                                  {processingId === coordinator.id ? 'מעבד...' : '❌ דחה'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Existing Coordinators Section */
              <div className="tab-content-section">
                {loadingExisting ? (
                  <div className="loading-existing-container">
                    טוען רכזים קיימים...
                  </div>
                ) : existingCoordinators.length === 0 ? (
                  <div className="empty-state-container">
                    לא נמצאו רכזים קיימים במערכת
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="coordinator-table">
                      <thead className="existing-table-header">
                        <tr>
                          {[
                            'שם פרטי', 'שם משפחה', 'אימייל', 'טלפון', 'עיר', 'תאריך הצטרפות', 'תאריך אישור', 'סטטוס'
                          ].map((header) => (
                            <th key={header} className="existing-table-header-cell">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {existingCoordinators.map((coordinator, index) => (
                          <tr
                            key={coordinator.id}
                            className={`existing-table-row ${index % 2 === 0 ? 'even' : 'odd'}`}
                          >
                            <td className="table-cell">{coordinator.firstName}</td>
                            <td className="table-cell">{coordinator.lastName}</td>
                            <td className="table-cell">{coordinator.email}</td>
                            <td className="table-cell">{coordinator.phoneNumber}</td>
                            <td className="table-cell">{coordinator.city}</td>
                            <td className="table-cell">
                              {coordinator.createdAt?.toLocaleDateString('he-IL')}
                            </td>
                            <td className="table-cell">
                              {coordinator.approvedAt?.toLocaleDateString('he-IL') || 'לא זמין'}
                            </td>
                            <td className="table-cell">
                              <span className={`status-badge ${coordinator.isApproved ? 'approved' : 'pending'}`}>
                                {coordinator.isApproved ? '✅ מאושר' : '⏳ ממתין'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
