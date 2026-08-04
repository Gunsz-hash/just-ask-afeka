import React, { useState } from 'react';
import axios from 'axios';

export default function AdminPanel({ usersList, reportsList, fetchData }) {
  const [adminTab, setAdminTab] = useState('users');

  const toggleBlock = async (email, status) => {
    await axios.patch(`http://127.0.0.1:8000/api/users/${email}/block?block_status=${!status}`);
    fetchData();
  }

  const dismissReport = async (id) => {
    await axios.delete(`http://127.0.0.1:8000/api/reports/${id}`);
    fetchData();
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#d9534f', marginTop: 0 }}>ניהול מערכת</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setAdminTab('users')} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: adminTab === 'users' ? '#3A7D33' : '#e2e8f0', color: adminTab === 'users' ? 'white' : '#4a5568', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>ניהול משתמשים</button>
        <button onClick={() => setAdminTab('reports')} style={{ padding: '10px 20px', backgroundColor: adminTab === 'reports' ? '#d9534f' : '#e2e8f0', color: adminTab === 'reports' ? 'white' : '#4a5568', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>דיווחים לבדיקה ({reportsList.length})</button>
      </div>
      {adminTab === 'users' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead><tr style={{ backgroundColor: '#f1f1f1', textAlign: 'right' }}><th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>שם</th><th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>אימייל</th><th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>סטטוס</th><th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>פעולות</th></tr></thead>
          <tbody>
            {usersList.map(u => (
              <tr key={u.email} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{u.name}</td><td style={{ padding: '10px' }}>{u.email}</td><td style={{ padding: '10px', color: u.is_blocked ? 'red' : 'green', fontWeight: 'bold' }}>{u.is_blocked ? 'חסום' : 'פעיל'}</td>
                <td style={{ padding: '10px' }}><button onClick={() => toggleBlock(u.email, u.is_blocked)} style={{ backgroundColor: u.is_blocked ? '#28a745' : '#f0ad4e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>{u.is_blocked ? 'שחרר חסימה' : 'חסום משתמש'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          {reportsList.length === 0 ? <p style={{ color: '#666' }}>אין דיווחים שממתינים לטיפול.</p> : reportsList.map(r => (
            <div key={r._id} style={{ border: '1px solid #f5c6cb', padding: '20px', marginBottom: '15px', borderRadius: '8px', backgroundColor: '#fdf2f2' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong>מדווח:</strong> {r.reporter_name} <span style={{ fontSize: '0.8em', color: 'gray' }}>({r.created_at})</span></p>
              <p style={{ margin: '0 0 10px 0' }}><strong>התוכן שדווח:</strong> {r.reported_item}</p>
              <p style={{ margin: '0 0 15px 0' }}><strong>סיבת הדיווח:</strong> <span style={{ color: '#721c24', fontWeight: 'bold' }}>{r.reason}</span></p>
              <button onClick={() => dismissReport(r._id)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>סמן כטופל / מחק דיווח</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}