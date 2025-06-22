// frontend/src/pages/InsightsPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Assuming firebaseConfig is set up
import { useAuth } from '../contexts/AuthContext'; // To get user role
import '../styles/HomeScreen.css'; // Reusing existing styles for consistency
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement // For potential future Pie/Doughnut charts
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function InsightsPage() {
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [openInquiries, setOpenInquiries] = useState(0);
  const [closedInquiries, setClosedInquiries] = useState(0);
  const [inquiriesByMonthData, setInquiriesByMonthData] = useState({ labels: [], datasets: [] });
  const [inquiriesByCityData, setInquiriesByCityData] = useState({ labels: [], datasets: [] });
  const [volunteersByAssignmentData, setVolunteersByAssignmentData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userRole, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && userRole === 1) {
      const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch all inquiries
          const inquiriesCollectionRef = collection(db, 'inquiry');
          const inquiriesSnapshot = await getDocs(inquiriesCollectionRef);
          const allInquiries = inquiriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

          // ----------------------------------------------------
          // Process data for charts
          // ----------------------------------------------------

          // Inquiries by Month
          const monthsMap = {};
          const monthNames = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
          ];

          allInquiries.forEach(inquiry => {
            if (inquiry.timestamp && inquiry.timestamp.toDate) {
              const date = inquiry.timestamp.toDate();
              const month = date.getMonth(); // 0-11
              const year = date.getFullYear();
              const monthYear = `${monthNames[month]} ${year}`;
              monthsMap[monthYear] = (monthsMap[monthYear] || 0) + 1;
            }
          });

          // Sort months chronologically
          const sortedMonths = Object.keys(monthsMap).sort((a, b) => {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            const dateA = new Date(yearA, monthNames.indexOf(monthA), 1);
            const dateB = new Date(yearB, monthNames.indexOf(monthB), 1);
            return dateA - dateB;
          });

          setInquiriesByMonthData({
            labels: sortedMonths,
            datasets: [
              {
                label: 'מספר פניות',
                data: sortedMonths.map(month => monthsMap[month]),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          });

          // Inquiries by City
          const citiesMap = {};
          allInquiries.forEach(inquiry => {
            if (inquiry.city) {
              const city = inquiry.city.trim().replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
              citiesMap[city] = (citiesMap[city] || 0) + 1;
            }
          });
          const sortedCities = Object.entries(citiesMap).sort(([, countA], [, countB]) => countB - countA);

          setInquiriesByCityData({
            labels: sortedCities.map(([city]) => city),
            datasets: [
              {
                label: 'מספר פניות',
                data: sortedCities.map(([, count]) => count),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
              },
            ],
          });

          // Volunteers by Assigned Inquiries
          const volunteersMap = {};
          // Fetch users to get volunteer names
          const usersCollectionRef = collection(db, 'user');
          const usersSnapshot = await getDocs(usersCollectionRef);
          const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const volunteerNames = allUsers.reduce((acc, user) => {
            if (user.userType === 2) { // Assuming userType 2 is for volunteers
              acc[user.id] = user.name || `מתנדב ${user.id.substring(0, 4)}`;
            }
            return acc;
          }, {});

          allInquiries.forEach(inquiry => {
            if (inquiry.assignedVolunteerId && volunteerNames[inquiry.assignedVolunteerId]) {
              const volunteerName = volunteerNames[inquiry.assignedVolunteerId];
              volunteersMap[volunteerName] = (volunteersMap[volunteerName] || 0) + 1;
            }
          });
          const sortedVolunteers = Object.entries(volunteersMap).sort(([, countA], [, countB]) => countB - countA);

          setVolunteersByAssignmentData({
            labels: sortedVolunteers.map(([name]) => name),
            datasets: [
              {
                label: 'מספר שיבוצים',
                data: sortedVolunteers.map(([, count]) => count),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
              },
            ],
          });


        } catch (err) {
          console.error("Error fetching insights:", err);
          setError("Failed to load insights data. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchInsights();
    }
  }, [authLoading, userRole]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow charts to resize freely
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: '\"Segoe UI\", sans-serif' // Ensure consistent font
          }
        }
      },
      title: {
        display: true,
        font: {
          size: 18,
          family: '\"Segoe UI\", sans-serif'
        }
      },
      tooltip: {
        bodyFont: {
          family: '\"Segoe UI\", sans-serif'
        },
        titleFont: {
          family: '\"Segoe UI\", sans-serif'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: '\"Segoe UI\", sans-serif'
          }
        },
        title: {
          display: true,
          font: {
            family: '\"Segoe UI\", sans-serif'
          }
        }
      },
      y: {
        ticks: {
          font: {
            family: '\"Segoe UI\", sans-serif'
          }
        },
        title: {
          display: true,
          font: {
            family: '\"Segoe UI\", sans-serif'
          }
        }
      }
    }
  };

  if (authLoading) {
    return (
      <div className="container" style={{ padding: '20px', textAlign: 'center' }}>
        <p>טוען פרטי אימות...</p>
      </div>
    );
  }

  if (userRole !== 1) {
    return (
      <div className="container" style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
        <p>אין לך הרשאה לצפות בדף זה. גישה נדחתה.</p>
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

      <main className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md mb-8">
        {loading ? (
          <p className="text-center text-blue-500">טוען נתונים...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">מספר פניות לפי חודש</h2>
                {inquiriesByMonthData.labels.length > 0 ? (
                  <div style={{ height: '300px' }}> {/* Fixed height for charts */}
                    <Bar options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'מספר פניות לפי חודש' } } }} data={inquiriesByMonthData} />
                  </div>
                ) : (
                  <p className="text-center text-gray-500">אין נתונים זמינים עבור פניות לפי חודש.</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">מספר פניות לפי עיר</h2>
                {inquiriesByCityData.labels.length > 0 ? (
                  <div style={{ height: '300px' }}>
                    <Bar options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'מספר פניות לפי עיר' } } }} data={inquiriesByCityData} />
                  </div>
                ) : (
                  <p className="text-center text-gray-500">אין נתונים זמינים עבור פניות לפי עיר.</p>
                )}
              </div>

              <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">מתנדבים מובילים לפי שיבוצים</h2>
                {volunteersByAssignmentData.labels.length > 0 ? (
                  <div style={{ height: '300px' }}>
                    <Bar options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'מתנדבים מובילים לפי שיבוצים' } } }} data={volunteersByAssignmentData} />
                  </div>
                ) : (
                  <p className="text-center text-gray-500">אין נתונים זמינים עבור מתנדבים מובילים.</p>
                )}
              </div>

            </div>
          </>
        )}
      </main>

      <footer className="footer" style={{ marginTop: 40 }}>
        © 2025 מגן דבורים אדום. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
