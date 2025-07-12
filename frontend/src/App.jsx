import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import Header from './components/Header';
import HomeScreen from './pages/HomeScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VolunteerMap from './pages/VolunteerMap'; // ✅ Fixed: Changed from 'import L from "leaflet"' to 'import * as L from "leaflet"'
import VolunteerDashboard from './pages/VolunteerDashboard';
import ChangePassword from './pages/ChangePassword';
import SignUp from './pages/SignUp';
import UserProfile from './pages/UserProfile';
import FeedbackForm from './pages/FeedbackForm';
import CoordinatorSignup from './pages/CoordinatorSignup';
import ReportPage from './pages/ReportPage';
import ProtectedRoute from './components/ProtectedRoute';
import VolunteerProfile from './pages/VolunteerProfile';
import VolunteerManagement from './pages/VolunteerManagement';
import CoordinatorApproval from './pages/CoordinatorApproval';
import CoordinatorProfile from './pages/CoordinatorProfile';
import InsightsPage from './pages/InsightsPage';
import EthicsVolunteers from './pages/EthicsVolunteers';
import EthicsCoordinators from './pages/EthicsCoordinators';

// Component to conditionally render Header
function AppWithHeader() {
  const location = useLocation();
  
  // Show header on all pages
  const showHeader = true;

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/coordinator-signup" element={<CoordinatorSignup />} />
        <Route path="/coordinator-register" element={<CoordinatorSignup />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        
        {/* Ethics Pages - Public Access */}
        <Route path="/ethics/volunteers" element={<EthicsVolunteers />} />
        <Route path="/ethics/coordinators" element={<EthicsCoordinators />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="coordinator">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/volunteer-dashboard" element={
          <ProtectedRoute requiredRole="volunteer">
            <VolunteerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/volunteer-map" element={
          <ProtectedRoute requiredRole="coordinator">
            <VolunteerMap />
          </ProtectedRoute>
        } />
        <Route path="/volunteer-management" element={
          <ProtectedRoute requiredRole="coordinator">
            <VolunteerManagement />
          </ProtectedRoute>
        } />
        <Route path="/coordinator-approval" element={
          <ProtectedRoute requiredRole="coordinator">
            <CoordinatorApproval />
          </ProtectedRoute>
        } />
        <Route path="/coordinator-profile" element={
          <ProtectedRoute requiredRole="coordinator">
            <CoordinatorProfile />
          </ProtectedRoute>
        } />
        <Route path="/volunteer-profile" element={
          <ProtectedRoute requiredRole="volunteer">
            <VolunteerProfile />
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute requiredRole="coordinator">
            <InsightsPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <AppWithHeader />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </div>
  );
}

export default App;
