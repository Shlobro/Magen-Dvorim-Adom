// VolunteerMap.jsx
import React, { useEffect, useState } from 'react';
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

// ==========================
// Modernized Layout Styles
// ==========================
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
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
  zIndex: 1000,
};
const mapStyle = { flex: 1 };
const sidebarStyle = {
  width: '340px',
  padding: '24px',
  backgroundColor: '#ffffff',
  boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.05)',
};
const sidebarHeaderStyle = {
  fontSize: '1.4rem',
  fontWeight: '600',
  marginBottom: '24px',
  color: '#1f2937',
};
const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '16px 20px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  marginBottom: '24px',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
  color: '#374151',
};
const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  marginBottom: '20px',
  fontSize: '1rem',
  color: '#1f2937',
  backgroundColor: '#ffffff',
};
const listStyle = {
  listStyle: 'none',
  paddingLeft: '0',
  maxHeight: '220px',
  overflowY: 'auto',
  marginBottom: '24px',
  color: '#374151',
};
const assignButtonStyle = {
  width: '100%',
  padding: '12px 0',
  background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
};

// ==========================
// Icons
// ==========================
const volunteerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});
const inquiryIcon = new L.Icon({
  iconUrl: beeIconUrl,
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64],
});

// ==========================
// Utility: Haversine distance
// ==========================
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ======================================================
// Scoring function based on your table (weights sum=100)
// ======================================================
function calculateScore(vol) {
  const {
    distance,
    experienceBreeding,
    experienceEvacuation,
    trained,
    heightExperience,
    previousAcceptance,
  } = vol;

  // 1) Proximity to site (weight 30)
  //    ≤15 km →60; 16–25→30; 26–39→10; ≥40→0
  let subDist = distance <= 15 ? 60 :
                distance <= 25 ? 30 :
                distance <= 39 ? 10 : 0;
  const wDistance = 30 * (subDist / 100);

  // 2) Experience (weight 25)
  //    Evacuation→60; Breeding→40; none→0
  let subExp = experienceEvacuation ? 60 :
               experienceBreeding   ? 40 : 0;
  const wExperience = 25 * (subExp / 100);

  // 3) Training (weight 15): trained→100; else→0
  const wTraining = 15 * (trained ? 1 : 0);

  // 4) Height-work (weight 10): yes→100; else→0
  const wHeight = 10 * (heightExperience ? 1 : 0);

  // 5) Past assignment (weight 20): accepted→80; not→20
  let subPrev = previousAcceptance ? 80 : 20;
  const wPrevious = 20 * (subPrev / 100);

  // Total score (max 30+25+15+10+20 =100)
  return wDistance + wExperience + wTraining + wHeight + wPrevious;
}

// ==========================
// MapClick handler (2 km filter)
// ==========================
function MapClickHandler({ volunteers, setVolunteers }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setVolunteers(volunteers.map((v) => {
        const dist = calculateDistance(lat, lng, v.lat, v.lng);
        return { ...v, distance: dist, isNearby: dist <= 2 };
      }));
    },
  });
  return null;
}

const VolunteerMap = () => {
  // — Data —
  const [volunteers, setVolunteers] = useState([]);
  const [inquiries, setInquiries]   = useState([]);

  // — UI State —
  const [selectedInquiry, setSelectedInquiry]       = useState(null);
  const [closestVolunteers, setClosestVolunteers]   = useState([]);
  const [radius, setRadius]                         = useState(5);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);

  // Load volunteers
  useEffect(() => {
    axios.get('http://localhost:3001/user')
      .then((res) => setVolunteers(
        res.data
          .filter(u => u.lat && u.lng)
          .map(u => ({ ...u }))
      ))
      .catch(err => console.error(err));
  }, []);

  // Load inquiries
  useEffect(() => {
    axios.get('http://localhost:3001/inquiry')
      .then((res) => setInquiries(
        res.data.filter(i => i.lat && i.lng && i.status !== 'finished')
      ))
      .catch(err => console.error(err));
  }, []);

  // When user clicks a bee marker:
  function handleInquiryClick(inq) {
    setSelectedInquiry(inq);

    // Compute distance & score for each volunteer
    const scored = volunteers
      .map((v) => {
        const dist = calculateDistance(inq.lat, inq.lng, v.lat, v.lng);
        const withDist = { ...v, distance: dist };
        return { ...withDist, score: calculateScore(withDist) };
      })
      .sort((a, b) => b.score - a.score)  // highest score first
      .slice(0, 5);                       // top 5

    setClosestVolunteers(scored);
    setSelectedVolunteerIds([]);
  }

  // Filter top-5 by radius for highlighting & list
  const availableVolunteers = closestVolunteers.filter(v => v.distance <= radius);

  // Assign the one radio-selected volunteer
  function assignToInquiry() {
    if (!selectedInquiry || selectedVolunteerIds.length === 0) {
      alert('Please select a volunteer first.');
      return;
    }
    axios.post(
      `http://localhost:3001/inquiry/${selectedInquiry.id}/assign-volunteer`,
      { volunteerId: selectedVolunteerIds[0] }
    )
    .then(() => {
      alert('Volunteer assigned ✓');
      setSelectedInquiry(null);
      setClosestVolunteers([]);
    })
    .catch(err => console.error(err));
  }

  return (
    <div style={containerStyle}>
      {/* — Left Pane: Map — */}
      <div style={mapWrapperStyle}>
        <div style={mapHeaderStyle}>Reports Map</div>
        <MapContainer style={mapStyle} center={[32.0853, 34.7818]} zoom={13}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapClickHandler volunteers={volunteers} setVolunteers={setVolunteers} />

          {volunteers.map((v) => {
            const highlight = selectedInquiry && availableVolunteers.some(av => av.id === v.id);
            return (
              <Marker
                key={v.id}
                position={[v.lat, v.lng]}
                icon={volunteerIcon}
                opacity={highlight ? 1 : 0.4}
              >
                <Popup>
                  <strong>{v.name}</strong><br />
                  {v.distance?.toFixed(2)} km<br />
                  Score: {v.score?.toFixed(1)}
                </Popup>
              </Marker>
            );
          })}

          {inquiries.map((i) => (
            <Marker
              key={i.id}
              position={[i.lat, i.lng]}
              icon={inquiryIcon}
              eventHandlers={{ click: () => handleInquiryClick(i) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* — Right Pane: Assignment Panel — */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>Assignment Panel</div>

        {/* Selected Report */}
        {selectedInquiry ? (
          <div style={cardStyle}>
            <strong>Selected Report</strong>
            <div style={{ marginTop: '8px', color: '#4b5563' }}>
              {selectedInquiry.location}
            </div>
          </div>
        ) : (
          <div style={cardStyle}>
            <em>Click a bee icon on the map to select a report.</em>
          </div>
        )}

        {/* Recommended Volunteer */}
        {selectedInquiry && closestVolunteers.length > 0 && (
          <div style={cardStyle}>
            <strong>Recommended:</strong>{' '}
            {closestVolunteers[0].name}{' '}
            <span style={{ color: '#10b981' }}>
              ({closestVolunteers[0].score.toFixed(1)}/100)
            </span>
          </div>
        )}

        {/* Radius Selector */}
        <label style={{ marginBottom: '6px', color: '#4b5563' }}>
          <strong>Search Radius</strong>
        </label>
        <select
          style={selectStyle}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        >
          {[1, 2, 5, 10, 20].map((r) => (
            <option key={r} value={r}>{r} km</option>
          ))}
        </select>

        {/* Volunteer List */}
        {selectedInquiry && (
          availableVolunteers.length > 0 ? (
            <ul style={listStyle}>
              {availableVolunteers.map((v) => (
                <li key={v.id} style={{ marginBottom: '12px' }}>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="volSelect"
                      checked={selectedVolunteerIds[0] === v.id}
                      onChange={() => setSelectedVolunteerIds([v.id])}
                      style={{ marginRight: '8px' }}
                    />
                    {v.name} — {v.distance.toFixed(1)} km — score {v.score.toFixed(1)}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: '#6b7280' }}>
              No volunteers within {radius} km.
            </div>
          )
        )}

        {/* Assign Button */}
        <button
          style={assignButtonStyle}
          disabled={!selectedInquiry || selectedVolunteerIds.length === 0}
          onClick={assignToInquiry}
        >
          Assign Selected
        </button>
      </div>
    </div>
  );
};

export default VolunteerMap;
