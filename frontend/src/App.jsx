// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Dashboard from './pages/Dashboard';
import VolunteerMap from './pages/VolunteerMap';
import HomeScreen from './pages/HomeScreen';
import ReportPage from './pages/ReportPage';
import SignUp from './pages/SignUp'; // דף הרשמת המתנדבים
import Login from './pages/Login';
import CoordinatorSignup from './pages/CoordinatorSignup.jsx'; // דף הרשמת הרכזים
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// ייבוא קומפוננטות כללי האתיקה
import EthicsCoordinators from './pages/EthicsCoordinators.jsx';
import EthicsVolunteers from './pages/EthicsVolunteers.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/coordinator-register" element={<CoordinatorSignup />} />

            {/* נתיבים לדפי כללי האתיקה */}
            <Route path="/ethics/coordinators" element={<EthicsCoordinators />} />
            <Route path="/ethics/volunteers" element={<EthicsVolunteers />} />

            {/* נתיבים מוגנים - רק לרכזים (userType: 1) */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole={1}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/volunteer-map" 
              element={
                <ProtectedRoute requiredRole={1}>
                  <VolunteerMap />
                </ProtectedRoute>
              } 
            />
            {/* הוסף כאן נתיבים נוספים שצריכים הגנה לתפקיד "coordinator" */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;