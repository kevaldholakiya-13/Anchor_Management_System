import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Events
export const getEvents = () => api.get('/api/events').then((r) => r.data);
export const getEvent = (id) => api.get(`/api/events/${id}`).then((r) => r.data);
export const createEvent = (data) => api.post('/api/events', data).then((r) => r.data);
export const updateEvent = (id, data) => api.put(`/api/events/${id}`, data).then((r) => r.data);
export const deleteEvent = (id) => api.delete(`/api/events/${id}`).then((r) => r.data);

// Sessions
export const addSession = (eventId, data) =>
  api.post(`/api/events/${eventId}/sessions`, data).then((r) => r.data);
export const updateSession = (id, data) =>
  api.put(`/api/sessions/${id}`, data).then((r) => r.data);
export const deleteSession = (id) => api.delete(`/api/sessions/${id}`).then((r) => r.data);
export const startSession = (id) => api.post(`/api/sessions/${id}/start`).then((r) => r.data);
export const completeSession = (id) => api.post(`/api/sessions/${id}/complete`).then((r) => r.data);

// Speakers
export const addSpeaker = (eventId, data) =>
  api.post(`/api/events/${eventId}/speakers`, data).then((r) => r.data);
export const updateSpeaker = (id, data) => api.put(`/api/speakers/${id}`, data).then((r) => r.data);
export const deleteSpeaker = (id) => api.delete(`/api/speakers/${id}`).then((r) => r.data);

// Scripts
export const generateScript = (payload) =>
  api.post('/api/scripts/generate', payload).then((r) => r.data);

// Disruption
export const triggerDisruption = (payload) =>
  api.post('/api/disruption/trigger', payload).then((r) => r.data);

// Live status
export const getLiveStatus = (eventId) =>
  api.get(`/api/live/${eventId}/status`).then((r) => r.data);

export default api;
