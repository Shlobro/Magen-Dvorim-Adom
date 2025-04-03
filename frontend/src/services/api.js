// frontend/src/services/api.js
import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export const getUser = (id) => axios.get(`${API_BASE}/user/${id}`);
export const saveUser = (user) => axios.post(`${API_BASE}/user`, user);
export const saveInquiry = (inquiry) => axios.post(`${API_BASE}/inquiry`, inquiry);
export const uploadPhoto = (inquiryId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('inquiryId', inquiryId);
  return axios.post(`${API_BASE}/inquiry/upload-photo`, formData);
};
export const linkUserToInquiry = (link) => axios.post(`${API_BASE}/link`, link);
export const queryUsers = (filters) => axios.get(`${API_BASE}/users`, { params: filters });
