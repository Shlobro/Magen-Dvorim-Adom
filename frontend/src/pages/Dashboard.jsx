// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom"; // ייבוא useNavigate
import "../styles/HomeScreen.css"; // נראה שזה סגנונות כלליים, אולי כדאי לשקול לשנות את שם הקובץ ל-Dashboard.css בעתיד.

/**
 * דשבורד קריאות – עיצוב זהה לעמוד ניהול מתנדבים
 */
export default function Dashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // אתחול useNavigate

  const statusOptions = [
    "נשלח קישור אך לא מולא טופס",
    "נפתחה פנייה (טופס מולא)",
    "לפנייה שובץ מתנדב",
    "המתנדב בדרך",
    "הטיפול בנחיל הסתיים",
    "הפנייה נסגרה",
  ];

  const closureOptions = [
    "נפתר עצמאית",
    "לא ניתן לטפל",
    "מיקום לא נגיש",
    "מתנדב לא הגיע",
    "אחר",
  ];

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const inquiryCollectionRef = collection(db, "inquiry");
        const querySnapshot = await getDocs(inquiryCollectionRef);
        const fetchedCalls = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCalls(fetchedCalls);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching calls:", err);
        setError("Failed to fetch calls.");
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const handleStatusChange = async (callId, newStatus) => {
    try {
      const callRef = doc(db, "inquiry", callId);
      await updateDoc(callRef, { status: newStatus });
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === callId ? { ...call, status: newStatus } : call
        )
      );
      alert("סטטוס עודכן בהצלחה!");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("נכשל בעדכון סטטוס.");
    }
  };

  const handleClosureChange = async (callId, newClosureReason) => {
    try {
      const callRef = doc(db, "inquiry", callId);
      await updateDoc(callRef, { closureReason: newClosureReason });
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === callId ? { ...call, closureReason: newClosureReason } : call
        )
      );
      alert("סיבת סגירה עודכנה בהצלחה!");
    } catch (err) {
      console.error("Error updating closure reason:", err);
      alert("נכשל בעדכון סיבת סגירה.");
    }
  };

  // פונקציה לטיפול בלחיצה על כפתור "שבץ מתנדב"
  const handleAssignVolunteerClick = (inquiryId) => {
    // נווט לדף המפה והעבר את ה-inquiryId כפרמטר ב-URL
    navigate(`/volunteer-map?inquiryId=${inquiryId}`);
  };

  if (loading) {
    return <div className="loading">טוען קריאות...</div>;
  }

  if (error) {
    return <div className="error">שגיאה: {error}</div>;
  }

  return (
    <div className="dashboard-container" style={{ padding: "20px" }}>
      <div className="dashboard-card" style={{ maxWidth: "1200px", margin: "auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
          ניהול קריאות נחילים
        </h1>

        <div className="table-responsive" style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  UID
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  שם מלא
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  טלפון
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  כתובת
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  הערות
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  תאריך דיווח
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  סטטוס
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  סיבת סגירה
                </th>
                <th
                  style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #ddd" }}
                >
                  פעולות
                </th> {/* הוספנו כותרת לטור הפעולות */}
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px 20px", fontSize: "12px", color: "#666" }}>
                    {call.id}
                  </td>
                  <td style={{ padding: "10px 20px", fontSize: "14px", color: "#333" }}>
                    {call.fullName}
                  </td>
                  <td style={{ padding: "10px 20px", fontSize: "14px", color: "#333" }}>
                    {call.phoneNumber}
                  </td>
                  <td style={{ padding: "10px 20px", fontSize: "14px", color: "#333" }}>
                    {call.address}
                  </td>
                  <td style={{ padding: "10px 20px", fontSize: "14px", color: "#333" }}>
                    {call.notes}
                  </td>
                  <td style={{ padding: "10px 20px", fontSize: "14px", color: "#333" }}>
                    {call.timestamp?.toDate().toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 20px", fontSize: "13px", color: "#333" }}>
                    <select
                      value={call.status || ""}
                      onChange={(e) => handleStatusChange(call.id, e.target.value)}
                      style={{
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        minWidth: "180px",
                      }}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "10px 20px", fontSize: "13px", color: "#333" }}>
                    {/* הצג תיבת בחירה לסיבת סגירה רק אם הסטטוס הוא "הפנייה נסגרה" */}
                    {call.status === "הפנייה נסגרה" && (
                      <select
                        value={call.closureReason || ""}
                        onChange={(e) => handleClosureChange(call.id, e.target.value)}
                        style={{
                          padding: "8px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          minWidth: "180px",
                        }}
                      >
                        <option value="">בחר סיבה</option>
                        {closureOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    {/* הכפתור החדש */}
                    {call.status === "נפתחה פנייה (טופס מולא)" && ( // הצג כפתור רק לסטטוס זה
                      <button
                        onClick={() => handleAssignVolunteerClick(call.id)}
                        style={{
                          backgroundColor: '#28a745', // ירוק
                          color: 'white',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap', // מונע שבירת שורה בכפתור
                        }}
                      >
                        שבץ מתנדב
                      </button>
                    )}
                    {call.status !== "נפתחה פנייה (טופס מולא)" && ( // הוסף טקסט חלופי אם אין כפתור
                      <span>אין פעולות זמינות</span>
                    )}
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td
                    colSpan="9" // Updated colspan to 9 (was 7 + 2 more for status/closure + actions)
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#999",
                      fontStyle: "italic",
                    }}
                  >
                    אין נתונים להצגה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="footer" style={{ marginTop: "40px" }}>
          © 2025 מגן דבורים אדום. כל הזכויות שמורות.
        </footer>
      </div>
    </div>
  );
}