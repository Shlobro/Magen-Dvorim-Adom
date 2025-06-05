// frontend/src/pages/Dashboard.jsx
import React, { useState } from "react";
import '../styles/HomeScreen.css';

/**
 * דשבורד קריאות – עיצוב זהה לעמוד ניהול מתנדבים
 */
export default function Dashboard() {
  // נתוני דוגמה
  const [calls, setCalls] = useState([
    {
      id: 1,
      date: "12/06/2025",
      time: "14:05",
      city: "תל-אביב",
      address: "רוטשילד 12",
      description: "נחיל גדול על עץ בחצר",
      handler: "יוסי כהן",
      status: "לפנייה שובץ מתנדב",
      closureReason: null,
    },
    {
      id: 2,
      date: "12/06/2025",
      time: "15:20",
      city: "ירושלים",
      address: "יפו 221",
      description: "דבורים בכניסה לבניין משרדים",
      handler: "—",
      status: "נפתחה פנייה (טופס מולא)",
      closureReason: null,
    },
  ]);

  const statusOptions = [
    "נשלח קישור אך לא מולא טופס",
    "נפתחה פנייה (טופס מולא)",
    "לא נבחר עדיין מתנדב",
    "לפנייה שובץ מתנדב",
    "פנייה נסגרה ע\"י מתנדב"
  ];

  const closureOptions = [
    "הנחיל הושאר במקומו",
    "הנחיל הוצל ונלקח ע\"י מתנדב",
    "הנחיל הוצל והועבר לחוות חופש"
  ];

  const handleStatusChange = (callId, newStatus) => {
    setCalls(prevCalls => 
      prevCalls.map(call => 
        call.id === callId 
          ? { ...call, status: newStatus, closureReason: newStatus !== "פנייה נסגרה ע\"י מתנדב" ? null : call.closureReason }
          : call
      )
    );
  };

  const handleClosureReasonChange = (callId, reason) => {
    setCalls(prevCalls => 
      prevCalls.map(call => 
        call.id === callId 
          ? { ...call, closureReason: reason }
          : call
      )
    );
  };

  return (
    <div className="home-page">
      <div style={{ padding: '40px 20px', minHeight: '100vh' }}>
        {/* כותרת */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#2c3e50',
            margin: '0'
          }}>
            דשבורד קריאות
          </h1>
          
          {/* סטטיסטיקות */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ 
              backgroundColor: '#e8f5e8', 
              padding: '10px 20px', 
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{ fontSize: '12px', color: '#666' }}>פעילים</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c5530' }}>0</div>
            </div>
            <div style={{ 
              backgroundColor: '#e8f5e8', 
              padding: '10px 20px', 
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{ fontSize: '12px', color: '#666' }}>מתנדבים</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c5530' }}>0</div>
            </div>
          </div>
        </div>

        {/* פילטרים */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '25px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <select style={{ 
            padding: '8px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            backgroundColor: 'white',
            minWidth: '120px'
          }}>
            <option>כל הרמות</option>
          </select>
          <select style={{ 
            padding: '8px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            backgroundColor: 'white',
            minWidth: '120px'
          }}>
            <option>כל המתנדבים</option>
          </select>
          <select style={{ 
            padding: '8px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            backgroundColor: 'white',
            minWidth: '120px'
          }}>
            <option>כל התפקידים</option>
          </select>
          <input 
            type="text" 
            placeholder="חיפוש לפי שם או אזור..."
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              flex: '1',
              minWidth: '200px',
              marginRight: 'auto'
            }}
          />
        </div>

        {/* טבלת קריאות */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            textAlign: 'right',
            fontSize: '14px'
          }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ 
                  padding: '15px 20px', 
                  fontWeight: '600',
                  borderBottom: '1px solid #e9ecef',
                  whiteSpace: 'nowrap'
                }}>תאריך</th>
                <th style={{ 
                  padding: '15px 20px', 
                  fontWeight: '600',
                  borderBottom: '1px solid #e9ecef',
                  whiteSpace: 'nowrap'
                }}>שעה</th>
                <th style={{ 
                  padding: '15px 20px', 
                  fontWeight: '600',
                  borderBottom: '1px solid #e9ecef',
                  whiteSpace: 'nowrap'
                }}>עיר</th>
                <th style={{ 
                  padding: '15px 20px', 
                  fontWeight: '600',
                  borderBottom: '1px solid #e9ecef',
                  whiteSpace: 'nowrap'
                }}>כתובת</th>
                <th style={{ 
                  padding: '15px 20px', 
                  fontWeight: '600',
                  borderBottom: '1px solid #e9ecef',
                  whiteSpace: 'nowrap'
                }}>תיאור</th>
                <th style={{ 
                  padding: '15px 20px', 
                  fontWeight: '600',
                  borderBottom: '1px solid #e9ecef',
                  whiteSpace: 'nowrap'
                }}>מי מטפל</th>
                <th style={{ 
                  padding: '15px 20px', 
                  fontWeight: '600',
                  borderBottom: '1px solid #e9ecef',
                  whiteSpace: 'nowrap'
                }}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c, index) => (
                <tr key={c.id} style={{ 
                  borderBottom: index < calls.length - 1 ? '1px solid #f1f3f4' : 'none',
                  transition: 'background-color 0.2s'
                }}>
                  <td style={{ 
                    padding: '15px 20px',
                    color: '#2c3e50'
                  }}>{c.date}</td>
                  <td style={{ 
                    padding: '15px 20px',
                    color: '#666'
                  }}>{c.time}</td>
                  <td style={{ 
                    padding: '15px 20px',
                    color: '#666'
                  }}>{c.city}</td>
                  <td style={{ 
                    padding: '15px 20px',
                    color: '#666'
                  }}>{c.address}</td>
                  <td style={{ 
                    padding: '15px 20px',
                    color: '#666'
                  }}>{c.description}</td>
                  <td style={{ 
                    padding: '15px 20px',
                    color: '#666'
                  }}>{c.handler}</td>
                  <td style={{ 
                    padding: '15px 20px'
                  }}>
                    <div>
                      <select 
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '12px',
                          backgroundColor: 'white',
                          minWidth: '200px',
                          marginBottom: c.status === "פנייה נסגרה ע\"י מתנדב" ? '8px' : '0'
                        }}
                      >
                        {statusOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      
                      {c.status === "פנייה נסגרה ע\"י מתנדב" && (
                        <select 
                          value={c.closureReason || ""}
                          onChange={(e) => handleClosureReasonChange(c.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '12px',
                            backgroundColor: '#f8f9fa',
                            minWidth: '200px',
                            display: 'block'
                          }}
                        >
                          <option value="">בחר סיבת סגירה...</option>
                          {closureOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ 
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#999',
                    fontStyle: 'italic'
                  }}>
                    אין נתונים להצגה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="footer" style={{ marginTop: '40px' }}>
          © 2025 מגן דבורים אדום. כל הזכויות שמורות.
        </footer>
      </div>
    </div>
  );
}