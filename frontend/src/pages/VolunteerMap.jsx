// VolunteerMap.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import beeIconUrl from '../assets/cuteBeeInquiry.png';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ===========================
// Modernized Layout Styles
// ===========================
const containerStyle = {
  display: 'flex',
  height: '100vh',
  width: '100%',
  backgroundColor: '#f5f7fa',
  fontFamily: '"Segoe UI", Tahoma, sans-serif',
};
const mapWrapperStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
};
const mapHeaderStyle = {
  padding: '12px 16px',
  fontSize: '1.4rem',
  fontWeight: '600',
  borderBottom: '1px solid #e0e0e0',
  backgroundColor: '#ffffff',
  color: '#1f2937',
  textAlign: 'center',
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
};
const sidebarStyle = {
  width: '350px',
  backgroundColor: '#f9fafb',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.05)',
  overflowY: 'auto',
};
const sectionTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '15px',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '8px',
};
const inquiryDetailsStyle = {
  backgroundColor: '#ffffff',
  padding: '15px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  marginBottom: '20px',
};
const detailItemStyle = {
  marginBottom: '8px',
  fontSize: '0.95rem',
  color: '#4b5563',
  lineHeight: '1.4',
};
const listStyle = {
  listStyle: 'none',
  padding: '0',
  margin: '0',
};
const assignButtonStyle = {
  backgroundColor: '#4c5d73',
  color: 'white',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'background-color 0.2s ease-in-out',
  width: '100%',
  marginTop: '20px',
};
const filterContainerStyle = {
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};
const filterLabelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 'bold',
  color: '#374151',
};
const filterSelectStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #d1d5db',
  backgroundColor: '#f9fafb',
  fontSize: '0.95rem',
};

// ==========================
// Custom Bee Icon
// ==========================
const beeIcon = new L.Icon({
  iconUrl: beeIconUrl,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// ==========================
// Main Component
// ==========================
export default function VolunteerMap() {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [availableVolunteers, setAvailableVolunteers] = useState([]);
  const [radius, setRadius] = useState(10);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);

  // פונקציית שליפת הקריאות
  const fetchInquiries = useCallback(async () => {
    try {
      const q = query(collection(db, "inquiry"), where("status", "in", ["נפתחה פנייה (טופס מולא)", "לפנייה שובץ מתנדב"]));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // *** התיקון: סנן רק קריאות שיש להן lat ו-lng תקניים ***
      const validInquiries = fetched.filter(inquiry => 
        inquiry.lat != null && !isNaN(inquiry.lat) && 
        inquiry.lng != null && !isNaN(inquiry.lng)
      );
      
      console.log("Map fetch - קריאות שנשלפו (כולל סינון):", validInquiries); // LOG
      setInquiries(validInquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // פונקציה לשליפת מתנדבים בקרבת מקום
  useEffect(() => {
    const fetchVolunteers = async () => {
      if (!selectedInquiry) {
        setAvailableVolunteers([]);
        return;
      }

      // *** הוסף בדיקה ל-lat ו-lng גם כאן לפני קריאת ה-API ***
      if (selectedInquiry.lat == null || isNaN(selectedInquiry.lat) || 
          selectedInquiry.lng == null || isNaN(selectedInquiry.lng)) {
        console.warn("Selected inquiry is missing valid lat/lng coordinates:", selectedInquiry);
        setAvailableVolunteers([]);
        return;
      }

      try {
        const response = await axios.post('/api/users/queryNear', {
          lat: selectedInquiry.lat,
          lng: selectedInquiry.lng,
          radius: radius,
        });
        setAvailableVolunteers(response.data);
      } catch (error) {
        console.error("Error fetching available volunteers:", error);
        setAvailableVolunteers([]);
      }
    };

    fetchVolunteers();
  }, [selectedInquiry, radius]);

  // פונקציה לשיבוץ מתנדב
  const assignToInquiry = async () => {
    if (!selectedInquiry || selectedVolunteerIds.length === 0) {
      alert("אנא בחר פנייה ומתנדב לשיבוץ.");
      return;
    }

    // בדיקה: האם הקריאה כבר שובצה?
    if (selectedInquiry.assignedVolunteers && 
        (Array.isArray(selectedInquiry.assignedVolunteers) && selectedInquiry.assignedVolunteers.length > 0 || 
         typeof selectedInquiry.assignedVolunteers === 'string' && selectedInquiry.assignedVolunteers !== '')) {
      alert("קריאה זו כבר שובצה למתנדב.");
      return;
    }

    const inquiryId = selectedInquiry.id;
    const volunteerToAssignId = selectedVolunteerIds[0]; 

    try {
      const inquiryRef = doc(db, "inquiry", inquiryId);
      await updateDoc(inquiryRef, {
        assignedVolunteers: volunteerToAssignId, 
        status: "לפנייה שובץ מתנדב",
      });
      alert(`פנייה ${inquiryId} שובצה בהצלחה למתנדב ${volunteerToAssignId}.`);
      console.log(`פנייה ${inquiryId} שובצה למתנדב ${volunteerToAssignId}`);
      
      fetchInquiries(); 

      setSelectedInquiry(null);
      setAvailableVolunteers([]);
      setSelectedVolunteerIds([]);
    } catch (error) {
      console.error("שגיאה בשיבוץ מתנדב:", error);
      alert("נכשל בשיבוץ מתנדב. אנא נסה שוב.");
    }
  };

  // מרקר ל-useMapEvents
  function MapEvents() {
    useMapEvents({
      click: () => {
        setSelectedInquiry(null);
        setSelectedVolunteerIds([]);
        setAvailableVolunteers([]);
      },
    });
    return null;
  }

  // בדיקה אם הקריאה שנבחרה כבר שובצה
  const isSelectedInquiryAssigned = selectedInquiry && 
    (selectedInquiry.assignedVolunteers && 
     (Array.isArray(selectedInquiry.assignedVolunteers) && selectedInquiry.assignedVolunteers.length > 0 || 
      typeof selectedInquiry.assignedVolunteers === 'string' && selectedInquiry.assignedVolunteers !== ''));

  return (
    <div style={containerStyle}>
      <div style={mapWrapperStyle}>
        <h1 style={mapHeaderStyle}>מפת נחילי דבורים לשיבוץ מתנדבים</h1>
        <MapContainer
          center={[31.0461, 34.8516]}
          zoom={8}
          style={{ flex: 1, height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents />

          {inquiries.map((inquiry) => (
            <Marker
              key={inquiry.id}
              position={[inquiry.lat, inquiry.lng]}
              icon={beeIcon}
              eventHandlers={{
                click: () => {
                  setSelectedInquiry(inquiry);
                  setSelectedVolunteerIds([]);
                  setAvailableVolunteers([]);
                },
              }}
            >
              <Popup>
                <strong>{inquiry.address}, {inquiry.city}</strong><br />
                סטטוס: {inquiry.status}<br />
                {inquiry.notes && `הערות: ${inquiry.notes}`}<br />
                {inquiry.assignedVolunteers ? `שובץ: ${inquiry.assignedVolunteers}` : 'טרם שובץ'}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={sidebarStyle}>
        <h2 style={sectionTitleStyle}>פרטי פנייה ושיבוץ מתנדב</h2>
        {selectedInquiry ? (
          <>
            <div style={inquiryDetailsStyle}>
              <div style={detailItemStyle}><strong>מס' פנייה:</strong> {selectedInquiry.id}</div>
              <div style={detailItemStyle}><strong>כתובת:</strong> {selectedInquiry.address}, {selectedInquiry.city}</div>
              <div style={detailItemStyle}><strong>טלפון:</strong> {selectedInquiry.phoneNumber}</div>
              <div style={detailItemStyle}><strong>תאריך פתיחה:</strong> {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString('he-IL') : 'אין מידע'}</div>
              <div style={detailItemStyle}><strong>סטטוס:</strong> {selectedInquiry.status}</div>
              <div style={detailItemStyle}><strong>הערות:</strong> {selectedInquiry.notes || 'אין'}</div>
              <div style={detailItemStyle}>
                <strong>מתנדב משובץ:</strong>{' '}
                {isSelectedInquiryAssigned ? selectedInquiry.assignedVolunteers : 'טרם שובץ'}
              </div>
            </div>

            <div style={filterContainerStyle}>
              <label htmlFor="radius-select" style={filterLabelStyle}>
                טווח חיפוש מתנדבים:
              </label>
              <select
                id="radius-select"
                style={filterSelectStyle}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                disabled={isSelectedInquiryAssigned}
              >
                {[1, 2, 5, 10, 20].map((r) => (
                  <option key={r} value={r}>{r} ק"מ</option>
                ))}
              </select>
            </div>

            {availableVolunteers.length > 0 ? (
              <ul style={listStyle}>
                {availableVolunteers.map((v) => (
                  <li key={v.id} style={{ marginBottom: '12px' }}>
                    <label style={{ cursor: isSelectedInquiryAssigned ? 'not-allowed' : 'pointer' }}>
                      <input
                        type="radio"
                        name="volSelect"
                        checked={selectedVolunteerIds[0] === v.id}
                        onChange={() => setSelectedVolunteerIds([v.id])}
                        style={{ marginRight: '8px' }}
                        disabled={isSelectedInquiryAssigned}
                      />
                      {v.name} — {v.distance?.toFixed(1)} ק"מ — ציון {v.score?.toFixed(1)}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#6b7280' }}>
                אין מתנדבים ברדיוס של {radius} ק"מ.
              </div>
            )}

            <button
              style={assignButtonStyle}
              disabled={!selectedInquiry || selectedVolunteerIds.length === 0 || isSelectedInquiryAssigned} 
              onClick={assignToInquiry}
            >
              {isSelectedInquiryAssigned ? 'כבר שובץ מתנדב' : 'שבץ מתנדב לקריאה'}
            </button>
            <button
              onClick={() => setSelectedInquiry(null)}
              style={{
                ...assignButtonStyle,
                backgroundColor: '#6c757d',
                marginTop: '10px',
              }}
            >
              בטל בחירה
            </button>
          </>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '20px' }}>
            לחץ על מרקר של נחיל במפה כדי לראות פרטים ולשבץ מתנדב.
          </p>
        )}
      </div>
    </div>
  );
}