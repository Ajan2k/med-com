import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getAppointments: () => api.get('/admin/appointments'),
  getPharmacyOrders: () => api.get('/admin/pharmacy_queue'),
  
  // UPDATED FUNCTION: Accepts extraData object
  updateStatus: (type, id, status, extraData = {}) => api.post(`/admin/update_status`, null, { 
    params: { 
        item_type: type, 
        item_id: id, 
        new_status: status,
        new_date: extraData.date, // Send Date
        new_time: extraData.time  // Send Time
    } 
  }),
};