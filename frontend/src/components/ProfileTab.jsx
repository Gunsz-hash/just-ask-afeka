import React, { useState } from 'react';
import axios from 'axios';
import { getRoleDetails, availableElectivesList } from '../utils/constants';

export default function ProfileTab({ currentUser, fetchData, handleSendMessage }) {
  const [searchProfileQuery, setSearchProfileQuery] = useState('');
  const [searchedProfile, setSearchedProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [myElectives, setMyElectives] = useState(currentUser.electives || []);

  const handleSearchProfile = async () => {
    if(!searchProfileQuery.trim()) return;
    setProfileError(''); setSearchedProfile(null);
    try {
        const res = await axios.get(`http://127.0.0.1:8000/api/users/profile/${searchProfileQuery}`);
        setSearchedProfile(res.data);
    } catch (err) { setProfileError("לא נמצאו משתמשים עם שם זה."); }
  }

  const toggleElective = (course) => {
    if (myElectives.includes(course)) setMyElectives(myElectives.filter(c => c !== course));
    else setMyElectives([...myElectives, course]);
  }

  const handleSaveElectives = async () => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/users/${currentUser.email}/electives`, { electives: myElectives });
      const updatedUser = { ...currentUser, electives: myElectives };
      localStorage.setItem('ask_user', JSON.stringify(updatedUser));
      alert('נשמר! הפיד יעודכן.');
      fetchData();
    } catch (e) { alert('שגיאה בשמירה.'); }
  }

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      <div style={{ flex: '1', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRight: '5px solid #1a365d' }}>
        <h2 style={{ color: '#1a365d', marginTop: 0 }}>הפרופיל שלי</h2>
        <div style={{ fontSize: '1.1em', lineHeight: '1.8' }}>
          <p><strong>שם:</strong> {currentUser.name}</p><p><strong>אימייל:</strong> {currentUser.email}</p><p><strong>תפקיד:</strong> {getRoleDetails(currentUser.role).text}</p><p><strong>מסלול לימודים:</strong> {currentUser.major}</p>
        </div>
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <h3 style={{ color: '#3A7D33', margin: '0 0 10px 0' }}>קורסי בחירה מועדפים</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {availableElectivesList.map(course => (
              <label key={course} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: myElectives.includes(course) ? '#e2f0e2' : '#f8f9fa', padding: '8px 15px', borderRadius: '20px', border: `1px solid ${myElectives.includes(course) ? '#3A7D33' : '#ccc'}`, cursor: 'pointer', transition: '0.2s' }}>
                <input type="checkbox" checked={myElectives.includes(course)} onChange={() => toggleElective(course)} style={{ cursor: 'pointer', display: 'none' }} />
                <span style={{ color: myElectives.includes(course) ? '#2d6a2d' : '#444', fontWeight: myElectives.includes(course) ? 'bold' : 'normal' }}>{course}</span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: '20px' }}><button onClick={handleSaveElectives} style={{ backgroundColor: '#3A7D33', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>שמור העדפות קורסים</button></div>
        </div>
      </div>
      <div style={{ flex: '2', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#3A7D33', marginTop: 0 }}>🔍 חיפוש משתמשים במערכת</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input type="text" placeholder="שם המשתמש במדויק (למשל: רועי)" value={searchProfileQuery} onChange={e => setSearchProfileQuery(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }} />
          <button onClick={handleSearchProfile} style={{ backgroundColor: '#3A7D33', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>חפש</button>
        </div>
        {profileError && <p style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '1.1em' }}>❌ {profileError}</p>}
        {searchedProfile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {searchedProfile.map((profile, index) => (
            <div key={index} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', backgroundColor: '#f8f9fa', borderRight: '5px solid #3A7D33' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1a365d' }}>{profile.name}</h3>
              <p style={{ margin: '3px 0' }}><strong>תפקיד:</strong> {getRoleDetails(profile.role).text}</p>
              {profile.major && <p style={{ margin: '3px 0' }}><strong>מסלול:</strong> {profile.major}</p>}
              <button onClick={() => handleSendMessage(profile.email, profile.name)} style={{ marginTop: '15px', backgroundColor: '#0056b3', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>✉️ פתח שיחה</button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}