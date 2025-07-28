import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import '../styles/HomeScreen.css';
import { fetchVolunteerInquiries, updateInquiryStatus } from '../services/inquiryApi';

export default function VolunteerDashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole, loading: authLoading } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  // Filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const statusOptions = [
    'לפנייה שובץ מתנדב',
    'הטיפול בנחיל הסתיים',
    'הפנייה נסגרה',
  ];

  const closureOptions = [
    'נפתר עצמאית',
    'לא ניתן לטפל',
    'מיקום לא נגיש',
    'מתנדב לא הגיע',
    'אחר',
  ];

  // Fetch inquiries assigned to this volunteer
  useEffect(() => {
    const fetchInquiries = async () => {      if (authLoading || !currentUser) {
        if (!authLoading && !currentUser) {
          showError('יש להתחבר כדי לצפות בלוח המחוונים.');
        }
        setLoading(false);
        return;
      }

      if (userRole !== 2) {
        showError('גישה מוגבלת למתנדבים בלבד.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedInquiries = await fetchVolunteerInquiries(currentUser.uid);
        setInquiries(fetchedInquiries);
        setLoading(false);      } catch (err) {
        console.error('Error fetching volunteer inquiries:', err);
        showError('שגיאה בטעינת הפניות.');
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchInquiries();
    }
  }, [currentUser, userRole, authLoading]);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      let match = true;

      if (filterStatus && inquiry.status !== filterStatus) {
        match = false;
      }

      if ((filterStartDate || filterEndDate) && match) {
        let inquiryDate = null;
        if (inquiry.timestamp) {
          if (typeof inquiry.timestamp?.toDate === 'function') {
            inquiryDate = inquiry.timestamp.toDate();
          } else if (typeof inquiry.timestamp === 'string' || inquiry.timestamp instanceof Date) {
            inquiryDate = new Date(inquiry.timestamp);
          }
        }

        let fallbackDate = null;
        if (!inquiryDate && inquiry.date && inquiry.time) {
          try {
            const [day, month, year] = inquiry.date.split('.').map(Number);
            const [hours, minutes] = inquiry.time.split(':').map(Number);
            fallbackDate = new Date(year, month - 1, day, hours, minutes);
          } catch (e) {
            console.warn("Could not parse date/time strings for filtering:", inquiry.date, inquiry.time, e);
          }
        }

        const effectiveDate = inquiryDate || fallbackDate;
        if (!effectiveDate) return false;

        const start = filterStartDate ? new Date(filterStartDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = filterEndDate ? new Date(filterEndDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && effectiveDate < start) match = false;
        if (end && effectiveDate > end) match = false;
      }

      return match;
    });
  }, [inquiries, filterStatus, filterStartDate, filterEndDate]);

  // Paginated data
  const paginatedInquiries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInquiries.slice(startIndex, endIndex);
  }, [filteredInquiries, currentPage, itemsPerPage]);

  // Total pages calculation
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterStartDate, filterEndDate]);

  // Handle status update
  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      await updateInquiryStatus(inquiryId, newStatus);
      setInquiries(prevInquiries =>
        prevInquiries.map(inquiry =>
          inquiry.id === inquiryId
            ? { ...inquiry, status: newStatus }
            : inquiry
        )      );
      showSuccess('סטטוס עודכן בהצלחה!');
    } catch (error) {
      console.error('Error updating status:', error);
      showError('שגיאה בעדכון סטטוס.');
    }
  };

  // Handle closure reason update
  const handleClosureChange = async (inquiryId, closureReason) => {
    try {
      await updateInquiryStatus(inquiryId, 'הפנייה נסגרה', closureReason);
      setInquiries(prevInquiries =>
        prevInquiries.map(inquiry =>
          inquiry.id === inquiryId
            ? { ...inquiry, status: 'הפנייה נסגרה', closureReason }
            : inquiry
        )      );
      showSuccess('סיבת סגירה עודכנה בהצלחה!');
    } catch (error) {
      console.error('Error updating closure reason:', error);
      showError('שגיאה בעדכון סיבת סגירה.');
    }
  };

  // Loading state
  if (authLoading || loading) return (
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
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'      }}>
        טוען נתונים...
      </div>
    </div>
  );

  // Not authenticated state
  if (!currentUser) return (
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
        אנא התחבר כדי לגשת ללוח המחוונים.
      </div>
    </div>
  );

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
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
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
              לוח מחוונים למתנדבים
            </h1>
            <div style={{
              fontSize: '1.1em',
              opacity: '0.9',
              fontWeight: '400'
            }}>
              הפניות שהוקצו לך
            </div>
            <div style={{
              marginTop: '15px',
              fontSize: '1em',
              opacity: '0.8'
            }}>
              סה"כ פניות: {inquiries.length}
            </div>
          </div>

          <div style={{ padding: '30px' }}>
            {/* Filters Section */}
            <div style={{
              marginBottom: '30px',
              padding: '30px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                margin: '0 0 25px 0',
                color: '#495057',
                fontSize: '1.3em',
                fontWeight: '600',
                textAlign: 'right'
              }}>
                🔍 סינון פניות
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                direction: 'rtl'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '0.95em'
                  }}>
                    פילטר סטטוס:
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      fontSize: '1em',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#28a745'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  >
                    <option value="">כל הסטטוסים</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '0.95em'
                  }}>
                    מתאריך:
                  </label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    style={{
                      width: '85%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      fontSize: '1em',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#28a745'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '0.95em'
                  }}>
                    עד תאריך:
                  </label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    style={{
                      width: '85%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      fontSize: '1em',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#28a745'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  />
                </div>
              </div>
            </div>

            {/* Inquiries Cards */}
            <div style={{ marginBottom: '30px' }}>
              {paginatedInquiries.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gap: '20px'
                }}>
                  {paginatedInquiries.map((inquiry) => {
                    // Format date
                    let dateString = `${inquiry.date} ${inquiry.time}`;
                    if (inquiry.timestamp) {
                      if (typeof inquiry.timestamp?.toDate === 'function') {
                        dateString = inquiry.timestamp.toDate().toLocaleString('he-IL');
                      } else if (typeof inquiry.timestamp === 'string' || inquiry.timestamp instanceof Date) {
                        dateString = new Date(inquiry.timestamp).toLocaleString('he-IL');
                      }
                    }

                    // Status color
                    const getStatusColor = (status) => {
                      switch (status) {
                        case 'לפנייה שובץ מתנדב': return '#007bff';
                        case 'הטיפול בנחיל הסתיים': return '#28a745';
                        case 'הפנייה נסגרה': return '#6c757d';
                        default: return '#17a2b8';
                      }
                    };

                    return (
                      <div
                        key={inquiry.id}
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          padding: '25px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                          border: '1px solid #e9ecef',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                        }}
                      >
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '20px',
                          direction: 'rtl'
                        }}>
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1em' }}>👤 פרטי הפונה</h4>
                            <p style={{ margin: '0', color: '#666' }}><strong>שם:</strong> {inquiry.fullName}</p>
                            <p style={{ margin: '0', color: '#666' }}><strong>טלפון:</strong> {inquiry.phoneNumber}</p>
                          </div>
                          
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1em' }}>📍 מיקום</h4>
                            <p style={{ margin: '0', color: '#666' }}><strong>עיר:</strong> {inquiry.city || '-'}</p>
                            <p style={{ margin: '0', color: '#666' }}><strong>כתובת:</strong> {inquiry.address}</p>
                          </div>
                          
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1em' }}>📅 תאריך ושעה</h4>
                            <p style={{ margin: '0', color: '#666' }}>{dateString}</p>
                          </div>
                            <div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1em' }}>📊 עדכון סטטוס</h4>
                            <select
                              value={inquiry.status || ''}
                              onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '2px solid #e9ecef',
                                fontSize: '0.9em',
                                background: 'white',
                                cursor: 'pointer',
                                fontWeight: '500',
                                color: getStatusColor(inquiry.status)
                              }}
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                          {inquiry.additionalDetails && (
                          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1em' }}>📝 פרטים נוספים</h4>
                            <p style={{ margin: '0', color: '#666', lineHeight: '1.5' }}>{inquiry.additionalDetails}</p>
                          </div>
                        )}
                        
                        {inquiry.status === 'הפנייה נסגרה' && (
                          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.1em' }}>🔒 סיבת סגירה</h4>
                            <select
                              value={inquiry.closureReason || ''}
                              onChange={(e) => handleClosureChange(inquiry.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                border: '2px solid #e9ecef',
                                fontSize: '1em',
                                background: 'white',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              <option value="">בחר סיבת סגירה</option>
                              {closureOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            {inquiry.closureReason && (
                              <p style={{ 
                                margin: '10px 0 0 0', 
                                color: '#666', 
                                fontSize: '0.9em',
                                fontStyle: 'italic'
                              }}>
                                סיבת סגירה נוכחית: {inquiry.closureReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#666',
                  fontSize: '1.2em'
                }}>
                  <div style={{ fontSize: '3em', marginBottom: '20px' }}>🐝</div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>אין פניות להצגה</h3>
                  <p style={{ margin: '0', opacity: '0.8' }}>
                    {inquiries.length === 0 
                      ? 'עדיין לא הוקצו לך פניות'
                      : 'לא נמצאו פניות שמתאימות לקריטריונים שנבחרו'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredInquiries.length > itemsPerPage && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '15px',
                marginTop: '30px',
                padding: '25px',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? '#e9ecef' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: currentPage === 1 ? '#6c757d' : 'white',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '1em',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  הקודם →
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '1.1em',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  <span>עמוד {currentPage} מתוך {totalPages}</span>
                  <span style={{ color: '#6c757d', fontSize: '0.9em' }}>
                    (מציג {paginatedInquiries.length} מתוך {filteredInquiries.length} פניות)
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    background: currentPage === totalPages ? '#e9ecef' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: currentPage === totalPages ? '#6c757d' : 'white',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '1em',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ← הבא
                </button>
              </div>
            )}

            {/* Footer Section */}
            <footer style={{
              marginTop: '40px',
              paddingTop: '25px',
              borderTop: '1px solid #e0e0e0',
              textAlign: 'center',
              color: '#777',
              fontSize: '0.9em'
            }}>
              © 2025 מגן דבורים אדום. כל הזכויות שמורות.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
