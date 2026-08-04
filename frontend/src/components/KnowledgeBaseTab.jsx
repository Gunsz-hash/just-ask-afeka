import React, { useState } from 'react';
import axios from 'axios';

const KnowledgeBaseTab = ({ currentUser }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // 🔒 הגשה: ההעלאה עוברת דרך שרת ה-FastAPI (עם אימות JWT והרשאת Admin)
    // ולא ישירות ל-webhook של n8n. השרת מאמת את ההרשאה ומעביר את הקובץ
    // ל-n8n בצירוף הטוקן הפנימי - כך שלא ניתן להזריק מסמכים למאגר בלי הרשאה.
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setStatusMessage('');

        const formData = new FormData();
        formData.append('file', file); // ה-endpoint בשרת מצפה לשדה בשם 'file'

        try {
            // שימוש ב-axios כדי שה-interceptor יצרף אוטומטית את טוקן ה-JWT
            await axios.post('http://127.0.0.1:8000/api/knowledge/upload', formData);

            setStatusMessage('✅ הקובץ נשלח בהצלחה ועובר כעת סריקה וקידוד וקטורי במערכת ה-RAG!');
            setFile(null);
        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.detail;
            setStatusMessage(detail ? `❌ ${detail}` : '❌ שגיאה בהעלאת הקובץ. ודא שהשרת ו-n8n פעילים.');
        } finally {
            setUploading(false);
        }
    };

    const isAdmin = currentUser?.role === 'Admin';

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', direction: 'rtl' }}>
            <h2 style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '10px', color: '#333' }}>📚 העלאת מסמכים למאגר ה-AI</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px' }}>
                העלאת תקנונים ונהלים רשמיים. הקבצים עוברים תהליך Chunking ומוזרקים אוטומטית למאגר הוקטורי (Vector Store) של מודל ה-RAG.
            </p>

            {/* ממשק העלאה - מוצג אך ורק למנהלי מערכת (האכיפה בפועל מתבצעת בצד השרת) */}
            {isAdmin ? (
                <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#444' }}>📤 הזרקת מסמך חדש (Admin)</h3>
                    <form onSubmit={handleUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}
                            required
                        />
                        <button
                            type="submit"
                            disabled={uploading || !file}
                            style={{
                                padding: '10px 20px',
                                background: uploading ? '#ccc' : '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                transition: '0.2s'
                            }}
                        >
                            {uploading ? 'הקובץ מעובד ב-n8n...' : 'העלאת מסמך למאגר הידע'}
                        </button>
                    </form>
                    {statusMessage && <p style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '14px', color: statusMessage.includes('✅') ? 'green' : 'red' }}>{statusMessage}</p>}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                    <p style={{ fontSize: '18px', color: '#555' }}>🔒 אזור זה מיועד למנהלי מערכת בלבד.</p>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBaseTab;