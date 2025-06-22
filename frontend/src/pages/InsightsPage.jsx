// frontend/src/pages/InsightsPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Assuming firebaseConfig is set up
import { useAuth } from '../contexts/AuthContext'; // To get user role
import '../styles/HomeScreen.css'; // Reusing existing styles for consistency

export default function InsightsPage() {
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [openInquiries, setOpenInquiries] = useState(0);
  const [closedInquiries, setClosedInquiries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userRole, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch data if authentication is ready and user is a coordinator
    if (!authLoading && userRole === 1) {
      const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch all inquiries
          const inquiriesCollectionRef = collection(db, 'inquiry');
          const querySnapshot = await getDocs(inquiriesCollectionRef);
          const allInquiries = querySnapshot.docs.map(doc => doc.data());

          setTotalInquiries(allInquiries.length);

          // Calculate open and closed inquiries
          const open = allInquiries.filter(call =>
            call.status !== 'הפנייה נסגרה' && call.status !== 'נשלח קישור אך לא מולא טופס'
          ).length;
          const closed = allInquiries.filter(call =>
            call.status === 'הפנייה נסגרה'
          ).length;

          setOpenInquiries(open);
          setClosedInquiries(closed);

        } catch (err) {
          console.error("Error fetching insights:", err);
          setError("Failed to load insights data. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchInsights();
    }
  }, [authLoading, userRole]); // Rerun when auth state or user role changes

  if (authLoading) {
    return (
      <div className="container" style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading authentication details...</p>
      </div>
    );
  }

  if (userRole !== 1) {
    return (
      <div className="container" style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
        <p>You do not have permission to view this page. Access denied.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center">
      <header className="header my-4 text-center">
        <h1 className="text-3xl font-bold text-gray-800">דף תובנות רכז/ת</h1>
        <p className="text-gray-600 mt-2">
          סקירה מהירה של נתוני הפניות במערכת
        </p>
      </header>

      <main className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <p className="text-center text-blue-500">טוען נתונים...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-100 p-4 rounded-lg shadow-sm text-center">
              <h2 className="text-xl font-semibold text-blue-800">סה"כ פניות</h2>
              <p className="text-4xl font-bold text-blue-600 mt-2">{totalInquiries}</p>
            </div>

            <div className="bg-green-100 p-4 rounded-lg shadow-sm text-center">
              <h2 className="text-xl font-semibold text-green-800">פניות פתוחות</h2>
              <p className="text-4xl font-bold text-green-600 mt-2">{openInquiries}</p>
            </div>

            <div className="bg-red-100 p-4 rounded-lg shadow-sm text-center">
              <h2 className="text-xl font-semibold text-red-800">פניות סגורות</h2>
              <p className="text-4xl font-bold text-red-600 mt-2">{closedInquiries}</p>
            </div>

            {/* You can add more insights here */}
            {/* For example, a basic list of recent inquiries (up to 5) */}
            <div className="md:col-span-3 bg-gray-50 p-4 rounded-lg shadow-sm mt-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">תובנות נוספות (בקרוב)</h2>
              <p className="text-gray-600">
                כאן ניתן להוסיף גרפים, טבלאות ונתונים סטטיסטיים נוספים בעתיד.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="footer" style={{ marginTop: 40 }}>
        © 2025 מגן דבורים אדום. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
