import React, { useState } from 'react';
import axios from 'axios';
import { getRoleDetails, availableElectivesList, indTypesList } from '../utils/constants';

export default function FeedTab({ currentUser, activeTab, questions, industryPosts, searchQuery, setSearchQuery, filterCategory, setFilterCategory, indFilter, setIndFilter, handleSendMessage, handleReport, uploadGenericMedia, deleteItem, fetchData }) {

  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', category: 'לימודים', tags: [] });
  const [indTitle, setIndTitle] = useState(''); const [indContent, setIndContent] = useState(''); const [indType, setIndType] = useState('התייעצות');
  const [qImage, setQImage] = useState(null); const [indImage, setIndImage] = useState(null);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', content: '', media_url: '' });
  const [editImage, setEditImage] = useState(null);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [openCommentsState, setOpenCommentsState] = useState({});

  const toggleComments = (id) => setOpenCommentsState(prev => ({ ...prev, [id]: !prev[id] }));

  const getRelevanceScore = (q) => {
    const userElectives = currentUser.electives || [];
    const questionTags = q.tags || [];
    const userVector = availableElectivesList.map(course => userElectives.includes(course) ? 1 : 0);
    const questionVector = availableElectivesList.map(course => questionTags.includes(course) ? 1 : 0);
    let dotProduct = 0;
    for (let i = 0; i < availableElectivesList.length; i++) { dotProduct += userVector[i] * questionVector[i]; }
    let finalScore = dotProduct * 100;
    if (q.author_major === currentUser.major) finalScore += 50;
    return finalScore;
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    const scoreA = getRelevanceScore(a); const scoreB = getRelevanceScore(b);
    if (scoreA !== scoreB) return scoreB - scoreA;
    if (a.created_at && b.created_at) return b.created_at.localeCompare(a.created_at);
    return 0;
  });

  const postQuestion = async (e) => {
    e.preventDefault(); let mUrl = null;
    if (qImage) { const uRes = await uploadGenericMedia(qImage); mUrl = uRes.url; }
    await axios.post('http://127.0.0.1:8000/api/questions', { ...newQuestion, author_email: currentUser.email, author_name: currentUser.name, author_role: currentUser.role, author_major: currentUser.major, media_url: mUrl });
    setNewQuestion({ title: '', content: '', category: 'לימודים', tags: [] }); setQImage(null); setIsTagDropdownOpen(false); fetchData();
  }

  const toggleNewQuestionTag = (course) => {
    const currentTags = newQuestion.tags || [];
    if (currentTags.includes(course)) setNewQuestion({ ...newQuestion, tags: currentTags.filter(t => t !== course) });
    else setNewQuestion({ ...newQuestion, tags: [...currentTags, course] });
  }

  const postIndustry = async (e) => {
    e.preventDefault(); let mUrl = null;
    if (indImage) { const uRes = await uploadGenericMedia(indImage); mUrl = uRes.url; }
    await axios.post('http://127.0.0.1:8000/api/industry', { title: indTitle, content: indContent, post_type: indType, author_email: currentUser.email, author_name: currentUser.name, author_role: currentUser.role, author_major: currentUser.major, media_url: mUrl });
    setIndTitle(''); setIndContent(''); setIndImage(null); fetchData();
  }

  const startEdit = (item) => {
    setEditingId(item._id); setEditData({ title: item.title, content: item.content, media_url: item.media_url || '' }); setEditImage(null);
  };

  const handleUpdate = async (colName) => {
    let finalUrl = editData.media_url;
    if (editImage) { const uRes = await uploadGenericMedia(editImage); finalUrl = uRes.url; }
    await axios.patch(`http://127.0.0.1:8000/api/${colName}/${editingId}`, { ...editData, media_url: finalUrl });
    setEditingId(null); setEditImage(null); fetchData();
  };

  const postReply = async (collection, id) => {
    if (!replyContent.trim()) return;
    await axios.post(`http://127.0.0.1:8000/api/${collection}/${id}/reply`, { author_email: currentUser.email, author_name: currentUser.name, author_role: currentUser.role, author_major: currentUser.major, content: replyContent });
    setReplyContent(''); setActiveReplyId(null); setOpenCommentsState(p => ({...p, [id]: true})); fetchData();
  }

  const renderCard = (p, colName) => {
    const isOwner = currentUser.email === p.author_email;
    const isAdmin = currentUser.role === 'Admin';
    const isOpen = openCommentsState[p._id];
    const isEditing = editingId === p._id;

    return (
      <div key={p._id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRight: `5px solid ${colName==='industry'?'#1a365d':'#3A7D33'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: colName==='industry'?'#1a365d':'#3A7D33' }}>{p.author_name}</span>
              {p.author_role && <span style={{ backgroundColor: getRoleDetails(p.author_role).color, color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75em', fontWeight: 'bold', marginRight: '8px' }}>{getRoleDetails(p.author_role).text}</span>}
            </div>
            {p.author_major && <div style={{ fontSize: '0.85em', color: '#6c757d', marginTop: '4px', marginBottom: '4px' }}>📚 {p.author_major}</div>}
            {p.tags && p.tags.length > 0 && !isEditing && (
              <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
                {p.tags.map(tag => ( <span key={tag} style={{ backgroundColor: '#e2f0e2', color: '#2d6a2d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75em', border: '1px solid #3A7D33' }}>🏷️ {tag}</span> ))}
              </div>
            )}
            {!isEditing && (
              <div style={{ marginTop: '8px' }}>
                {!isOwner && <button onClick={()=>handleSendMessage(p.author_email, p.author_name)} style={{background:'none', border:'none', color:'#0056b3', cursor:'pointer', fontSize:'0.9em', padding:0, marginRight:'15px'}}>✉️ הודעה</button>}
                <button onClick={()=>handleReport(`פוסט: ${p.title} (מאת: ${p.author_name})`)} style={{background:'none', border:'none', color:'#d9534f', cursor:'pointer', fontSize:'0.9em', padding:0}}>🚩 דווח</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ color: '#888', fontSize: '0.9em', textAlign: 'left' }}><div>{p.created_at} | {p.category || p.post_type}</div>{p.updated_at && <div style={{ color: '#3A7D33', fontSize: '0.85em', marginTop: '2px' }}>✏️ נערך ב: {p.updated_at}</div>}</div>
            {!isEditing && isOwner && <button onClick={() => startEdit(p)} style={{ backgroundColor: 'transparent', color: '#0056b3', border: 'none', cursor: 'pointer', fontSize: '1.2em' }} title="ערוך">✏️</button>}
            {!isEditing && (isAdmin || isOwner) && <button onClick={()=>deleteItem(colName, p._id)} style={{ backgroundColor: 'transparent', color: '#d9534f', border: 'none', cursor: 'pointer', fontSize: '1.2em' }} title="מחק">🗑️</button>}
          </div>
        </div>

        {isEditing ? (
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            <textarea value={editData.content} onChange={e => setEditData({...editData, content: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} rows="4" />
            <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>החלף תמונה קיימת:</label><input type="file" accept="image/*" onChange={e => setEditImage(e.target.files[0])} style={{ display: 'block', marginTop: '5px' }} /></div>
            <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => handleUpdate(colName)} style={{ backgroundColor: '#3A7D33', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>שמור שינויים</button><button onClick={() => setEditingId(null)} style={{ backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>ביטול</button></div>
          </div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 10px 0', color: '#1a365d' }}>{p.title}</h3>
            <p style={{ color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{p.content}</p>
            {p.media_url && ( <div style={{ marginTop: '15px', textAlign: 'center' }}><img src={p.media_url} alt="Attached to post" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid #ddd' }} /></div> )}
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {p.replies?.length > 0 ? <button onClick={() => toggleComments(p._id)} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontWeight: 'bold', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#f0f4f8' }}>{isOpen ? '▲ הסתר תגובות' : `▼ הצג תגובות (${p.replies.length})`}</button> : <span style={{ color: '#a0aec0', fontSize: '0.9em' }}>אין תגובות</span>}
                {activeReplyId !== p._id && <button onClick={() => setActiveReplyId(p._id)} style={{ background: 'none', border: 'none', color: '#0056b3', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>💬 הגב</button>}
              </div>

              {isOpen && p.replies?.length > 0 && (
                <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderRight: '4px solid #cbd5e0', marginTop: '15px' }}>
                  {p.replies.map((r, i) => (
                    <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < p.replies.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <span style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '0.9rem' }}>{r.author_name} </span>
                      {r.author_role && <span style={{ color: getRoleDetails(r.author_role).color, fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#fff', padding: '2px 6px', borderRadius: '10px', border: `1px solid ${getRoleDetails(r.author_role).color}`, margin: '0 5px' }}>{getRoleDetails(r.author_role).text}</span>}
                      {r.author_major && <span style={{ color: '#6c757d', fontSize: '0.8rem', marginRight: '5px' }}>| 📚 {r.author_major}</span>}
                      <span style={{ color: '#a0aec0', fontSize: '0.8rem', marginRight: '5px' }}>({r.created_at})</span>
                      <p style={{ margin: '5px 0', color: '#4a5568', fontSize: '0.95rem' }}>{r.content}</p>
                      <div style={{ marginTop: '5px' }}><button onClick={()=>{setActiveReplyId(p._id); setReplyContent(`@${r.author_name}, `)}} style={{background:'none', border:'none', color:'#0056b3', cursor:'pointer', fontSize:'0.8em', padding:0, marginRight:'15px'}}>↩️ הגב לו</button><button onClick={()=>handleReport(`תגובה: ${r.content} (מאת: ${r.author_name})`)} style={{background:'none', border:'none', color:'#d9534f', cursor:'pointer', fontSize:'0.8em', padding:0}}>🚩 דווח</button></div>
                    </div>
                  ))}
                </div>
              )}

              {activeReplyId === p._id && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                  <input type="text" placeholder="כתוב תגובה..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} style={{ flex: '1', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                  <button onClick={() => postReply(colName, p._id)} style={{ backgroundColor: '#0056b3', color: 'white', border: 'none', padding: '0 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>שלח</button>
                  <button onClick={() => {setActiveReplyId(null); setReplyContent('');}} style={{ backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', padding: '0 15px', borderRadius: '5px', cursor: 'pointer' }}>ביטול</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      <div style={{ flex: '1', position: 'sticky', top: '20px' }}>
        {activeTab === 'industry' && currentUser.role === 'Candidate' ? (
          <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '10px', color: '#856404', textAlign: 'center', fontWeight: 'bold' }}>⚠️ כמועמד, אינך יכול לפרסם פוסטים באזור התעשייה.</div>
        ) : (
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#1a365d' }}>{activeTab === 'qa' ? 'פרסם שאלה לקהילה' : 'פרסם משרה או טיפ'}</h3>
            <form onSubmit={activeTab === 'qa' ? postQuestion : postIndustry}>
              <input type="text" placeholder="כותרת..." required value={activeTab === 'qa' ? newQuestion.title : indTitle} onChange={e => activeTab === 'qa' ? setNewQuestion({...newQuestion, title: e.target.value}) : setIndTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              <select value={activeTab === 'qa' ? newQuestion.category : indType} onChange={e => activeTab === 'qa' ? setNewQuestion({...newQuestion, category: e.target.value}) : setIndType(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}>
                {activeTab === 'qa' ? (<><option value="לימודים">לימודים ומבחנים</option><option value="חברתי">חברתי וכללי</option><option value="מילואים">מילואימניק/ית באפקה</option></>) : (indTypesList.map(c => <option key={c} value={c}>{c}</option>))}
              </select>

              {activeTab === 'qa' && (
                <div style={{ marginBottom: '15px', position: 'relative' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', color: '#4a5568' }}>קורסי בחירה רלוונטים (ניתן לבחור כמה):</label>
                  <div onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white', cursor: 'pointer', marginTop: '5px', minHeight: '20px' }}>
                    {newQuestion.tags.length > 0 ? newQuestion.tags.join(', ') : 'לחץ לבחירת קורסים...'}
                  </div>
                  {isTagDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                      {availableElectivesList.map(course => (
                         <label key={course} style={{ display: 'block', padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: newQuestion.tags.includes(course) ? '#e2f0e2' : 'transparent' }}>
                           <input type="checkbox" style={{ marginLeft: '10px' }} checked={newQuestion.tags.includes(course)} onChange={() => toggleNewQuestionTag(course)} /> {course}
                         </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <textarea placeholder="תוכן הפוסט..." required rows="5" value={activeTab === 'qa' ? newQuestion.content : indContent} onChange={e => activeTab === 'qa' ? setNewQuestion({...newQuestion, content: e.target.value}) : setIndContent(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }} />
              <div style={{ marginBottom: '15px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px', border: '1px dashed #ccc' }}>
                <label style={{ fontSize: '0.9em', color: '#4a5568', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>📷 {activeTab === 'qa' ? (qImage ? `נבחרה תמונה: ${qImage.name}` : 'הוסף תמונה לשאלה (אופציונלי)') : (indImage ? `נבחרה תמונה: ${indImage.name}` : 'הוסף תמונה לפוסט (אופציונלי)')}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => activeTab === 'qa' ? setQImage(e.target.files[0]) : setIndImage(e.target.files[0])} /></label>
              </div>
              <button type="submit" style={{ backgroundColor: activeTab === 'qa' ? '#3A7D33' : '#1a365d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>פרסם</button>
            </form>
          </div>
        )}
      </div>

      <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: '#4a5568' }}>סנן:</span>
          {(activeTab === 'qa' ? ['הכל', 'לימודים', 'חברתי', 'מילואים'] : ['הכל', ...indTypesList]).map(cat => (
            <button key={cat} onClick={() => activeTab === 'qa' ? setFilterCategory(cat) : setIndFilter(cat)} style={{ backgroundColor: (activeTab === 'qa' ? filterCategory : indFilter) === cat ? (activeTab === 'qa' ? '#3A7D33' : '#1a365d') : '#e2e8f0', color: (activeTab === 'qa' ? filterCategory : indFilter) === cat ? 'white' : '#4a5568', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>{cat === 'מילואים' ? 'מילואימניק/ית באפקה' : cat}</button>
          ))}
          <input type="text" placeholder="🔍 חפש בפוסטים..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginLeft: 'auto', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ccc', width: '250px' }} />
        </div>

        {activeTab === 'qa' ? (
          sortedQuestions.length === 0 ? <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>לא נמצאו שאלות.</div> : sortedQuestions.map(q => renderCard(q, 'questions'))
        ) : (
          industryPosts.length === 0 ? <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>לא נמצאו פוסטים.</div> : industryPosts.map(p => renderCard(p, 'industry'))
        )}
      </div>
    </div>
  );
}