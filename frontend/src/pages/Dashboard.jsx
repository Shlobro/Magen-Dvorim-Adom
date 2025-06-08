// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import '../styles/HomeScreen.css';

export default function Dashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const statusOptions = [
    'נשלח קישור אך לא מולא טופס',
    'נפתחה פנייה (טופס מולא)',
    'לפנייה שובץ מתנדב',
    'הטיפול בנחיל הסתיים',
    'הפנייה נסגרה',
  ];

  const closureOptions = [
    'הנחיל הושאר במקומו',
    'הנחיל הוצל ונלקח ע"י מתנדב',
    'הנחיל הוצל והועבר לחוות חופש',
  ];

  // ───────────────────────────────── fetch once
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        // 1. get all inquiries
        const inquirySnap = await getDocs(collection(db, 'inquiry'));
        const fetched = inquirySnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 2. collect volunteer UIDs we need to resolve to names
        const uids = Array.from(
          new Set(
            fetched
              .map((c) => c.assignedVolunteers)
              .filter((v) => typeof v === 'string' && v.trim() !== '')
          )
        );

        // 3. fetch volunteers in parallel (one-by-one; good enough for small sets)
        const uidToName = {};
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, 'user', uid));
              if (snap.exists()) {
                const d = snap.data();
                uidToName[uid] = d.name || `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
              }
            } catch { /* ignore */ }
          })
        );

        // 4. merge names into calls
        const withNames = fetched.map((c) => ({
          ...c,
          assignedVolunteerName: uidToName[c.assignedVolunteers] ?? '-',
        }));

        setCalls(withNames);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching calls:', err);
        setError('Failed to fetch calls.');
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  // ───────────────────────────── status / closure handlers
  const handleStatusChange = async (callId, newStatus) => {
    try {
      await updateDoc(doc(db, 'inquiry', callId), { status: newStatus });
      setCalls((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, status: newStatus } : c))
      );
      alert('סטטוס עודכן בהצלחה!');
    } catch (err) {
      console.error(err);
      alert('נכשל בעדכון סטטוס.');
    }
  };

  const handleClosureChange = async (callId, newClosureReason) => {
    try {
      await updateDoc(doc(db, 'inquiry', callId), { closureReason: newClosureReason });
      setCalls((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, closureReason: newClosureReason } : c))
      );
      alert('סיבת סגירה עודכנה בהצלחה!');
    } catch (err) {
      console.error(err);
      alert('נכשל בעדכון סיבת סגירה.');
    }
  };

  const handleAssignVolunteerClick = (inquiryId) => {
    navigate(`/volunteer-map?inquiryId=${inquiryId}`);
  };

  // ───────────────────────────── ui
  if (loading) return <div className="loading">טוען קריאות...</div>;
  if (error) return <div className="error">שגיאה: {error}</div>;

  return (
    <div className="dashboard-container" style={{ padding: 20 }}>
      <div className="dashboard-card" style={{ maxWidth: 1200, margin: 'auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 30, color: '#333' }}>
          ניהול קריאות נחילים
        </h1>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                {[
                  // Removed 'UID' from here
                  'שם מלא',
                  'טלפון',
                  'כתובת',
                  'הערות',
                  'תאריך דיווח',
                  'סטטוס',
                  'סיבת סגירה',
                  'מתנדב משובץ',
                  'פעולות',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 20px',
                      textAlign: 'right',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {calls.map((call) => (
                <tr key={call.id} style={{ borderBottom: '1px solid #eee' }}>
                  {/* Removed the <td> for call.id (UID) */}
                  <td style={{ padding: '10px 20px' }}>{call.fullName}</td>
                  <td style={{ padding: '10px 20px' }}>{call.phoneNumber}</td>
                  <td style={{ padding: '10px 20px' }}>{call.address}</td>
                  <td style={{ padding: '10px 20px' }}>{call.notes}</td>
                  <td style={{ padding: '10px 20px' }}>
                    {call.timestamp?.toDate().toLocaleString()}
                  </td>

                  {/* status select */}
                  <td style={{ padding: '10px 20px' }}>
                    <select
                      value={call.status || ''}
                      onChange={(e) => handleStatusChange(call.id, e.target.value)}
                      style={{ padding: 8, borderRadius: 5, minWidth: 180 }}
                    >
                      {statusOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* closure select (only when closed) */}
                  <td style={{ padding: '10px 20px' }}>
                    {call.status === 'הפנייה נסגרה' && (
                      <select
                        value={call.closureReason || ''}
                        onChange={(e) =>
                          handleClosureChange(call.id, e.target.value)
                        }
                        style={{ padding: 8, borderRadius: 5, minWidth: 180 }}
                      >
                        <option value="">בחר סיבה</option>
                        {closureOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* assigned volunteer name */}
                  <td style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                    {call.assignedVolunteerName}
                  </td>

                  {/* actions */}
                  <td style={{ padding: '10px 20px' }}>
                    {call.status === 'נפתחה פנייה (טופס מולא)' ? (
                      <button
                        onClick={() => handleAssignVolunteerClick(call.id)}
                        style={{
                          backgroundColor: '#28a745',
                          color: '#fff',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: 5,
                          cursor: 'pointer',
                        }}
                      >
                        שבץ מתנדב
                      </button>
                    ) : (
                      <span>אין פעולות זמינות</span>
                    )}
                  </td>
                </tr>
              ))}

              {calls.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#999' }}> {/* Updated colSpan */}
                    אין נתונים להצגה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="footer" style={{ marginTop: 40 }}>
          © 2025 מגן דבורים אדום. כל הזכויות שמורות.
        </footer>
      </div>
    </div>
  );
}