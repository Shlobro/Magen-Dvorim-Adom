// frontend/src/pages/VolunteerManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress } from '@mui/material';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function VolunteerManagement() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Fetch all volunteers
  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/users`)
      .then(res => {
        setVolunteers(res.data.filter(u => u.userType === 2));
        setLoading(false);
      })
      .catch(err => {
        setError('שגיאה בטעינת מתנדבים');
        setLoading(false);
      });
  }, []);

  // Remove volunteer
  const handleRemove = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך להסיר את המתנדב?')) return;
    setRemovingId(id);
    try {
      await axios.delete(`${API_BASE}/api/users/${id}`);
      setVolunteers(volunteers.filter(v => v.id !== id));
    } catch (e) {
      alert('שגיאה בהסרת מתנדב');
    }
    setRemovingId(null);
  };

  if (loading) return <div style={{textAlign:'center'}}><CircularProgress /></div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <div style={{maxWidth: 800, margin: '2rem auto'}}>
      <h2 style={{textAlign:'center'}}>ניהול מתנדבים</h2>
      {volunteers.length === 0 ? (
        <div>אין מתנדבים להצגה.</div>
      ) : (
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f0f0f0'}}>
              <th>שם</th>
              <th>אימייל</th>
              <th>טלפון</th>
              <th>עיר</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map(v => (
              <tr key={v.id}>
                <td>{v.name || `${v.firstName || ''} ${v.lastName || ''}`}</td>
                <td>{v.email}</td>
                <td>{v.phone}</td>
                <td>{v.city || v.location || '-'}</td>
                <td>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={removingId === v.id}
                    onClick={() => handleRemove(v.id)}
                  >
                    {removingId === v.id ? 'מסיר...' : 'הסר'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
