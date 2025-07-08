import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { userService } from '../services/firebaseService';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
            approvedAt: convertFirestoreDate(data.approvedAt || data.createdAt)
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
      fetchExistingCoordinators(); // Refresh the existing coordinators list
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontSize: '1.1em',
        color: '#666'
      }}>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          טוען נתונים...
        </div>
      </div>
    );  }

  if (!currentUser || userRole !== 1) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#fff5f5',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #fed7d7',
          color: '#e53e3e'
        }}>
          רק רכזים יכולים לגשת לדף זה.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Header Section */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '40px 30px',
            textAlign: 'center'
          }}>
            <h1 style={{
              margin: '0 0 10px 0',
              fontSize: '2.5em',
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              אישור רכזים חדשים
            </h1>
            <div style={{
              fontSize: '1.1em',
              opacity: '0.9',
              fontWeight: '400'
            }}>
              ניהול בקשות הצטרפות רכזים למערכת
            </div>
          </div>

          <div style={{ padding: '30px' }}>
            {/* Signup Link Section */}
            <div style={{
              marginBottom: '40px',
              textAlign: 'center',
              padding: '25px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '12px',
              border: '1px solid #e1f5fe'
            }}>
              <div style={{
                marginBottom: '20px',
                fontSize: '1.1em',
                color: '#1565c0',
                fontWeight: '600'
              }}>
                קישור הרשמת רכזים חדשים
              </div>
              <button
                onClick={copySignupLink}
                style={{
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  color: 'white',
                  padding: '15px 30px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1em',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,123,255,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,123,255,0.3)';
                }}
              >
                📋 העתק קישור הרשמה
              </button>
            </div>            {/* Tab Navigation */}
            <div style={{
              marginBottom: '30px',
              borderBottom: '2px solid #e9ecef'
            }}>
              <div style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setActiveTab('pending')}
                  style={{
                    padding: '15px 30px',
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    fontSize: '1.1em',
                    fontWeight: '600',
                    background: activeTab === 'pending' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                    color: activeTab === 'pending' ? 'white' : '#495057',
                    transition: 'all 0.3s ease',
                    transform: activeTab === 'pending' ? 'translateY(2px)' : 'translateY(0)'
                  }}
                >
                  רכזים ממתינים לאישור ({pendingCoordinators.length})
                </button>
                <button
                  onClick={() => setActiveTab('existing')}
                  style={{
                    padding: '15px 30px',
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    fontSize: '1.1em',
                    fontWeight: '600',
                    background: activeTab === 'existing' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                    color: activeTab === 'existing' ? 'white' : '#495057',
                    transition: 'all 0.3s ease',
                    transform: activeTab === 'existing' ? 'translateY(2px)' : 'translateY(0)'
                  }}
                >
                  רכזים קיימים ({existingCoordinators.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'pending' ? (
              /* Pending Coordinators Section */
              <div style={{ marginBottom: '30px' }}>
                {pendingCoordinators.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    fontSize: '1.1em',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #e9ecef'
                  }}>
                    אין רכזים ממתינים לאישור כרגע
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'separate',
                      borderSpacing: '0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      direction: 'rtl'
                    }}>
                      <thead>
                        <tr style={{ background: '#f0f4f7' }}>
                          {[
                            'שם פרטי', 'שם משפחה', 'אימייל', 'טלפון', 'עיר', 'תאריך בקשה', 'פעולות'
                          ].map((header) => (
                            <th
                              key={header}
                              style={{
                                padding: '15px 20px',
                                textAlign: 'right',
                                borderBottom: '2px solid #dae1e8',
                                fontWeight: '700',
                                color: '#34495e',
                                backgroundColor: '#eef4f9'
                              }}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pendingCoordinators.map((coordinator, index) => (
                          <tr
                            key={coordinator.id}
                            style={{
                              borderBottom: '1px solid #eceff1',
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fcfd',
                              transition: 'background-color 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fcfd'}
                          >
                            <td style={{ padding: '15px 20px' }}>{coordinator.firstName}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.lastName}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.email}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.phoneNumber}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.city}</td>
                            <td style={{ padding: '15px 20px' }}>
                              {coordinator.createdAt?.toLocaleDateString('he-IL')}
                            </td>
                            <td style={{ padding: '15px 20px' }}>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleApprove(coordinator)}
                                  disabled={processingId === coordinator.id}
                                  style={{
                                    background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processingId === coordinator.id ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: '600',
                                    opacity: processingId === coordinator.id ? 0.6 : 1,
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseOver={(e) => {
                                    if (processingId !== coordinator.id) {
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(40,167,69,0.3)';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  {processingId === coordinator.id ? 'מעבד...' : '✅ אשר'}
                                </button>
                                <button
                                  onClick={() => handleReject(coordinator.id)}
                                  disabled={processingId === coordinator.id}
                                  style={{
                                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processingId === coordinator.id ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: '600',
                                    opacity: processingId === coordinator.id ? 0.6 : 1,
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseOver={(e) => {
                                    if (processingId !== coordinator.id) {
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(220,53,69,0.3)';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
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
              <div style={{ marginBottom: '30px' }}>
                {loadingExisting ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    fontSize: '1.1em',
                    background: '#f8f9fa',
                    borderRadius: '12px'
                  }}>
                    טוען רכזים קיימים...
                  </div>
                ) : existingCoordinators.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    fontSize: '1.1em',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #e9ecef'
                  }}>
                    לא נמצאו רכזים קיימים במערכת
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'separate',
                      borderSpacing: '0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      direction: 'rtl'
                    }}>
                      <thead>
                        <tr style={{ background: '#e8f5e8' }}>
                          {[
                            'שם פרטי', 'שם משפחה', 'אימייל', 'טלפון', 'עיר', 'תאריך הצטרפות', 'תאריך אישור', 'סטטוס'
                          ].map((header) => (
                            <th
                              key={header}
                              style={{
                                padding: '15px 20px',
                                textAlign: 'right',
                                borderBottom: '2px solid #c8e6c9',
                                fontWeight: '700',
                                color: '#2e7d32',
                                backgroundColor: '#e8f5e8'
                              }}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {existingCoordinators.map((coordinator, index) => (
                          <tr
                            key={coordinator.id}
                            style={{
                              borderBottom: '1px solid #eceff1',
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fff9',
                              transition: 'background-color 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e8f5e8'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fff9'}
                          >
                            <td style={{ padding: '15px 20px' }}>{coordinator.firstName}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.lastName}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.email}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.phoneNumber}</td>
                            <td style={{ padding: '15px 20px' }}>{coordinator.city}</td>
                            <td style={{ padding: '15px 20px' }}>
                              {coordinator.createdAt?.toLocaleDateString('he-IL')}
                            </td>
                            <td style={{ padding: '15px 20px' }}>
                              {coordinator.approvedAt?.toLocaleDateString('he-IL') || 'לא זמין'}
                            </td>
                            <td style={{ padding: '15px 20px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.9em',
                                fontWeight: '600',
                                background: coordinator.isApproved ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#ffc107',
                                color: 'white'
                              }}>
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
