export const getRoleDetails = (role) => {
    switch (role) {
      case 'Admin': return { text: 'מנהל מערכת', color: '#d9534f' };
      case 'Alumni': return { text: 'בוגר', color: '#1a365d' };
      case 'Student': return { text: 'סטודנט', color: '#3A7D33' };
      case 'Candidate': return { text: 'מועמד', color: '#6c757d' };
      default: return { text: 'אורח', color: '#000' };
    }
  }

  export const availableElectivesList = [
    // קורסי בחירה מקוריים
    'פיתוח משחקים',
    'מבוא לבינה מלאכותית',
    'פיתוח מאובטח',
    'אבטחת סייבר',
    'רשתות נוירונים',
    'תקשורת אלקטרו אופטית',
    'מכניקת שבר',
    'אתיקה רפואית',
    'ניהול המוצר',
    'כלכלת מערכות מידע',
  ];

  export const majorsList = ["הנדסת תוכנה", "מדעי המחשב", "מדעי הנתונים", "הנדסת חשמל", "הנדסת מכונות", "הנדסת תעשייה וניהול", "הנדסת ביו-רפואית","הנדסת מערכות מידע"];
  export const indTypesList = ['משרה', 'ייעוץ וטיפים', 'התייעצות'];
  export const matCategoriesList = ['סיכומי הרצאות', 'מבחנים', 'סילבוס', 'תרגילי בית', 'אחר'];
  export const eqCategoriesList = ['ספרים', 'מחשבון', 'טאבלט/אייפד', 'ציוד משרדי', 'אחר'];
