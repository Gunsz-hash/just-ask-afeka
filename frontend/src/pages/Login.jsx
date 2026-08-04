import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', {
        email: credentials.email,       // ✅ תוקן: היה email (undefined)
        password: credentials.password  // ✅ תוקן: היה password (undefined)
      });

      // שמירת הטוקן החתום
      localStorage.setItem('ask_token', response.data.access_token);

      // שמירת פרטי המשתמש לתצוגה
      localStorage.setItem('ask_user', JSON.stringify(response.data.user));

      // ✅ תוקן: ניווט לפורום אחרי התחברות מוצלחת
      navigate('/forum');

    } catch (error) {
      // ✅ תוקן: שימוש ב-state במקום alert
      setErrorMsg('שגיאה בהתחברות: אימייל או סיסמה שגויים');
    }
  };

  return (
    <div style={{ textAlign: 'center', direction: 'rtl', marginTop: '30px', fontFamily: 'Arial' }}>
      <div style={{ marginBottom: '20px' }}><Link to="/"><img src={logo} alt="Logo" style={{ maxWidth: '260px' }} /></Link></div>
      <h1 style={{ color: '#3A7D33', marginBottom: '80px' }}>התחברות למערכת</h1>
      <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'right', padding: '30px', border: '1px solid #ddd', borderRadius: '15px', backgroundColor: '#f9f9f9', width: '100%', maxWidth: '350px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '15px' }}><label style={{ fontWeight: 'bold' }}>אימייל: </label><br/><input type="email" value={credentials.email} onChange={e => setCredentials({...credentials, email: e.target.value})} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
        <div style={{ marginBottom: '25px' }}><label style={{ fontWeight: 'bold' }}>סיסמה: </label><br/><input type="password" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
        <button type="submit" style={{ backgroundColor: '#3A7D33', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>היכנס</button>
        {errorMsg && <p style={{ color: 'red', marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>{errorMsg}</p>}
      </form>
    </div>
  );
}
