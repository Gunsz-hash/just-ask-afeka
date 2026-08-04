import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE = 'http://127.0.0.1:8000';

export default function InboxTab({ currentUser, messagesList, activeChatUser, setActiveChatUser, handleSendMessage, uploadGenericMedia, fetchData }) {
  const [chatInputText, setChatInputText]   = useState('');
  const [chatFile, setChatFile]             = useState(null);
  const [showSearch, setShowSearch]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const searchRef                           = useRef(null);

  // חיפוש משתמשים לפי שם (debounce 300ms)
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${BASE}/api/users/search?name=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.filter(u => u.email !== currentUser.email));
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // סגירת חיפוש בלחיצה מחוץ
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const startChat = (user) => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    handleSendMessage(user.email, user.name);
  };

  const sendInActiveChat = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() && !chatFile) return;
    let mUrl = null, fName = null;
    if (chatFile) { const r = await uploadGenericMedia(chatFile); mUrl = r.url; fName = r.file_name; }
    await axios.post(`${BASE}/api/messages`, {
      sender_email: currentUser.email, sender_name: currentUser.name,
      receiver_email: activeChatUser.email, receiver_name: activeChatUser.name,
      content: chatInputText, media_url: mUrl, file_name: fName
    });
    setChatInputText(''); setChatFile(null); fetchData();
  };

  const deleteConversation = async (partnerEmail) => {
    if (!window.confirm('האם למחוק את השיחה?')) return;
    await axios.delete(`${BASE}/api/messages/${currentUser.email}/${partnerEmail}`);
    if (activeChatUser?.email === partnerEmail) setActiveChatUser(null);
    fetchData();
  };

  // בניית רשימת שיחות
  const conversations = {};
  messagesList.forEach(m => {
    const isMine = m.sender_email === currentUser.email;
    const partnerEmail = isMine ? m.receiver_email : m.sender_email;
    const partnerName  = isMine ? m.receiver_name  : m.sender_name;
    if (!conversations[partnerEmail]) conversations[partnerEmail] = { email: partnerEmail, name: partnerName, messages: [] };
    conversations[partnerEmail].messages.push(m);
  });
  const chatPartners = Object.keys(conversations).sort((a, b) =>
    conversations[a].messages[0].created_at < conversations[b].messages[0].created_at ? 1 : -1
  );
  const currentChatMessages = activeChatUser ? (conversations[activeChatUser.email]?.messages || []) : [];

  const roleLabel = { 'Student': 'סטודנט', 'Alumni': 'בוגר', 'Admin': 'מנהל', 'Candidate': 'מועמד', 'Industry': 'תעשייה' };

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', height: '600px', display: 'flex', flexDirection: 'column' }}>

      {!activeChatUser ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#0056b3', margin: 0 }}>✉️ השיחות שלי</h2>

            {/* כפתור + חיפוש משתמש */}
            <div style={{ position: 'relative' }} ref={searchRef}>
              <button
                onClick={() => { setShowSearch(s => !s); setSearchQuery(''); setSearchResults([]); }}
                style={{ padding: '10px 20px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + התחל שיחה חדשה
              </button>

              {showSearch && (
                <div style={{ position: 'absolute', top: '110%', left: 0, width: '300px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, padding: '12px', direction: 'rtl' }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="חפש לפי שם..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                  />

                  {searchResults.length > 0 && (
                    <div style={{ marginTop: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {searchResults.map(user => (
                        <div
                          key={user.email}
                          onClick={() => startChat(user)}
                          style={{ padding: '10px 12px', borderRadius: '7px', cursor: 'pointer', transition: '0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ fontWeight: '600', color: '#1a365d', fontSize: '0.95rem' }}>{user.name}</div>
                          <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '2px' }}>
                            {user.major && <span>{user.major}</span>}
                            {user.major && user.role && <span> · </span>}
                            {user.role && <span>{roleLabel[user.role] || user.role}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <p style={{ color: '#a0aec0', fontSize: '0.88rem', textAlign: 'center', margin: '10px 0 4px' }}>לא נמצאו משתמשים</p>
                  )}

                  {searchQuery.trim().length < 2 && (
                    <p style={{ color: '#a0aec0', fontSize: '0.85rem', textAlign: 'center', margin: '8px 0 2px' }}>הקלד לפחות 2 אותיות</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, borderTop: '1px solid #eee', paddingTop: '10px' }}>
            {chatPartners.length === 0
              ? <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>תיבת ההודעות שלך ריקה.</div>
              : chatPartners.map(partnerEmail => (
                <div
                  key={partnerEmail}
                  onClick={() => setActiveChatUser({ email: partnerEmail, name: conversations[partnerEmail].name })}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #f1f1f1', cursor: 'pointer' }}
                >
                  <div>
                    <strong style={{ fontSize: '1.1em', color: '#1a365d' }}>{conversations[partnerEmail].name}</strong>
                    <p style={{ margin: '4px 0 0 0', color: 'gray', fontSize: '0.88em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }}>
                      {conversations[partnerEmail].messages[0].sender_email === currentUser.email ? 'אתה: ' : ''}
                      {conversations[partnerEmail].messages[0].media_url ? '📎 נשלח קובץ' : conversations[partnerEmail].messages[0].content}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '0.82em', color: '#a0aec0' }}>{conversations[partnerEmail].messages[0].created_at}</span>
                    <button onClick={e => { e.stopPropagation(); deleteConversation(partnerEmail); }} style={{ background: 'transparent', border: 'none', color: '#d9534f', cursor: 'pointer', fontSize: '1.2em' }}>🗑️</button>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setActiveChatUser(null)} style={{ background: 'none', border: 'none', color: '#0056b3', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' }}>← חזור</button>
              <h2 style={{ color: '#0056b3', margin: 0 }}>שיחה עם {activeChatUser.name}</h2>
            </div>
            <button onClick={() => deleteConversation(activeChatUser.email)} style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ מחק שיחה</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentChatMessages.slice().reverse().map(m => {
              const isMine = m.sender_email === currentUser.email;
              return (
                <div key={m._id} style={{ maxWidth: '70%', alignSelf: isMine ? 'flex-end' : 'flex-start', backgroundColor: isMine ? '#dcf8c6' : 'white', padding: '12px 15px', borderRadius: '15px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', borderBottomLeftRadius: isMine ? '15px' : '0', borderBottomRightRadius: isMine ? '0' : '15px' }}>
                  {m.content && <p style={{ margin: '0 0 5px 0', color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{m.content}</p>}
                  {m.media_url && (
                    m.media_url.match(/\.(jpeg|jpg|gif|png)$/i)
                      ? <img src={m.media_url} style={{ maxWidth: '100%', borderRadius: '8px' }} alt="קובץ מצורף" />
                      : <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: isMine ? '#2b6cb0' : '#2d6a2d', fontWeight: 'bold', textDecoration: 'none', backgroundColor: 'rgba(255,255,255,0.5)', padding: '5px 10px', borderRadius: '5px', display: 'inline-block' }}>📁 הורד: {m.file_name}</a>
                  )}
                  <div style={{ fontSize: '0.75em', color: 'gray', textAlign: isMine ? 'left' : 'right', marginTop: '4px' }}>{m.created_at}</div>
                </div>
              );
            })}
          </div>

          <form onSubmit={sendInActiveChat} style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', backgroundColor: '#e2e8f0', padding: '12px', borderRadius: '50%', color: '#4a5568' }} title="צרף קובץ">
              📎<input type="file" style={{ display: 'none' }} onChange={e => setChatFile(e.target.files[0])} />
            </label>
            <input
              type="text"
              placeholder={chatFile ? `נבחר: ${chatFile.name}` : 'הקלד הודעה...'}
              value={chatInputText}
              onChange={e => setChatInputText(e.target.value)}
              style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #ccc', outline: 'none' }}
            />
            <button type="submit" style={{ backgroundColor: '#0056b3', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>שלח</button>
          </form>
        </>
      )}
    </div>
  );
}
