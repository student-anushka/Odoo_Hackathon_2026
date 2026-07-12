import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

// Vehicles
export const getVehicles = (params) => api.get('/vehicles', { params });
export const getAvailableVehicles = () => api.get('/vehicles/available');
export const createVehicle = (data) => api.post('/vehicles', data);
export const updateVehicle = (id, data) => api.put(`/vehicles/${id}`, data);
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);

// Drivers
export const getDrivers = (params) => api.get('/drivers', { params });
export const getAvailableDrivers = () => api.get('/drivers/available');
export const createDriver = (data) => api.post('/drivers', data);
export const updateDriver = (id, data) => api.put(`/drivers/${id}`, data);
export const deleteDriver = (id) => api.delete(`/drivers/${id}`);

// Trips
export const getTrips = (params) => api.get('/trips', { params });
export const getTrip = (id) => api.get(`/trips/${id}`);
export const createTrip = (data) => api.post('/trips', data);
export const dispatchTrip = (id) => api.patch(`/trips/${id}/dispatch`);
export const completeTrip = (id, data) => api.patch(`/trips/${id}/complete`, data);
export const cancelTrip = (id) => api.patch(`/trips/${id}/cancel`);

// Maintenance
export const getMaintenance = (params) => api.get('/maintenance', { params });
export const createMaintenance = (data) => api.post('/maintenance', data);
export const closeMaintenance = (id, data) => api.patch(`/maintenance/${id}/close`, data);
export const deleteMaintenance = (id) => api.delete(`/maintenance/${id}`);

// Fuel & Expenses
export const getFuelLogs = (params) => api.get('/fuel/logs', { params });
export const createFuelLog = (data) => api.post('/fuel/logs', data);
export const getExpenses = (params) => api.get('/fuel/expenses', { params });
export const createExpense = (data) => api.post('/fuel/expenses', data);

// Reports
export const getDashboard = () => api.get('/reports/dashboard');
export const getAnalytics = () => api.get('/reports/analytics');
export const getExpiringLicenses = () => api.get('/reports/expiring-licenses');

export default api;
