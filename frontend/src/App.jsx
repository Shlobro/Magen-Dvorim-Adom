// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/App.css";

import Header         from "./components/Header";
import HomeScreen     from "./pages/HomeScreen";
import ReportPage     from "./pages/ReportPage";
import VolunteerMap   from "./pages/VolunteerMap";
import SignUp         from "./pages/SignUp";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";

/**
 * מצב דמו: אין צורך באימות, לכן אין PrivateRoute.
 * אפשר לדפדף ישירות לדשבורד ולשאר העמודים.
 */
export default function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/map" element={<VolunteerMap />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}