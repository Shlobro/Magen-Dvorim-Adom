// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Dashboard from './pages/Dashboard';
import VolunteerMap from './pages/VolunteerMap';
import HomeScreen from './pages/HomeScreen';
import ReportPage from './pages/ReportPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import CoordinatorSignup from './pages/CoordinatorSignup.jsx';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// ייבוא קומפוננטות כללי האתיקה
import EthicsCoordinators from './pages/EthicsCoordinators.jsx';
import EthicsVolunteers from './pages/EthicsVolunteers.jsx';

// ייבוא קומפוננטת טופס המשוב החדשה
import FeedbackForm from './pages/FeedbackForm.jsx';

// ייבוא קומפוננטת התובנות החדשה
import InsightsPage from './pages/InsightsPage.jsx';

// ייבוא קומפוננטת ניהול המתנדבים החדשה
import VolunteerManagement from './pages/VolunteerManagement.jsx';

// ייבוא לוח מחוונים למתנדבים
import VolunteerDashboard from './pages/VolunteerDashboard.jsx';

// ייבוא דף אישור רכזים
import CoordinatorApproval from './pages/CoordinatorApproval.jsx';

// ייבוא עמוד פרופיל רכז
import CoordinatorProfile from './pages/CoordinatorProfile.jsx';

// ייבוא עמוד פרופיל מתנדב
import VolunteerProfile from './pages/VolunteerProfile.jsx';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Header />
            <div className="main-content">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/coordinator-register" element={<CoordinatorSignup />} />

                  {/* נתיבים לדפי כללי האתיקה */}
                  <Route path="/ethics/coordinators" element={<EthicsCoordinators />} />
                  <Route path="/ethics/volunteers" element={<EthicsVolunteers />} />

                  {/* נתיב לטופס המשוב */}
                  <Route path="/feedback" element={<FeedbackForm />} />

                  {/* נתיבים מוגנים - רק לרכזים (userType: 1) */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute requiredRole={1}>
                        <ErrorBoundary>
                          <Dashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/volunteer-map"
                    element={
                      <ProtectedRoute requiredRole={1}>
                        <ErrorBoundary>
                          <VolunteerMap />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  {/* New route for Insights page */}
                  <Route
                    path="/insights"
                    element={
                      <ProtectedRoute requiredRole={1}>
                        <ErrorBoundary>
                          <InsightsPage />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  {/* Volunteer Management page for coordinators */}
                  <Route
                    path="/volunteer-management"
                    element={
                      <ProtectedRoute requiredRole={1}>
                        <ErrorBoundary>
                          <VolunteerManagement />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Coordinator Approval page for coordinators */}
                  <Route
                    path="/coordinator-approval"
                    element={
                      <ProtectedRoute requiredRole={1}>
                        <ErrorBoundary>
                          <CoordinatorApproval />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Coordinator Profile page for coordinators */}
                  <Route
                    path="/coordinator-profile"
                    element={
                      <ProtectedRoute requiredRole={1}>
                        <ErrorBoundary>
                          <CoordinatorProfile />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Volunteer Dashboard for volunteers */}
                  <Route
                    path="/volunteer-dashboard"
                    element={
                      <ProtectedRoute requiredRole={2}>
                        <ErrorBoundary>
                          <VolunteerDashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Volunteer Profile page for volunteers */}
                  <Route
                    path="/volunteer-profile"
                    element={
                      <ProtectedRoute requiredRole={2}>
                        <ErrorBoundary>
                          <VolunteerProfile />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  {/* הוסף כאן נתיבים נוספים שצריכים הגנה לתפקיד "coordinator" */}
                </Routes>
              </ErrorBoundary>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
