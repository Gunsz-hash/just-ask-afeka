import React, { useState } from 'react';
import axios from 'axios';
import { matCategoriesList, eqCategoriesList } from '../utils/constants';

export default function MaterialsTab({ currentUser, activeTab, materials, equipmentList, matSearch, setMatSearch, eqSearch, setEqSearch, matFilter, setMatFilter, eqFilter, setEqFilter, handleSendMessage, handleReport, deleteItem, fetchData }) {
  const [matTitle, setMatTitle] = useState('');
  const [matCat, setMatCat] = useState('סיכומי הרצאות');
  const [matFile, setMatFile] = useState(null);
  const [eqDesc, setEqDesc] = useState('');
  const [eqCat, setEqCat] = useState('ספרים');
  const [eqFile, setEqFile] = useState(null);

  const uploadFile = async (e, type) => {
    e.preventDefault();
    const fd = new FormData();
    if(type === 'materials') {
      if (!matFile) return alert("בחר קובץ");
      fd.append('title', matTitle);
      fd.append('uploader_name', currentUser.name);
      fd.append('uploader_email', currentUser.email);
      fd.append('uploader_major', currentUser.major);
      fd.append('category', matCat);
      fd.append('file', matFile);
      await axios.post('http://127.0.0.1:8000/api/materials', fd);
      setMatTitle(''); setMatFile(null);
    }
    if(type === 'equipment') {
      if (!eqFile) return alert("בחר קובץ");
      fd.append('description', eqDesc);
      fd.append('seller_name', currentUser.name);
      fd.append('seller_email', currentUser.email);
      fd.append('seller_major', currentUser.major);
      fd.append('category', eqCat);
      fd.append('file', eqFile);
      await axios.post('http://127.0.0.1:8000/api/equipment', fd);
      setEqDesc(''); setEqFile(null);
    }
    fetchData();
    alert("הועלה בהצלחה!");
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {(activeTab === 'materials' && currentUser.role === 'Candidate') ? (
        <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '10px', color: '#856404', textAlign: 'center', fontWeight: 'bold' }}>⚠️ כמועמד, אינך יכול להעלות חומרי לימוד, אך תוכל להוריד קבצים ששותפו.</div>
      ) : (
        <form onSubmit={(e) => uploadFile(e, activeTab)} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: activeTab === 'equipment' ? 'column' : 'row', gap: '15px', alignItems: activeTab === 'equipment' ? 'stretch' : 'center', flexWrap: 'wrap' }}>
          {activeTab === 'equipment' && <h3 style={{ margin: '0 0 5px 0', color: '#d9534f' }}>פרסם פריט למכירה</h3>}
          <div style={{ display: 'flex', gap: '15px', flex: activeTab === 'equipment' ? 'none' : 2, width: '100%' }}>
            {activeTab === 'materials' ? <input type="text" placeholder="שם הקורס (למשל: ליניארית 1)" required value={matTitle} onChange={e => setMatTitle(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} /> : null}
            <select value={activeTab === 'materials' ? matCat : eqCat} onChange={e => activeTab === 'materials' ? setMatCat(e.target.value) : setEqCat(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
              {(activeTab === 'materials' ? matCategoriesList : eqCategoriesList).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, border: `2px dashed ${activeTab === 'materials' ? '#3A7D33' : '#d9534f'}`, padding: '10px', borderRadius: '5px', textAlign: 'center', backgroundColor: '#f9fcf9', width: '100%', boxSizing: 'border-box' }}>
            <input type="file" accept={activeTab === 'equipment' ? 'image/*' : '*'} required onChange={e => activeTab === 'materials' ? setMatFile(e.target.files[0]) : setEqFile(e.target.files[0])} style={{ width: '100%' }} />
          </div>
          {activeTab === 'equipment' && <textarea placeholder="תאר את המוצר ומחיר" required rows="3" value={eqDesc} onChange={e => setEqDesc(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }} />}
          <button type="submit" style={{ backgroundColor: activeTab === 'materials' ? '#3A7D33' : '#d9534f', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', alignSelf: activeTab === 'equipment' ? 'flex-end' : 'auto' }}>{activeTab === 'materials' ? 'העלה קובץ' : 'פרסם מוצר'}</button>
        </form>
      )}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', color: '#4a5568' }}>סנן קטגוריה:</span>
        {['הכל', ...(activeTab === 'materials' ? matCategoriesList : eqCategoriesList)].map(c => (
          <button key={c} onClick={() => activeTab === 'materials' ? setMatFilter(c) : setEqFilter(c)} style={{ backgroundColor: (activeTab === 'materials' ? matFilter : eqFilter) === c ? (activeTab === 'materials' ? '#3A7D33' : '#d9534f') : '#e2e8f0', color: (activeTab === 'materials' ? matFilter : eqFilter) === c ? 'white' : '#4a5568', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>{c}</button>
        ))}
        <input type="text" placeholder={activeTab === 'materials' ? "🔍 חפש לפי קורס..." : "🔍 חפש לפי מוצר..."} value={activeTab === 'materials' ? matSearch : eqSearch} onChange={(e) => activeTab === 'materials' ? setMatSearch(e.target.value) : setEqSearch(e.target.value)} style={{ marginLeft: 'auto', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ccc', width: '250px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {(activeTab === 'materials' ? materials : equipmentList).length === 0 ? <p style={{ color: '#666' }}>אין פריטים בקטגוריה זו.</p> : (activeTab === 'materials' ? materials : equipmentList).map(item => (
          <div key={item._id} style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden', padding: activeTab === 'materials' ? '20px' : '0', borderTop: activeTab === 'materials' ? '4px solid #3A7D33' : 'none' }}>
            {activeTab === 'equipment' && <div style={{ height: '200px', backgroundColor: '#f0f0f0', backgroundImage: `url("${encodeURI(item.image_url)}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>}
            <div style={{ padding: activeTab === 'equipment' ? '15px' : '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}><h3 style={{ margin: 0, color: '#1a365d', fontSize: '1.2em' }}>{activeTab === 'materials' ? item.title : ''}</h3><span style={{ backgroundColor: activeTab === 'materials' ? '#e2f0e2' : '#f8d7da', color: activeTab === 'materials' ? '#2d6a2d' : '#721c24', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8em', fontWeight: 'bold' }}>{item.category}</span></div>
              {activeTab === 'equipment' && <p style={{ margin: '0 0 15px 0', color: '#1a365d', fontSize: '1em', whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{item.description}</p>}
              <p style={{ color: '#666', fontSize: '0.9em', margin: '0 0 15px 0' }}>מאת: <strong>{item.uploader_name || item.seller_name}</strong> {(item.uploader_major || item.seller_major) && <span> (📚 {item.uploader_major || item.seller_major})</span>}<br/>{item.created_at}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                {activeTab === 'materials' && <a href={encodeURI(item.file_url)} target="_blank" rel="noreferrer" style={{ backgroundColor: '#edf2f7', color: '#2b6cb0', padding: '8px 15px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9em' }}>📥 הורד קובץ</a>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(() => {
                    // הגדרת מייל ושם ברירת מחדל לפריטים ישנים כדי לאפשר דמו חלק
                    const email = item.uploader_email || item.seller_email || "demo@s.afeka.ac.il";
                    const name  = item.uploader_name  || item.seller_name  || "סטודנט דמו";

                    return email !== currentUser.email
                      ? <button onClick={() => handleSendMessage(email, name)} style={{ background: 'none', border: 'none', color: '#0056b3', cursor: 'pointer', fontSize: '0.9em', padding: 0 }}>✉️ הודעה</button>
                      : null;
                  })()}
                  <button onClick={() => handleReport(`פריט: ${item.title || item.description} (מאת: ${item.uploader_name || item.seller_name})`)} style={{ background: 'none', border: 'none', color: '#d9534f', cursor: 'pointer', fontSize: '0.9em', padding: 0 }}>🚩 דווח</button>
                  {(currentUser.role === 'Admin' || currentUser.name === (item.uploader_name || item.seller_name)) && <button onClick={() => deleteItem(activeTab, item._id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.1em', padding: 0, marginLeft: '5px' }}>🗑️</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}