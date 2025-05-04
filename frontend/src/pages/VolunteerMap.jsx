// VolunteerMap.jsx
import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icon for volunteers
const volunteerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const volunteersData = [
  { id: 1, name: 'Volunteer A', lat: 32.0853, lng: 34.7818 },
  { id: 2, name: 'Volunteer B', lat: 32.0925, lng: 34.7741 },
  { id: 3, name: 'Volunteer C', lat: 32.0800, lng: 34.8000 }
];

// Haversine formula to calculate distance (in kilometers)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Component to handle map clicks and update proximity
function MapClickHandler({ setNearby }) {
  useMapEvents({
    click(e) {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;

      const updated = volunteersData.map((v) => {
        const dist = calculateDistance(clickedLat, clickedLng, v.lat, v.lng);
        return { ...v, distance: dist, isNearby: dist <= 2 };
      });

      setNearby(updated);
    },
  });

  return null;
}

const VolunteerMap = () => {
  const [volunteers, setVolunteers] = useState(volunteersData);

  return (
    <MapContainer center={[32.0853, 34.7818]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      {/* OpenStreetMap layer */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Click handler */}
      <MapClickHandler setNearby={setVolunteers} />

      {/* Volunteer markers */}
      {volunteers.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={volunteerIcon}
          opacity={v.isNearby ? 1.0 : 0.4}
        >
          <Popup>
            {v.name}
            {v.distance !== undefined &&
              ` (${v.distance.toFixed(2)} km)`}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default VolunteerMap;
