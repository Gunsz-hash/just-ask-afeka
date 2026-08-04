import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../logo.png';
import { majorsList } from '../utils/constants';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student', major: 'הנדסת תוכנה' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/register', formData);

            // 🔧 תיקון לדמו (4): שמירת ה-JWT שהשרת מחזיר עכשיו מההרשמה.
      // בלי זה - משתמש חדש שנרשם ומנסה לפרסם שאלה מקבל 403,
      // כי כל ה-endpoints של יצירת תוכן דורשים טוקן.
      localStorage.setItem('ask_token', res.data.access_token);

            // 🔧 תיקון לדמו (4): שמירת המשתמש כפי שהשרת החזיר אותו,
      // ולא מ-formData - כדי שה-role יהיה זה שהשרת אישר בפועל
      // (למשל אם השרת חסם role לא מורשה).
      localStorage.setItem('ask_user', JSON.stringify(res.data.user));

      setMessage("ההרשמה בוצעה בהצלחה! מעביר לפורום... 🎉");
      setTimeout(() => navigate('/forum'), 1500);
    } catch (error) {
      // 🔧 שיפור קטן: הצגת הודעת השגיאה מהשרת אם קיימת (למשל "Email exists")
      const serverMsg = error.response?.data?.detail;
      setMessage(serverMsg === 'Email exists' ? "האימייל הזה כבר רשום במערכת ❌" : "אופס, משהו השתבש בהרשמה ❌");
    }
  }

  return (
    <div style={{ textAlign: 'center', direction: 'rtl', marginTop: '30px', fontFamily: 'Arial' }}>
      <div style={{ marginBottom: '20px' }}><Link to="/"><img src={logo} alt="Logo" style={{ maxWidth: '260px' }} /></Link></div>
      <h1 style={{ color: '#3A7D33', marginBottom: '40px' }}>🎓 הצטרפות לקהילת A.S.K</h1>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', textAlign: 'right', padding: '30px', border: '1px solid #ddd', borderRadius: '15px', backgroundColor: '#f9f9f9', boxSizing: 'border-box', maxWidth: '420px', width: '100%', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '15px' }}><label style={{ fontWeight: 'bold' }}>שם מלא: </label><br/><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
        <div style={{ marginBottom: '15px' }}><label style={{ fontWeight: 'bold' }}>מייל של אפקה: </label><br/><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
        <div style={{ marginBottom: '15px' }}><label style={{ fontWeight: 'bold' }}>בחר סיסמה: </label><br/><input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
        <div style={{ marginBottom: '15px' }}><label style={{ fontWeight: 'bold' }}>מסלול לימודים: </label><br/><select value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: 'white', boxSizing: 'border-box' }}>{majorsList.map((m, i) => <option key={i} value={m}>{m}</option>)}</select></div>
        <div style={{ marginBottom: '25px' }}><label style={{ fontWeight: 'bold' }}>מה אני: </label><br/><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: 'white', boxSizing: 'border-box' }}><option value="Candidate">מועמד</option><option value="Student">סטודנט</option><option value="Alumni">בוגר</option></select></div>
        <button type="submit" style={{ backgroundColor: '#3A7D33', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>הרשם עכשיו</button>
      </form>
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold', color: message.includes('❌') ? '#d9534f' : '#28a745' }}>{message}</p>}
    </div>
  );
}