import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo.png';
import { getRoleDetails } from '../utils/constants';

export default function Navbar({ currentUser, activeTab, setActiveTab, showAdminPanel, setShowAdminPanel, setActiveChatUser }) {
  const roleInfo = getRoleDetails(currentUser.role);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={logo} alt="Logo" style={{ height: '60px', marginTop: '5px' }} />
          <h2 style={{ margin: 0, color: '#3A7D33' }}>A.S.K Community</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#4a5568' }}>שלום, {currentUser.name}</span>
            <span style={{ backgroundColor: roleInfo.color, color: 'white', padding: '4px 10px', borderRadius: '15px', fontSize: '0.85em', fontWeight: 'bold', marginRight: '-3px' }}>
              {roleInfo.text}
            </span>
          </div>

          {currentUser.role === 'Admin' && (
            <button
              onClick={() => { setShowAdminPanel(!showAdminPanel); setActiveChatUser(null); }}
              style={{ backgroundColor: '#1a365d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {showAdminPanel ? 'חזור לפיד' : '⚙️ ניהול משתמשים'}
            </button>
          )}

          <Link
            to="/"
            onClick={() => {
              localStorage.removeItem('ask_user');
              localStorage.removeItem('ask_token');
            }}
            style={{ color: '#d9534f', textDecoration: 'none', fontWeight: 'bold' }}
          >
            התנתק
          </Link>
        </div>
      </div>

      {!showAdminPanel && (
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #ddd', padding: '0 30px', display: 'flex', gap: '20px', marginBottom: '30px', overflowX: 'auto' }}>
          <button onClick={() => { setActiveTab('qa'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'qa' ? '3px solid #3A7D33' : '3px solid transparent', color: activeTab === 'qa' ? '#3A7D33' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>💡 פיד שאלות</button>
          <button onClick={() => { setActiveTab('industry'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'industry' ? '3px solid #1a365d' : '3px solid transparent', color: activeTab === 'industry' ? '#1a365d' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>💼 תעשייה וקריירה</button>
          <button onClick={() => { setActiveTab('materials'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'materials' ? '3px solid #3A7D33' : '3px solid transparent', color: activeTab === 'materials' ? '#3A7D33' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>📚 חומרי לימוד</button>
          <button onClick={() => { setActiveTab('equipment'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'equipment' ? '3px solid #3A7D33' : '3px solid transparent', color: activeTab === 'equipment' ? '#3A7D33' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>🛒 יד שנייה</button>
          <button onClick={() => { setActiveTab('inbox'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'inbox' ? '3px solid #0056b3' : '3px solid transparent', color: activeTab === 'inbox' ? '#0056b3' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>✉️ הודעות פרטיות</button>
          <button onClick={() => { setActiveTab('profile'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'profile' ? '3px solid #1a365d' : '3px solid transparent', color: activeTab === 'profile' ? '#1a365d' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>👤 פרופיל</button>
          <button onClick={() => { setActiveTab('ai'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'ai' ? '3px solid #6f42c1' : '3px solid transparent', color: activeTab === 'ai' ? '#6f42c1' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>🤖 סוכן A.S.K</button>
          {currentUser.role === 'Admin' && (
            <button onClick={() => { setActiveTab('knowledge'); setActiveChatUser(null); }} style={{ padding: '15px 10px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'knowledge' ? '3px solid #6f42c1' : '3px solid transparent', color: activeTab === 'knowledge' ? '#6f42c1' : '#666', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>📂 מאגר ידע</button>
          )}
        </div>
      )}
    </>
  );
}
