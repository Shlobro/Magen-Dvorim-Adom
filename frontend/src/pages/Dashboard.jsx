// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // ודא שנתיב זה נכון להגדרת ה-Firebase שלך בצד הלקוח
import "../styles/HomeScreen.css";

/**
 * דשבורד קריאות – עיצוב זהה לעמוד ניהול מתנדבים
 */
export default function Dashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // מצב חדש לאחסון נתוני מתנדבים לפי ה-UID שלהם
  const [volunteers, setVolunteers] = useState({}); 

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
    const fetchCallsAndVolunteers = async () => {
      try {
        // 1. שליפת כל הקריאות
        const inquiryCollectionRef = collection(db, "inquiry");
        const inquirySnapshot = await getDocs(inquiryCollectionRef);
        const fetchedInquiries = inquirySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Dashboard fetch - שלב 1: קריאות שנשלפו (fetchedInquiries):", fetchedInquiries);

        // 2. שליפת כל המתנדבים (הקולקציה צריכה להיות "user")
        const userCollectionRef = collection(db, "user"); 
        const userSnapshot = await getDocs(userCollectionRef);
        const fetchedVolunteersMap = {};
        userSnapshot.docs.forEach((doc) => {
          fetchedVolunteersMap[doc.id] = doc.data();
        });
        console.log("Dashboard fetch - שלב 2: מתנדבים שנשלפו (fetchedVolunteersMap):", fetchedVolunteersMap);
        setVolunteers(fetchedVolunteersMap);

        // 3. שילוב קריאות עם שמות המתנדבים
        const callsWithVolunteerNames = fetchedInquiries.map((call) => {
          let assignedVolunteer = null;
          let assignedVolunteerId = null;

          // טיפול בשדה 'assignedVolunteers' מ-Firestore
          if (call.assignedVolunteers) {
            if (Array.isArray(call.assignedVolunteers) && call.assignedVolunteers.length > 0) {
              // אם זה מערך ובד"כ יש בו ID אחד
              assignedVolunteerId = call.assignedVolunteers[0];
            } else if (typeof call.assignedVolunteers === 'string') {
              // אם זה ישירות ה-UID ולא מערך
              assignedVolunteerId = call.assignedVolunteers;
            }
          }

          // חפש את פרטי המתנדב במפה
          if (assignedVolunteerId) {
             assignedVolunteer = fetchedVolunteersMap[assignedVolunteerId];
          }
          
          console.log(`Dashboard fetch - שלב 3: עבור קריאה ID: ${call.id}, assignedVolunteerId מ-Firestore: ${assignedVolunteerId}, פרטי מתנדב:`, assignedVolunteer);
          
          return {
            ...call,
            // הוסף את assignedVolunteerName לאובייקט הקריאה
            assignedVolunteerName: assignedVolunteer ? assignedVolunteer.name : 'טרם שובץ',
          };
        });

        console.log("Dashboard fetch - שלב 4: קריאות סופיות עם שמות מתנדבים (callsWithVolunteerNames):", callsWithVolunteerNames);
        setCalls(callsWithVolunteerNames);
      } catch (err) {
        console.error("שגיאה בשליפת נתונים עבור הדשבורד:", err);
        setError("נכשל בטעינת נתוני קריאות.");
      } finally {
        setLoading(false);
      }
    };

    fetchCallsAndVolunteers();
  }, []); // ריצה פעם אחת בעת טעינת הרכיב

  const handleStatusChange = async (callId, newStatus) => {
    try {
      const callRef = doc(db, "inquiry", callId);
      await updateDoc(callRef, { status: newStatus });
      // עדכון ה-state באופן מיידי כדי שהשינוי יראה בדף
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === callId ? { ...call, status: newStatus } : call
        )
      );
      if (newStatus === "הפנייה נסגרה" && !calls.find(c => c.id === callId)?.closureReason) {
         // ניתן אופציונלית להגדיר ברירת מחדל או לבקש סיבת סגירה
      }
    } catch (error) {
      console.error("שגיאה בעדכון סטטוס:", error);
      alert("נכשל בעדכון הסטטוס.");
    }
  };

  const handleClosureChange = async (callId, newClosureReason) => {
    try {
      const callRef = doc(db, "inquiry", callId);
      await updateDoc(callRef, { closureReason: newClosureReason });
      // עדכון ה-state באופן מיידי כדי שהשינוי יראה בדף
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === callId ? { ...call, closureReason: newClosureReason } : call
        )
      );
    } catch (error) {
      console.error("שגיאה בעדכון סיבת סגירה:", error);
      alert("נכשל בעדכון סיבת הסגירה.");
    }
  };

  if (loading) return <div className="loading-message">טוען נתונים...</div>;
  if (error) return <div className="error-message">שגיאה: {error}</div>;

  return (
    <div className="home-page">
      <div className="dashboard-container">
        <h1 className="dashboard-title">לוח מחוונים – קריאות פתוחות וסגורות</h1>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>מס' קריאה</th>
                <th>תאריך פתיחה</th>
                <th>כתובת</th>
                <th>טלפון</th>
                <th>סטטוס</th>
                <th>סיבת סגירה</th>
                <th>מתנדב משובץ</th> {/* כותרת עמודה קיימת */}
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td>{call.id}</td>
                  <td>
                    {call.createdAt
                      ? new Date(call.createdAt).toLocaleString("he-IL")
                      : "אין מידע"}
                  </td>
                  <td>
                    {call.address}, {call.city}
                  </td>
                  <td>{call.phoneNumber}</td>
                  <td>
                    <div style={{ position: "relative" }}>
                      <select
                        value={call.status || ""}
                        onChange={(e) =>
                          handleStatusChange(call.id, e.target.value)
                        }
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          width: "100%",
                        }}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div style={{ position: "relative" }}>
                      {call.status === "הפנייה נסגרה" && (
                        <select
                          value={call.closureReason || ""}
                          onChange={(e) =>
                            handleClosureChange(call.id, e.target.value)
                          }
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            width: "100%",
                          }}
                        >
                          <option value="">בחר סיבת סגירה...</option>
                          {closureOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  {/* *** זהו החלק שתוקן להצגת שם המתנדב המשובץ *** */}
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    {call.assignedVolunteerName} {/* הצג את שם המתנדב המשובץ */}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    {/* כאן ניתן להוסיף כפתורי פעולה נוספים בעתיד */}
                    אין פעולות כרגע
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td
                    // ודא ש-colSpan תואם למספר העמודות בפועל (8 במקרה זה)
                    colSpan="8" 
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