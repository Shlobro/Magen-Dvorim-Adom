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
