import React, { useState } from 'react';
import axios from 'axios';

export default function AiAgentTab({ currentUser }) {
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const askAi = async () => {
    if(!aiQuestion.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');

    try {
        // שליחת בקשה נקייה לשרת - ללא Headers של Authorization
        const r = await axios.post('http://127.0.0.1:8000/api/ai/ask', {
          question: aiQuestion,
          major: currentUser.major || "כללי"
        });

        setAiResponse(r.data.answer);
    } catch(e) {
        console.error("AI connection error:", e);
        setAiResponse("לא הצלחתי להתחבר לשרת ה-AI. וודא ששרת ה-FastAPI ושרת ה-n8n פועלים.");
    } finally {
        setIsAiLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(111, 66, 193, 0.15)', maxWidth: '800px', margin: '0 auto', borderTop: '5px solid #6f42c1' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#6f42c1', margin: '0 0 10px 0', fontSize: '2rem' }}>🤖 סוכן A.S.K</h1>
        <p style={{ color: '#4a5568', fontSize: '1.1rem' }}>סוכן חכם המבוסס על ה-PDF של תקנוני המכללה. שאל אותי הכל!</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <textarea
          placeholder="למשל: מה מגיע לי בתור מילואימניק במבחנים?"
          rows="3"
          value={aiQuestion}
          onChange={e => setAiQuestion(e.target.value)}
          style={{ padding: '15px', borderRadius: '10px', border: '2px solid #e2e8f0', width: '100%', boxSizing: 'border-box', fontSize: '1.1rem', resize: 'vertical' }}
        />

        <button
          onClick={askAi}
          disabled={isAiLoading}
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            padding: '15px',
            border: 'none',
            borderRadius: '10px',
            cursor: isAiLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            opacity: isAiLoading ? 0.7 : 1
          }}
        >
          {isAiLoading ? 'סורק מסמכים ומגבש תשובה...' : 'שאל את הסוכן'}
        </button>

        {aiResponse && (
          <div style={{
            marginTop: '20px',
            padding: '25px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            borderRight: '5px solid #6f42c1',
            fontSize: '1.1rem',
            color: '#2d3748',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap'
          }}>
            <strong>תשובת הסוכן:</strong><br/><br/>
            {aiResponse}
          </div>
        )}
      </div>
    </div>
  );
}