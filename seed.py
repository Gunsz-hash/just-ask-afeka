import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

# 🔧 תיקון לדמו (2): עכשיו שכל ה-endpoints של יצירת תוכן דורשים JWT,
# ה-seed חייב להתחבר כמשתמש המתאים ולשלוח Authorization header בכל בקשה.
# בלי זה - כל ה-POST-ים מקבלים 403 והמאגר נשאר ריק לדמו.

# מטמון טוקנים - כדי לא להתחבר פעמיים עבור אותו משתמש
_token_cache = {}


def get_auth_headers(email, password="password123"):
    """מתחבר (פעם אחת) ומחזיר headers עם טוקן JWT עבור המשתמש."""
    if email not in _token_cache:
        res = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
        if res.status_code != 200:
            print(f"❌ התחברות נכשלה עבור {email}: {res.text}")
            return {}
        _token_cache[email] = res.json()["access_token"]
    return {"Authorization": f"Bearer {_token_cache[email]}"}


# 1. הגדרת המשתמשים
# 🔧 תיקון לדמו: שמות המסלולים תוקנו כדי להתאים בדיוק ל-majorsList בפרונט
# ("הנדסת ביו-רפואית" ולא "הנדסה ביו רפואית", "הנדסת מכונות" ולא "הנדסה מכנית").
# בלי ההתאמה - הבונוס של +50 ב-relevance score בפיד לא היה עובד עבורם.
users = [
    {
        "name": "יאיר כהן",
        "email": "yair@alumni.afeka.ac.il",
        "password": "password123",
        "role": "Alumni",
        "major": "מדעי המחשב",
        "electives": ["אבטחת סייבר", "פיתוח מאובטח"]
    },
    {
        "name": "דנה לוי",
        "email": "dana@student.afeka.ac.il",
        "password": "password123",
        "role": "Student",
        "major": "הנדסת תוכנה",
        "electives": ["פיתוח משחקים", "רשתות נוירונים"]
    },
    {
        "name": "תמר כספי",
        "email": "tamar@student.afeka.ac.il",
        "password": "password123",
        "role": "Student",
        "major": "הנדסת ביו-רפואית",  # 🔧 תוקן להתאמה ל-majorsList
        "electives": ["אתיקה רפואית"]
    },
    {
        "name": "אלון שקד",
        "email": "alon@student.afeka.ac.il",
        "password": "password123",
        "role": "Student",
        "major": "הנדסת תעשייה וניהול",
        "electives": ["ניהול המוצר"]
    },
    {
        "name": "אור דוד",
        "email": "or@student.afeka.ac.il",
        "password": "password123",
        "role": "Student",
        "major": "הנדסת חשמל",
        "electives": ["תקשורת אלקטרו אופטית"]
    },
    {
        "name": "מאיה יעקב",
        "email": "maya@student.afeka.ac.il",
        "password": "password123",
        "role": "Student",
        "major": "מדעי הנתונים",
        "electives": ["מבוא לבינה מלאכותית", "רשתות נוירונים"]
    },
    {
        "name": "רון ישראלי",
        "email": "ron@student.afeka.ac.il",
        "password": "password123",
        "role": "Student",
        "major": "הנדסת מכונות",  # 🔧 תוקן להתאמה ל-majorsList
        "electives": ["מכניקת שבר"]
    },
    {
        "name": "מיכל כהן",
        "email": "michal@student.afeka.ac.il",
        "password": "password123",
        "role": "Student",
        "major": "הנדסת מערכות מידע",
        "electives": ["כלכלת מערכות מידע"]
    }
]

# 2. שאלות הפורום - התגיות מכילות *אך ורק* קורסי בחירה
questions = [
    {
        "author_email": "dana@student.afeka.ac.il", "author_name": "דנה לוי", "author_role": "Student",
        "author_major": "הנדסת תוכנה",
        "title": "בעיה עם NavMesh ו-Animator ב-Unity",
        "content": "הדמות שלי מחליקה (Foot-sliding) כשאני משלבת בין האנימציה ללוגיקת הניווט. מישהו עשה את הקורס פיתוח משחקים ויודע איך לסנכרן את זה נכון מבלי לכתוב סקריפט מסורבל?",
        "category": "לימודים",
        "tags": ["פיתוח משחקים"]
    },
    {
        "author_email": "tamar@student.afeka.ac.il", "author_name": "תמר כספי", "author_role": "Student",
        "author_major": "הנדסת ביו-רפואית",  # 🔧 תוקן
        "title": "דילמה באתיקה רפואית לפרזנטציה",
        "content": "אני מכינה מצגת על אישור תרופות מקוצר (Fast Track) ב-FDA. האם מישהו יודע איך להתייחס לסוגיית ההסכמה מדעת במקרים כאלה לפי החומר שלמדנו?",
        "category": "לימודים",
        "tags": ["אתיקה רפואית"]
    },
    {
        "author_email": "alon@student.afeka.ac.il", "author_name": "אלון שקד", "author_role": "Student",
        "author_major": "הנדסת תעשייה וניהול",
        "title": "אפיון דרישות (PRD) בניהול המוצר",
        "content": "בפרויקט הסיום בניהול המוצר, האם חובה לכלול מחקר מתחרים נרחב בתוך ה-PRD או שמספיק להפנות לנספח נפרד? המרצה לא היה ברור לגבי זה.",
        "category": "לימודים",
        "tags": ["ניהול המוצר"]
    },
    {
        "author_email": "or@student.afeka.ac.il", "author_name": "אור דוד", "author_role": "Student",
        "author_major": "הנדסת חשמל",
        "title": "חישוב נפיצה בתקשורת אלקטרו אופטית",
        "content": "אני מסתבך עם חישוב נפיצה כרומטית בסיב חד-אופן (Single-mode fiber). יש למישהו קוד פייתון או MATLAB שמדמה את זה?",
        "category": "לימודים",
        "tags": ["תקשורת אלקטרו אופטית"]
    },
    {
        "author_email": "maya@student.afeka.ac.il", "author_name": "מאיה יעקב", "author_role": "Student",
        "author_major": "מדעי הנתונים",
        "title": "בעיית Vanishing Gradient ברשתות נוירונים",
        "content": "מנסה לאמן רשת עמוקה יחסית והמשקלים בשכבות הראשונות בקושי מתעדכנים. ניסיתי לשנות אקטיבציה ל-ReLU, יש עוד רעיונות?",
        "category": "לימודים",
        "tags": ["רשתות נוירונים", "מבוא לבינה מלאכותית"]
    }
]

# 3. תגובות לשאלות הפורום
question_replies = {
    "בעיה עם NavMesh ו-Animator ב-Unity": [
        {
            "author_email": "yair@alumni.afeka.ac.il", "author_name": "יאיר כהן", "author_role": "Alumni",
            "author_major": "מדעי המחשב",
            "content": "היי דנה, נתקלתי בזה בעבר בפרויקט שלי. תוודאי שה-Root Motion כבוי באנימטור, ושה-Agent מניע את הדמות דרך קוד ולא דרך האנימציה עצמה."
        }
    ],
    "אפיון דרישות (PRD) בניהול המוצר": [
        {
            "author_email": "michal@student.afeka.ac.il", "author_name": "מיכל כהן", "author_role": "Student",
            "author_major": "הנדסת מערכות מידע",
            "content": "מניסיוני, כדאי לשים טבלת השוואת מתחרים תמציתית בגוף ה-PRD, ואת הניתוח המעמיק לצרף כנספח. המרצים אוהבים שזה קריא וממוקד."
        }
    ],
    "בעיית Vanishing Gradient ברשתות נוירונים": [
        {
            "author_email": "dana@student.afeka.ac.il", "author_name": "דנה לוי", "author_role": "Student",
            "author_major": "הנדסת תוכנה",
            "content": "ניסית להוסיף Batch Normalization בין השכבות? זה בדרך כלל פותר את הבעיה הזו די מהר."
        }
    ]
}

# 4. פוסט תעשייה ותגובה
industry_post = {
    "author_email": "yair@alumni.afeka.ac.il",
    "author_name": "יאיר כהן",
    "author_role": "Alumni",
    "author_major": "מדעי המחשב",
    "title": "החברה שלנו מגייסת מפתחי צד-שרת עם אוריינטציית סייבר",
    "content": "שלום לכולם! אני בוגר הפקולטה למדעי המחשב, וכיום ראש צוות Backend. אנחנו מחפשים סטודנטים שנה אחרונה או בוגרים טריים. חובה הבנה טובה של JWT, פיתוח מאובטח מונע סיכונים (OWASP), ומוטיבציה גבוהה. יתרון למי שלקח את הקורס אבטחת סייבר. תרגישו חופשי לפנות אליי!",
    # 🔧 תיקון לדמו: היה "משרות" אבל רשימת הפילטרים בפרונט (indTypesList)
    # מכילה "משרה" - הפוסט לא היה מופיע כשמסננים לפי סוג.
    "post_type": "משרה"
}

industry_reply = {
    "author_email": "dana@student.afeka.ac.il",
    "author_name": "דנה לוי",
    "author_role": "Student",
    "author_major": "הנדסת תוכנה",
    "content": "נשמע מעולה יאיר! אני מסיימת השנה ולמדתי פיתוח מאובטח. האם אתם עובדים עם Python/FastAPI או רק עם Node.js? אשמח לשלוח קורות חיים."
}


def seed_data():
    print("🌱 מתחיל בזריעת נתונים...")

    # הזרקת משתמשים (הרשמה היא ציבורית - לא צריך טוקן)
    for u in users:
        res = requests.post(f"{BASE_URL}/register", json=u)
        if res.status_code == 200:
            print(f"✅ משתמש נוצר: {u['name']} ({u['major']})")
        else:
            print(f"⚠️ דילוג על משתמש {u['name']} (כנראה כבר קיים).")

    # הזרקת שאלות פורום ותגובות
    # 🔧 תיקון לדמו (2): כל POST נשלח עם הטוקן של המחבר עצמו,
    # כך שה-author_email שהשרת גוזר מהטוקן יהיה נכון.
    for q in questions:
        headers = get_auth_headers(q["author_email"])
        res = requests.post(f"{BASE_URL}/questions", json=q, headers=headers)
        if res.status_code == 200:
            q_id = res.json().get("id")
            title = q["title"]
            print(f"✅ פוסט נוצר בפורום: {title}")

            if title in question_replies and q_id:
                for rep in question_replies[title]:
                    # 🔧 גם התגובה נשלחת עם הטוקן של כותב התגובה
                    rep_headers = get_auth_headers(rep["author_email"])
                    rep_res = requests.post(f"{BASE_URL}/questions/{q_id}/reply", json=rep, headers=rep_headers)
                    if rep_res.status_code == 200:
                        print(f"   ↳ תגובה נוספה בהצלחה מ-{rep['author_name']}")
        else:
            print(f"❌ יצירת שאלה נכשלה ({res.status_code}): {q['title']}")

    # הזרקת פוסט תעשייה - עם הטוקן של יאיר (Alumni)
    yair_headers = get_auth_headers(industry_post["author_email"])
    res = requests.post(f"{BASE_URL}/industry", json=industry_post, headers=yair_headers)
    if res.status_code == 200:
        print("✅ פוסט תעשייה של הבוגר יאיר נוצר בהצלחה.")

        time.sleep(1)
        industry_list_res = requests.get(f"{BASE_URL}/industry")
        if industry_list_res.status_code == 200:
            industry_posts = industry_list_res.json()
            if industry_posts:
                latest_post_id = industry_posts[0]["_id"]

                # התגובה של דנה - עם הטוקן שלה
                dana_headers = get_auth_headers(industry_reply["author_email"])
                reply_res = requests.post(f"{BASE_URL}/industry/{latest_post_id}/reply", json=industry_reply,
                                          headers=dana_headers)
                if reply_res.status_code == 200:
                    print("   ↳ התגובה של דנה נשתלה בהצלחה בפוסט של יאיר!")
    else:
        print(f"❌ יצירת פוסט תעשייה נכשלה ({res.status_code}): {res.text}")

    print("🎉 זריעת הנתונים הסתיימה! המאגר מוכן להדגמה.")


if __name__ == "__main__":
    seed_data()