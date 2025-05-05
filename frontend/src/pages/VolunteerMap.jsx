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
// Custom icons
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

/**
 * Haversine formula to calculate distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Component to handle map clicks and filter volunteers within 2km
 */
function MapClickHandler({ volunteers, setVolunteers }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const updated = volunteers.map((v) => {
        const dist = calculateDistance(lat, lng, v.lat, v.lng);
        return { ...v, distance: dist, isNearby: dist <= 2 };
      });
      setVolunteers(updated);
    },
  });
  return null;
}

const VolunteerMap = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [closestVolunteers, setClosestVolunteers] = useState([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);

  /**
   * Load volunteers with coordinates
   */
  useEffect(() => {
    axios
      .get('http://localhost:3001/user')
      .then((res) => {
        const geoUsers = res.data.filter((u) => u.lat && u.lng);
        const initialized = geoUsers.map((u) => ({ ...u, isNearby: true }));
        setVolunteers(initialized);
      })
      .catch((err) => {
        console.error('Failed to load volunteers:', err);
      });
  }, []);

  /**
   * Load inquiries with lat/lng and status !== 'finished'
   */
  useEffect(() => {
    axios
      .get('http://localhost:3001/inquiry')
      .then((res) => {
        const activeInquiries = res.data.filter(
          (i) => i.lat && i.lng && i.status !== 'finished'
        );
        setInquiries(activeInquiries);
      })
      .catch((err) => {
        console.error('Failed to load inquiries:', err);
      });
  }, []);

  /**
   * On inquiry marker click – find closest volunteers (max 5) matching qualification
   */
  function handleInquiryClick(inquiry) {
    setSelectedInquiryId(inquiry.id);

    const matches = volunteers
      .filter((v) => {
        if (!v.lat || !v.lng) return false;
        if (inquiry.qualification) {
          return v.qualification && v.qualification.includes(inquiry.qualification);
        }
        return true;
      })
      .map((v) => ({
        ...v,
        distance: calculateDistance(inquiry.lat, inquiry.lng, v.lat, v.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Closest 5 volunteers

    setClosestVolunteers(matches);
    setSelectedVolunteerIds([]); // Reset
  }

  /**
   * Assign selected volunteer to inquiry (POST)
   */
  function assignVolunteersToInquiry(inquiryId) {
    const selectedId = selectedVolunteerIds[0];
    if (!selectedId) {
      alert("Please select a volunteer to assign.");
      return;
    }

    axios
      .post(`http://localhost:3001/inquiry/${inquiryId}/assign-volunteer`, {
        volunteerId: selectedId
      })
      .then(() => {
        alert('Volunteer assigned successfully.');
        setSelectedInquiryId(null);
        setClosestVolunteers([]);
      })
      .catch((err) => {
        console.error('Error assigning volunteer:', err);
      });
  }

  return (
    <MapContainer center={[32.0853, 34.7818]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <MapClickHandler volunteers={volunteers} setVolunteers={setVolunteers} />

      {/* Volunteer markers */}
      {volunteers.map((v) => {
        const isHighlighted = closestVolunteers.some(
          (cv) => cv.id === v.id && selectedInquiryId
        );
        return (
          <Marker
            key={`volunteer-${v.id}`}
            position={[v.lat, v.lng]}
            icon={volunteerIcon}
            opacity={isHighlighted ? 1.0 : 0.4}
          >
            <Popup>
              <strong>{v.name}</strong>
              <br />
              {v.distance !== undefined && `${v.distance.toFixed(2)} km`}
            </Popup>
          </Marker>
        );
      })}

      {/* Inquiry markers */}
      {inquiries.map((i) => (
        <Marker
          key={`inquiry-${i.id}`}
          position={[i.lat, i.lng]}
          icon={inquiryIcon}
          eventHandlers={{
            click: () => handleInquiryClick(i),
          }}
        >
          <Popup>
            <strong>Inquiry</strong>
            <br />
            Address: {i.location}
            <br />
            Status: {i.status}
            <br />
            {i.qualification && (
              <>
                Required: {i.qualification}
                <br />
              </>
            )}
            {selectedInquiryId === i.id && closestVolunteers.length > 0 && (
              <>
                <hr />
                <strong>Closest Volunteers:</strong>
                <ul style={{ maxHeight: '120px', overflowY: 'auto', paddingLeft: '18px' }}>
                  {closestVolunteers.map((v) => (
                    <li key={v.id}>
                      <label>
                        <input
                          type="radio"
                          name={`volunteer-select-${i.id}`}
                          checked={selectedVolunteerIds[0] === v.id}
                          onChange={() => setSelectedVolunteerIds([v.id])}
                        />
                        {v.name} ({v.distance.toFixed(2)} km)
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => assignVolunteersToInquiry(i.id)}
                  style={{ marginTop: '8px' }}
                >
                  Assign Selected
                </button>
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default VolunteerMap;
