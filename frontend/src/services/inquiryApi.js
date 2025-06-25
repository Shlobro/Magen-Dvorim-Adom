// frontend/src/services/inquiryApi.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function fetchCoordinatorInquiries(coordinatorId) {
  const res = await axios.get(`${API_BASE}/api/inquiries`, { params: { coordinatorId } });
  return res.data;
}

export async function takeOwnership(inquiryId, coordinatorId) {
  return axios.post(`${API_BASE}/api/inquiries/${inquiryId}/take-ownership`, { coordinatorId });
}

export async function fetchVolunteerInquiries(volunteerId) {
  const res = await axios.get(`${API_BASE}/api/inquiries/volunteer/${volunteerId}`);
  return res.data;
}

export async function updateInquiryStatus(inquiryId, status, closureReason = null) {
  const payload = { status };
  if (closureReason) {
    payload.closureReason = closureReason;
  }
  return axios.post(`${API_BASE}/api/inquiries/${inquiryId}/status`, payload);
}

export async function reassignVolunteer(inquiryId, newVolunteerId) {
  return axios.post(`${API_BASE}/api/inquiries/${inquiryId}/reassign`, { volunteerId: newVolunteerId });
}
