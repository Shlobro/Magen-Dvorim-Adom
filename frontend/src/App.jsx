// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';
import HomeScreen from './pages/HomeScreen';
import ReportPage from './pages/ReportPage'; // נוספה שורת ייבוא לעמוד הדיווח
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/report" element={<ReportPage />} /> {/* נוספה שורת הנתיב */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
