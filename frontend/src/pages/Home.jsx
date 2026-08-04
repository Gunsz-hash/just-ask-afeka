import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo.png';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9f9f9', direction: 'rtl', fontFamily: 'Arial' }}>
      <img src={logo} alt="A.S.K Logo" style={{ maxWidth: '300px', marginBottom: '20px' }} />
      <h1 style={{ color: '#3A7D33', fontSize: '2.5rem', marginBottom: '30px' }}>ברוכים הבאים ל-A.S.K</h1>
      <p style={{ color: '#4a5568', fontSize: '1.2rem', marginBottom: '40px', textAlign: 'center', maxWidth: '500px' }}>הפלטפורמה הקהילתית האקדמית שמחברת בין סטודנטים, בוגרים ומועמדים לשיתוף ידע ותמיכה.</p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/login" style={{ textDecoration: 'none' }}><button style={{ backgroundColor: '#3A7D33', color: 'white', padding: '12px 40px', borderRadius: '5px', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', width: '150px' }}>התחברות</button></Link>
        <Link to="/register" style={{ textDecoration: 'none' }}><button style={{ backgroundColor: 'white', color: '#3A7D33', padding: '12px 40px', borderRadius: '5px', border: '2px solid #3A7D33', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', width: '150px' }}>הרשמה</button></Link>
      </div>
    </div>
  );
}