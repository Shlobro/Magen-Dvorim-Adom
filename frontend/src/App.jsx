// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';
import HomeScreen from './pages/HomeScreen';
import Header from './components/Header'; // חשוב! תוודא שהנתיב נכון

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
