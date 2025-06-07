// frontend/src/pages/VolunteerMap.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap, // Use useMap for direct map object access
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import beeIconUrl from '../assets/cuteBeeInquiry.png';
import { collection, getDocs, doc, updateDoc, query, where, GeoPoint, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLocation, useNavigate } from 'react-router-dom';

// ===========================
// Modernized Layout Styles (unchanged for consistency)
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
  minWidth: '300px',
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
const filterInputRangeStyle = {
  width: '100%',
  marginTop: '5px',
};
const filterRangeValueStyle = {
  fontSize: '0.9rem',
  color: '#666',
  marginTop: '5px',
  display: 'block',
  textAlign: 'center',
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
  const [radius, setRadius] = useState(20);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);
  const mapRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to extract coordinates from Firebase data
  const extractCoordinates = (data) => {
    let lat = null;
    let lng = null;

    if (data.location instanceof GeoPoint) {
      lat = data.location.latitude;
      lng = data.location.longitude;
    } else if (data.location && typeof data.location === 'object' && data.location.latitude != null && data.location.longitude != null) {
      lat = data.location.latitude;
      lng = data.location.longitude;
    } else if (data.lat != null && data.lng != null) { // Support for direct lat/lng fields
      lat = data.lat;
      lng = data.lng;
    }
    return { lat, lng };
  };

  // Function to fetch inquiries
  const fetchInquiries = useCallback(async () => {
    try {
      const q = query(collection(db, "inquiry"), where("status", "in", ["נפתחה פנייה (טופס מולא)", "לפנייה שובץ מתנדב"]));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const { lat, lng } = extractCoordinates(data); // Use helper function
        return { id: doc.id, ...data, lat, lng };
      });

      // Filter only inquiries with valid lat and lng
      const validInquiries = fetched.filter(inquiry =>
        inquiry.lat != null && !isNaN(inquiry.lat) &&
        inquiry.lng != null && !isNaN(inquiry.lng)
      );

      console.log("Map fetch - inquiries fetched (including filter):", validInquiries);
      setInquiries(validInquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Handle inquiryId parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inquiryIdFromUrl = params.get('inquiryId');

    if (inquiryIdFromUrl && inquiries.length > 0) {
      const inquiryToSelect = inquiries.find(inc => inc.id === inquiryIdFromUrl);
      if (inquiryToSelect) {
        setSelectedInquiry(inquiryToSelect);
        // Center the map on the selected inquiry
        if (mapRef.current && inquiryToSelect.lat != null && inquiryToSelect.lng != null) {
          mapRef.current.setView([inquiryToSelect.lat, inquiryToSelect.lng], 13);
        }
        // fetchVolunteers will be called by the next useEffect
      } else {
        console.warn(`Inquiry with ID ${inquiryIdFromUrl} not found or already processed.`);
        navigate(location.pathname, { replace: true });
      }
    }
  }, [inquiries, location.search, navigate]);

  // Function to fetch nearby volunteers via Backend API
  useEffect(() => {
    const fetchVolunteers = async () => {
      if (!selectedInquiry) {
        setAvailableVolunteers([]);
        return;
      }

      // Ensure valid coordinates before calling the API
      if (selectedInquiry.lat == null || isNaN(selectedInquiry.lat) ||
          selectedInquiry.lng == null || isNaN(selectedInquiry.lng)) {
        console.warn("Selected inquiry is missing valid lat/lng coordinates for fetching volunteers:", selectedInquiry);
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

  // Function to assign a volunteer
  const assignToInquiry = async () => {
    if (!selectedInquiry || selectedVolunteerIds.length === 0) {
      alert("אנא בחר פנייה ומתנדב לשיבוץ.");
      return;
    }

    const inquiryId = selectedInquiry.id;
    const volunteerToAssignId = selectedVolunteerIds[0];

    try {
      const inquiryRef = doc(db, "inquiry", inquiryId);
      await updateDoc(inquiryRef, {
        assignedVolunteers: volunteerToAssignId,
        status: "לפנייה שובץ מתנדב",
        assignedTimestamp: Timestamp.now(), // Store assignment Timestamp
      });
      alert(`פנייה ${inquiryId} שובצה בהצלחה למתנדב ${volunteerToAssignId}.`);
      console.log(`פנייה ${inquiryId} שובצה למתנדב ${volunteerToAssignId}`);

      fetchInquiries(); // Refresh inquiry list to update status

      setSelectedInquiry(null);
      setAvailableVolunteers([]);
      setSelectedVolunteerIds([]);
      navigate('/dashboard'); // Navigate back to dashboard after assignment
    } catch (error) {
      console.error("שגיאה בשיבוץ מתנדב:", error);
      alert("נכשל בשיבוץ מתנדב. אנא נסה שוב.");
    }
  };

  // Component for setting map reference and handling map clicks
  function MapSetter() {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
      // Event handler for clicks on the map itself (not markers)
      map.on('click', () => {
        setSelectedInquiry(null);
        setSelectedVolunteerIds([]);
        setAvailableVolunteers([]);
        // Optional: clear URL parameter if present
        if (location.search.includes('inquiryId')) {
          navigate(location.pathname, { replace: true });
        }
      });
      // Cleanup function for the event listener
      return () => {
        map.off('click');
      };
    }, [map, navigate, location.pathname, location.search]);
    return null;
  }

  // Check if the selected inquiry is already assigned (improved to handle string assignedVolunteers)
  const isSelectedInquiryAssigned = selectedInquiry &&
    selectedInquiry.assignedVolunteers &&
    (Array.isArray(selectedInquiry.assignedVolunteers) && selectedInquiry.assignedVolunteers.length > 0 ||
     typeof selectedInquiry.assignedVolunteers === 'string' && selectedInquiry.assignedVolunteers !== '');


  return (
    <div style={containerStyle}>
      <div style={mapWrapperStyle}>
        <h1 style={mapHeaderStyle}>מפת נחילי דבורים לשיבוץ מתנדבים</h1>
        <MapContainer
          center={[31.0461, 34.8516]} // Initial map center (Israel)
          zoom={8}
          scrollWheelZoom={true}
          style={{ flex: 1, height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapSetter /> {/* Helper component for mapRef and map click handling */}

          {inquiries.map((inquiry) => (
            inquiry.lat != null && inquiry.lng != null && !isNaN(inquiry.lat) && !isNaN(inquiry.lng) ? (
              <Marker
                key={inquiry.id}
                position={[inquiry.lat, inquiry.lng]}
                icon={beeIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedInquiry(inquiry);
                    setSelectedVolunteerIds([]);
                    // fetchVolunteers will be called by the useEffect for selectedInquiry/radius
                  },
                }}
              >
                <Popup>
                  <strong>{inquiry.address}, {inquiry.city || ''}</strong><br />
                  סטטוס: {inquiry.status}<br />
                  {inquiry.notes && `הערות: ${inquiry.notes}`}<br />
                  {inquiry.assignedVolunteers ? `שובץ: ${inquiry.assignedVolunteers}` : 'טרם שובץ'}
                </Popup>
              </Marker>
            ) : null
          ))}

          {availableVolunteers.map((volunteer) => (
            volunteer.lat != null && volunteer.lng != null && !isNaN(volunteer.lat) && !isNaN(volunteer.lng) ? (
              <Marker
                key={volunteer.id}
                position={[volunteer.lat, volunteer.lng]}
                // You can add a different icon for volunteers if you wish
              >
                <Popup>
                  <strong>מתנדב: {volunteer.name}</strong><br />
                  מרחק: {volunteer.distance?.toFixed(1)} ק"מ<br />
                  ציון: {volunteer.score?.toFixed(1)}
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>

      <div style={sidebarStyle}>
        <h2 style={sectionTitleStyle}>פרטי פנייה ושיבוץ מתנדב</h2>
        {selectedInquiry ? (
          <>
            <div style={inquiryDetailsStyle}>
              <div style={detailItemStyle}><strong>מס' פנייה:</strong> {selectedInquiry.id}</div>
              <div style={detailItemStyle}><strong>כתובת:</strong> {selectedInquiry.address}, {selectedInquiry.city || ''}</div>
              <div style={detailItemStyle}><strong>טלפון:</strong> {selectedInquiry.phoneNumber}</div>
              <div style={detailItemStyle}><strong>תאריך פתיחה:</strong> {selectedInquiry.timestamp ? new Date(selectedInquiry.timestamp.toDate()).toLocaleString('he-IL') : 'אין מידע'}</div>
              <div style={detailItemStyle}><strong>סטטוס:</strong> {selectedInquiry.status}</div>
              <div style={detailItemStyle}><strong>הערות:</strong> {selectedInquiry.notes || 'אין'}</div>
              <div style={detailItemStyle}>
                <strong>מתנדב משובץ:</strong>{' '}
                {isSelectedInquiryAssigned ? selectedInquiry.assignedVolunteers : 'טרם שובץ'}
              </div>
            </div>

            <div style={filterContainerStyle}>
              <label htmlFor="radius-range" style={filterLabelStyle}>
                טווח חיפוש מתנדבים:
              </label>
              <input
                type="range"
                id="radius-range"
                min="1"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={filterInputRangeStyle}
                disabled={isSelectedInquiryAssigned}
              />
              <span style={filterRangeValueStyle}>{radius} ק"מ</span>
            </div>

            <h3 style={sectionTitleStyle}>מתנדבים זמינים ברדיוס:</h3>
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
              <div style={{ color: '#6b7280', textAlign: 'center' }}>
                אין מתנדבים זמינים ברדיוס של {radius} ק"מ.
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
              onClick={() => {
                  setSelectedInquiry(null);
                  setSelectedVolunteerIds([]);
                  setAvailableVolunteers([]);
                  if (location.search.includes('inquiryId')) {
                    navigate(location.pathname, { replace: true });
                  }
              }}
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
            {location.search.includes('inquiryId') && (
                <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                    ייתכן והפנייה הספציפית שחיפשת לא נמצאה, או שאינה זמינה לשיבוץ.
                </p>
            )}
          </p>
        )}
      </div>
    </div>
  );
}