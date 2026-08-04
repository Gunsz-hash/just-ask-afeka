import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AdminPanel from '../components/AdminPanel';
import ProfileTab from '../components/ProfileTab';
import InboxTab from '../components/InboxTab';
import FeedTab from '../components/FeedTab';
import MaterialsTab from '../components/MaterialsTab';
import AiAgentTab from '../components/AiAgentTab';
import KnowledgeBaseTab from '../components/KnowledgeBaseTab';

export default function Forum() {
  const currentUser = JSON.parse(localStorage.getItem('ask_user')) || { name: 'אורח', role: 'Student', major: 'כללי', email: '', electives: [] };

  const [activeTab, setActiveTab] = useState('qa');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);

  // כללי - Global State
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [industryPosts, setIndustryPosts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [matSearch, setMatSearch] = useState('');
  const [eqSearch, setEqSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('הכל');
  const [indFilter, setIndFilter] = useState('הכל');
  const [matFilter, setMatFilter] = useState('הכל');
  const [eqFilter, setEqFilter] = useState('הכל');

  const fetchData = async () => {
    try {
      const ts = `t=${Date.now()}`;
      axios.get(`http://127.0.0.1:8000/api/questions?${ts}&category=${filterCategory !== 'הכל' ? filterCategory : ''}&search=${searchQuery}`).then(r => setQuestions(r.data));
      axios.get(`http://127.0.0.1:8000/api/industry?${ts}&post_type=${indFilter !== 'הכל' ? indFilter : ''}&search=${searchQuery}`).then(r => setIndustryPosts(r.data));
      axios.get(`http://127.0.0.1:8000/api/materials?${ts}&category=${matFilter !== 'הכל' ? matFilter : ''}&search=${matSearch}`).then(r => setMaterials(r.data));
      axios.get(`http://127.0.0.1:8000/api/equipment?${ts}&category=${eqFilter !== 'הכל' ? eqFilter : ''}&search=${eqSearch}`).then(r => setEquipmentList(r.data));

            // 🔧 תיקון לדמו (1): ה-endpoint החדש בשרת הוא GET /api/messages בלי מייל ב-URL.
      // המייל נשלף בשרת מתוך ה-JWT (הטוקן נוסף אוטומטית ע"י ה-interceptor ב-main.jsx).
      // הקריאה הישנה ל-/api/messages/{email} הייתה מחזירה 404 והאינבוקס היה ריק בדמו.
      if (currentUser.email) {
        axios.get(`http://127.0.0.1:8000/api/messages?${ts}`).then(r => setMessagesList(r.data)).catch(() => setMessagesList([]));
      }

      if (currentUser.role === 'Admin') {
        axios.get(`http://127.0.0.1:8000/api/users?${ts}`).then(r => setUsersList(r.data));
        axios.get(`http://127.0.0.1:8000/api/reports?${ts}`).then(r => setReportsList(r.data));
      }
    } catch(e) { console.error(e) }
  }

  useEffect(() => { fetchData(); }, [searchQuery, matSearch, eqSearch, filterCategory, matFilter, eqFilter, indFilter, activeTab, showAdminPanel]);

  const handleSendMessage = (targetEmail, targetName) => {
    // הגדרת מייל ושם ברירת מחדל לפריטים ישנים כדי לאפשר דמו חלק בכל המערכת
    const finalEmail = targetEmail || "demo@s.afeka.ac.il";
    const finalName = targetName || "סטודנט דמו";

    if (finalEmail === currentUser.email) {
      alert('לא ניתן לשלוח הודעה לעצמך.');
      return;
    }

    setActiveTab('inbox');
    setActiveChatUser({ email: finalEmail, name: finalName });
  }

  const handleReport = async (itemName) => {
    const reason = window.prompt(`דיווח על תוכן: ${itemName}\nסיבת הדיווח:`);
    if(reason && reason.trim() !== '') {
        await axios.post('http://127.0.0.1:8000/api/reports', { reporter_name: currentUser.name, reported_item: itemName, reason: reason });
        alert('נשלח למנהלים!');
    }
  }

  const uploadGenericMedia = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await axios.post('http://127.0.0.1:8000/api/upload', fd);
    return res.data;
  };

  const deleteItem = async (col, id) => {
    if(window.confirm('האם למחוק?')) {
        await axios.delete(`http://127.0.0.1:8000/api/${col}/${id}`);
        fetchData();
    }
  }

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Arial', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showAdminPanel={showAdminPanel}
        setShowAdminPanel={setShowAdminPanel}
        setActiveChatUser={setActiveChatUser}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 30px 30px' }}>
        {showAdminPanel ? (
          <AdminPanel usersList={usersList} reportsList={reportsList} fetchData={fetchData} />
        ) : activeTab === 'profile' ? (
          <ProfileTab currentUser={currentUser} fetchData={fetchData} handleSendMessage={handleSendMessage} />
        ) : activeTab === 'inbox' ? (
          <InboxTab currentUser={currentUser} messagesList={messagesList} activeChatUser={activeChatUser} setActiveChatUser={setActiveChatUser} handleSendMessage={handleSendMessage} uploadGenericMedia={uploadGenericMedia} fetchData={fetchData} />
        ) : (activeTab === 'qa' || activeTab === 'industry') ? (
          <FeedTab currentUser={currentUser} activeTab={activeTab} questions={questions} industryPosts={industryPosts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterCategory={filterCategory} setFilterCategory={setFilterCategory} indFilter={indFilter} setIndFilter={setIndFilter} handleSendMessage={handleSendMessage} handleReport={handleReport} uploadGenericMedia={uploadGenericMedia} deleteItem={deleteItem} fetchData={fetchData} />
        ) : (activeTab === 'materials' || activeTab === 'equipment') ? (
          <MaterialsTab currentUser={currentUser} activeTab={activeTab} materials={materials} equipmentList={equipmentList} matSearch={matSearch} setMatSearch={setMatSearch} eqSearch={eqSearch} setEqSearch={setEqSearch} matFilter={matFilter} setMatFilter={setMatFilter} eqFilter={eqFilter} setEqFilter={setEqFilter} handleSendMessage={handleSendMessage} handleReport={handleReport} deleteItem={deleteItem} fetchData={fetchData} />
        ) : activeTab === 'knowledge' ? (
          <KnowledgeBaseTab currentUser={currentUser} />
        ) : (
          <AiAgentTab currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}