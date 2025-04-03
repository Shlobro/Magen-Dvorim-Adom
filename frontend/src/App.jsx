// frontend/src/App.jsx
import React from 'react';
import AdminPanel from './pages/AdminPanel';
import './styles/App.css'; // This imports your global styles

function App() {
  return (
    <div className="p-4">
      <AdminPanel />
    </div>
  );
}

export default App;
