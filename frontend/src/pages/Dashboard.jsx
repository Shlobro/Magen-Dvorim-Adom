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
        const userCollectionRef = collection(db, "user");
        const userToInquiryCollectionRef = collection(db, "userToInquiry");

        const inquirySnapshot = await getDocs(inquiryCollectionRef);
        const userSnapshot = await getDocs(userCollectionRef);
        const userToInquirySnapshot = await getDocs(
          userToInquiryCollectionRef
        );

        const inquiries = inquirySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const users = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const userToInquiries = userToInquirySnapshot.docs.map((doc) =>
          doc.data()
        );

        const formattedCalls = inquiries.map((inquiry) => {
          // מציאת המתנדב המשויך
          const link = userToInquiries.find(
            (link) => link.inquiryID === inquiry.id
          );
          const handlerUser = link
            ? users.find((user) => user.id === link.userID)
            : null;
          const handlerName = handlerUser ? handlerUser.name : "—";

          // פורמט תאריך ושעה
          const date = inquiry.date
            ? new Date(inquiry.date).toLocaleDateString("he-IL")
            : "תאריך לא ידוע";
          const time = inquiry.time || "שעה לא ידועה";

          return {
            id: inquiry.id,
            date: date,
            time: time,
            city: inquiry.city || "לא ידוע",
            address: inquiry.address || "לא ידוע",
            description: inquiry.description || "אין תיאור",
            handler: handlerName,
            status: inquiry.status || "נפתחה פנייה (טופס מולא)", // סטטוס ברירת מחדל
            closureReason: inquiry.closureReason || null,
          };
        });
        setCalls(formattedCalls);
      } catch (err) {
        console.error("Error fetching calls:", err);
        setError("Error loading calls. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []); // הרצה פעם אחת בטעינת הקומפוננטה

  const handleStatusChange = async (id, newStatus) => {
    try {
      const callRef = doc(db, "inquiry", id);
      await updateDoc(callRef, { status: newStatus });

      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === id ? { ...call, status: newStatus } : call
        )
      );
    } catch (err) {
      console.error(`Error updating status for call ${id}:`, err);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleClosureReasonChange = async (id, newReason) => {
    try {
      const callRef = doc(db, "inquiry", id);
      await updateDoc(callRef, { closureReason: newReason });

      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === id ? { ...call, closureReason: newReason } : call
        )
      );
    } catch (err) {
      console.error(`Error updating closure reason for call ${id}:`, err);
      alert("Failed to update closure reason. Please try again.");
    }
  };

  if (loading) {
    return (
      <div
        className="dashboard-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <p style={{ fontSize: "1.2rem", color: "#555" }}>טוען קריאות...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="dashboard-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <p style={{ fontSize: "1.2rem", color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {" "}
      {/* השתמשתי ב-home-page לרוחב מלא וריפוד, כמו HomeScreen */}
      <div className="dashboard-content">
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#78350f",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          דשבורד קריאות
        </h1>

        {/* הסרת אזור הסטטיסטיקות כפי שביקשת. 
          אם ברצונך להוסיף סטטיסטיקות מבוססות נתוני אמת מ-Firebase בעתיד,
          ניתן להחזיר כאן קומפוננטה נפרדת.
        */}
        {/* <div className="stats-section">
          <div className="stat">
            <h3>5</h3>
            <p>מתנדבים פעילים</p>
          </div>
          <div className="stat">
            <h3>2</h3>
            <p>קריאות פעילות</p>
          </div>
        </div> */}

        {/* פילטרים - נשאר ללא שינוי, בהתאם לבקשה */}
        <div className="filters-container">

          <select style={{ padding: "8px", borderRadius: "5px" }}>
            <option value="">מתנדב</option>
            <option value="yossi">יוסי כהן</option>
            <option value="dana">דנה לוי</option>
          </select>
        </div>

        {/* טבלת קריאות */}
        <div className="table-container" style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              borderRadius: "8px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f8f9fa",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <th
                  style={{
                    padding: "12px 20px",
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  תאריך ושעה
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  עיר וכתובת
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  תיאור
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  מתנדב מטפל
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  סטטוס
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  סיבת סגירה
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: "1px solid #eee", transition: "all 0.3s ease-in-out" }}
                >
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    {c.date} <br /> {c.time}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    {c.city}, {c.address}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                      maxWidth: "250px",
                      wordWrap: "break-word",
                    }}
                  >
                    {c.description}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    {c.handler}
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                        fontSize: "12px",
                        backgroundColor: "#f8f9fa",
                        minWidth: "150px",
                        display: "block",
                      }}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    <div>
                      {c.status === "הפנייה נסגרה" && (
                        <select
                          value={c.closureReason || ""}
                          onChange={(e) =>
                            handleClosureReasonChange(c.id, e.target.value)
                          }
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                            fontSize: "12px",
                            backgroundColor: "#f8f9fa",
                            minWidth: "200px",
                            display: "block",
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
                    colSpan="7"
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