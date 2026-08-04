import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// שומר הסף: לפני כל בקשה לשרת, בדוק אם יש טוקן וצרף אותו
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('ask_token');
  if (token) {
    // הוספת הטוקן ל-Header בדיוק לפי תקן האבטחה (Bearer)
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
