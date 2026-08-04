from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from bson.objectid import ObjectId
import os
import shutil
import uuid
import httpx
import jwt
import re

from passlib.context import CryptContext

# 🔒 טעינה אופציונלית של קובץ .env אם python-dotenv מותקן.
# אם החבילה לא מותקנת או שאין קובץ .env - ממשיכים כרגיל עם ערכי ברירת המחדל.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# כתובות n8n - ניתנות לדריסה דרך משתני סביבה, ברירת המחדל זהה להתנהגות הקיימת
N8N_AUTOTAG_URL = os.environ.get("N8N_AUTOTAG_URL", "http://localhost:5678/webhook/auto-tag")
N8N_CHAT_URL = os.environ.get("N8N_CHAT_URL", "http://localhost:5678/webhook/bc272bb0-115f-4a1d-aa20-477a833cdb9c/chat")

# 🔒 הגשה: סודות נטענים ממשתני סביבה (קובץ .env / הגדרת מערכת).
# נשמר fallback לערך הפיתוח כדי שהפרויקט ירוץ גם ללא הגדרה - אך בסביבה
# אמיתית יש להגדיר ערכים חזקים ב-.env (ראו .env.example ו-README).
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None:
            raise HTTPException(status_code=401, detail="טוקן לא תקין")

        # 🔧 תיקון לדמו (5): מחזירים גם את השם מהטוקן,
        # כדי שנוכל להציג שם אמיתי (ולא מייל) בחומרי לימוד / יד שנייה / דיווחים
        return {"email": email, "role": role, "name": payload.get("name", "")}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="פג תוקף ההתחברות, אנא התחבר מחדש")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="שגיאת אבטחה: טוקן מזויף או לא תקין")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

client = AsyncIOMotorClient("mongodb://localhost:27017")
database = client.ask_database
users_collection = database.get_collection("users")
questions_collection = database.get_collection("questions")
materials_collection = database.get_collection("materials")
equipment_collection = database.get_collection("equipment")
industry_collection = database.get_collection("industry")
messages_collection = database.get_collection("messages")
reports_collection = database.get_collection("reports")

# 🔧 ניקוי: הוסר קוד ה-Gemini המת (genai) - כל ה-AI עובר דרך n8n בלבד.
# זה גם מוריד תלות מיותרת מהפרויקט.

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(BaseModel): name: str; email: str; password: str; role: str; major: str; electives: Optional[list] = []


class LoginRequest(BaseModel): email: str; password: str


class ElectivesUpdate(BaseModel): electives: list


class Reply(BaseModel): author_email: str = ""; author_name: str; author_role: str; author_major: str = ""; content: str


class Question(
    BaseModel): author_email: str = ""; author_name: str; author_role: str; author_major: str = ""; title: str; content: str; category: str; tags: list = []; media_url: \
Optional[str] = None; created_at: Optional[str] = None; updated_at: Optional[str] = None; replies: list = []


class TagsUpdate(BaseModel): tags: list


class IndustryPost(
    BaseModel): author_email: str = ""; author_name: str; author_role: str; author_major: str = ""; title: str; content: str; post_type: str; media_url: \
Optional[str] = None; created_at: Optional[str] = None; updated_at: Optional[str] = None; replies: list = []


class AIQuery(BaseModel): question: str; major: str


class Message(
    BaseModel): sender_email: str; sender_name: str; receiver_email: str; receiver_name: str; content: str; media_url: \
Optional[str] = None; file_name: Optional[str] = None; created_at: Optional[str] = None


class Report(BaseModel): reporter_name: str = ""; reported_item: str; reason: str; created_at: Optional[str] = None


class UpdatePost(BaseModel): title: Optional[str] = None; content: Optional[str] = None; media_url: Optional[str] = None


async def notify_n8n_for_nlp(q_id: str, title: str, content: str):
    webhook_url = N8N_AUTOTAG_URL
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json={"id": q_id, "text": f"{title} {content}"})
    except Exception as e:
        print(f"Error calling n8n: {e}")


ALLOWED_EXTENSIONS = {"pdf", "docx", "png", "jpg", "jpeg", "txt"}

# 🔧 תיקון לדמו (3): רשימת תפקידים מותרים בהרשמה.
# חוסם רק Admin (מניעת Mass Assignment) אבל משאיר את מועמד/סטודנט/בוגר
# שמופיעים בטופס ההרשמה ונחוצים ל-seed (יאיר הוא Alumni).
ALLOWED_REGISTER_ROLES = {"Student", "Alumni", "Candidate"}


@app.post("/api/upload")
async def upload_generic_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="סוג קובץ זה אינו נתמך מטעמי אבטחה")

    name = f"{uuid.uuid4().hex}.{ext}"
    loc = f"uploads/{name}"
    with open(loc, "wb+") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"http://127.0.0.1:8000/uploads/{name}", "file_name": file.filename}


@app.post("/api/register")
async def register_user(user: User):
    user_dict = user.model_dump()
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email exists")

    user_dict["is_blocked"] = False

    # 🔧 תיקון לדמו (3): במקום לדרוס את כולם ל-Student (מה ששבר את
    # ההרשמה כבוגר/מועמד ואת ה-seed), חוסמים רק תפקידים לא מורשים כמו Admin.
    if user_dict["role"] not in ALLOWED_REGISTER_ROLES:
        user_dict["role"] = "Student"

    if "electives" not in user_dict or not user_dict["electives"]:
        user_dict["electives"] = []

    safe_password = user_dict["password"][:50]
    user_dict["password"] = pwd_context.hash(safe_password)

    new_user = await users_collection.insert_one(user_dict)

    token_payload = {"sub": user_dict["email"], "role": user_dict["role"], "name": user_dict["name"]}
    access_token = create_access_token(token_payload)

    return {
        "id": str(new_user.inserted_id),
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "name": user_dict["name"],
            "role": user_dict["role"],
            "major": user_dict.get("major", "כללי"),
            "email": user_dict["email"],
            "electives": user_dict["electives"]
        }
    }


@app.post("/api/login")
async def login(request: LoginRequest):
    user = await users_collection.find_one({"email": request.email})
    safe_password = request.password[:50]
    if not user or not pwd_context.verify(safe_password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid Credentials")
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="המשתמש חסום")

    token_payload = {"sub": user["email"], "role": user["role"], "name": user["name"]}
    access_token = create_access_token(token_payload)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "name": user["name"],
            "role": user["role"],
            "major": user.get("major", "כללי"),
            "email": user["email"],
            "electives": user.get("electives", [])
        }
    }


@app.get("/api/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    return [{**doc, "_id": str(doc["_id"])} async for doc in users_collection.find({}, {"password": 0})]


@app.get("/api/users/search")
async def search_users_by_name(name: str = "", current_user: dict = Depends(get_current_user)):
    if len(name.strip()) < 2: return []
    safe_name = re.escape(name.strip())
    cursor = users_collection.find(
        {"name": {"$regex": safe_name, "$options": "i"}},
        {"name": 1, "email": 1, "major": 1, "role": 1, "_id": 0}
    ).limit(8)
    return [{"name": u["name"], "email": u["email"], "major": u.get("major", ""), "role": u.get("role", "")} async for u
            in cursor]


@app.get("/api/users/check/{username}")
async def check_user_exists(username: str):
    if not await users_collection.find_one({"name": username}): raise HTTPException(status_code=404, detail="Not found")
    return {"exists": True}


@app.get("/api/users/profile/{username}")
async def get_user_profile(username: str, current_user: dict = Depends(get_current_user)):
    users_cursor = users_collection.find({"name": username}, {"password": 0})
    users = await users_cursor.to_list(length=10)
    if not users: raise HTTPException(status_code=404, detail="Not found")
    return [{"name": u["name"], "role": u["role"], "major": u["major"], "email": u["email"]} for u in users]


@app.patch("/api/users/{email}/electives")
async def update_user_electives(email: str, update_data: ElectivesUpdate,
                                current_user: dict = Depends(get_current_user)):
    if current_user["email"] != email and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    await users_collection.update_one({"email": email}, {"$set": {"electives": update_data.electives}})
    return {"msg": "Ok"}


@app.patch("/api/users/{email}/block")
async def toggle_block_user(email: str, block_status: bool, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="גישה נדחתה")
    await users_collection.update_one({"email": email}, {"$set": {"is_blocked": block_status}})
    return {"msg": "Updated"}


@app.post("/api/messages")
async def send_message(msg: Message, current_user: dict = Depends(get_current_user)):
    # 🔧 שיפור קטן: במקום לזרוק שגיאה אם השולח לא תואם - פשוט דורסים
    # את פרטי השולח מהטוקן. ככה גם אם הפרונט שלח משהו לא נכון, זה תמיד תקין.
    if not await users_collection.find_one({"email": msg.receiver_email}):
        raise HTTPException(status_code=404, detail="Not found")
    d = msg.model_dump()
    d["sender_email"] = current_user["email"]
    d["sender_name"] = current_user["name"] or d["sender_name"]
    d["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    await messages_collection.insert_one(d)
    return {"msg": "Sent"}


@app.get("/api/messages")
async def get_messages(current_user: dict = Depends(get_current_user)):
    # המייל נשלף מהטוקן בלבד - סגירת IDOR (נשאר כמו שתיקנתם, נכון!)
    email = current_user["email"]
    return [{**doc, "_id": str(doc["_id"])} async for doc in
            messages_collection.find({"$or": [{"receiver_email": email}, {"sender_email": email}]}).sort("created_at",
                                                                                                         -1)]


@app.delete("/api/messages/{email1}/{email2}")
async def delete_conversation(email1: str, email2: str, current_user: dict = Depends(get_current_user)):
    if current_user["email"] not in [email1, email2] and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    await messages_collection.delete_many({"$or": [{"sender_email": email1, "receiver_email": email2},
                                                   {"sender_email": email2, "receiver_email": email1}]})
    return {"msg": "Ok"}


@app.post("/api/reports")
async def create_report(report: Report, current_user: dict = Depends(get_current_user)):
    d = report.model_dump()
    # 🔧 תיקון לדמו (6): שם המדווח נלקח מהטוקן ולא מהקליינט (מניעת התחזות)
    d["reporter_name"] = current_user["name"] or d["reporter_name"]
    d["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    await reports_collection.insert_one(d)
    return {"msg": "Reported"}


@app.get("/api/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin": raise HTTPException(status_code=403, detail="Forbidden")
    return [{**doc, "_id": str(doc["_id"])} async for doc in reports_collection.find().sort("created_at", -1)]


@app.delete("/api/reports/{report_id}")
async def dismiss_report(report_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin": raise HTTPException(status_code=403, detail="Forbidden")
    await reports_collection.delete_one({"_id": ObjectId(report_id)})
    return {"msg": "Dismissed"}


@app.post("/api/questions")
async def create_q(q: Question, bg_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    d = q.model_dump()
    d["author_email"] = current_user["email"]  # הגנה מהתחזות (נשאר, נכון!)
    d["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    res = await questions_collection.insert_one(d)
    bg_tasks.add_task(notify_n8n_for_nlp, str(res.inserted_id), d["title"], d["content"])
    return {"msg": "Ok", "id": str(res.inserted_id)}


@app.delete("/api/questions/{id}")
async def del_q_auth(id: str, current_user: dict = Depends(get_current_user)):
    try:
        obj_id = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="ID לא תקין")

    question = await questions_collection.find_one({"_id": obj_id})
    if not question: raise HTTPException(status_code=404, detail="השאלה לא נמצאה")

    if current_user["email"] != question.get("author_email") and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="אין לך הרשאה למחוק שאלה זו")

    await questions_collection.delete_one({"_id": obj_id})
    return {"msg": "Ok"}


@app.patch("/api/questions/{id}")
async def update_question(id: str, p: UpdatePost, current_user: dict = Depends(get_current_user)):
    q = await questions_collection.find_one({"_id": ObjectId(id)})
    if not q or (current_user["email"] != q.get("author_email") and current_user["role"] != "Admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    d = p.model_dump(exclude_unset=True)
    d["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    await questions_collection.update_one({"_id": ObjectId(id)}, {"$set": d})
    return {"msg": "Updated"}


N8N_SECRET_TOKEN = os.environ.get("N8N_SECRET_TOKEN")
if not N8N_SECRET_TOKEN:
    raise RuntimeError("N8N_SECRET_TOKEN environment variable is required")  # 🔒 ראו .env.example


@app.patch("/api/questions/{id}/tags")
async def update_q_tags(id: str, payload: TagsUpdate, x_n8n_token: str = Header(None)):
    if x_n8n_token != N8N_SECRET_TOKEN: raise HTTPException(status_code=403, detail="Forbidden")
    await questions_collection.update_one({"_id": ObjectId(id)}, {"$set": {"tags": payload.tags}})
    return {"msg": "Tags updated"}


@app.get("/api/questions")
async def get_q(category: Optional[str] = None, search: Optional[str] = None):
    q = {}
    if category and category != "הכל": q["category"] = category
    if search:
        safe_search = re.escape(search)
        q["title"] = {"$regex": safe_search, "$options": "i"}
    return [{**doc, "_id": str(doc["_id"])} async for doc in questions_collection.find(q).sort("created_at", -1)]


@app.post("/api/questions/{id}/reply")
async def add_q_reply(id: str, r: Reply, current_user: dict = Depends(get_current_user)):
    d = r.model_dump()
    d["author_email"] = current_user["email"]
    d["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    await questions_collection.update_one({"_id": ObjectId(id)}, {"$push": {"replies": d}})
    return {"msg": "Ok"}


@app.post("/api/industry")
async def create_ind(p: IndustryPost, current_user: dict = Depends(get_current_user)):
    d = p.model_dump()
    d["author_email"] = current_user["email"]
    d["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    await industry_collection.insert_one(d)
    return {"msg": "Ok"}


@app.patch("/api/industry/{id}")
async def update_ind_post(id: str, p: UpdatePost, current_user: dict = Depends(get_current_user)):
    post = await industry_collection.find_one({"_id": ObjectId(id)})
    if not post or (current_user["email"] != post.get("author_email") and current_user["role"] != "Admin"):
        raise HTTPException(status_code=403, detail="Forbidden")

    d = p.model_dump(exclude_unset=True)
    d["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    await industry_collection.update_one({"_id": ObjectId(id)}, {"$set": d})
    return {"msg": "Updated"}


@app.get("/api/industry")
async def get_ind(post_type: Optional[str] = None, search: Optional[str] = None):
    q = {}
    if post_type and post_type != "הכל": q["post_type"] = post_type
    if search:
        safe_search = re.escape(search)
        q["$or"] = [{"title": {"$regex": safe_search, "$options": "i"}},
                    {"content": {"$regex": safe_search, "$options": "i"}}]
    return [{**doc, "_id": str(doc["_id"])} async for doc in industry_collection.find(q).sort("created_at", -1)]


@app.delete("/api/industry/{id}")
async def del_ind(id: str, current_user: dict = Depends(get_current_user)):
    post = await industry_collection.find_one({"_id": ObjectId(id)})
    if post and current_user["email"] != post.get("author_email") and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    await industry_collection.delete_one({"_id": ObjectId(id)})
    return {"msg": "Ok"}


@app.post("/api/industry/{id}/reply")
async def add_ind_reply(id: str, r: Reply, current_user: dict = Depends(get_current_user)):
    d = r.model_dump()
    d["author_email"] = current_user["email"]
    d["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    await industry_collection.update_one({"_id": ObjectId(id)}, {"$push": {"replies": d}})
    return {"msg": "Ok"}


@app.post("/api/materials")
async def upload_mat(title: str = Form(...), uploader_name: str = Form(...), uploader_email: str = Form(...),
                     uploader_major: str = Form(""),
                     category: str = Form(...), file: UploadFile = File(...),
                     current_user: dict = Depends(get_current_user)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS: raise HTTPException(status_code=400, detail="קובץ לא נתמך")

    name = f"{uuid.uuid4().hex}.{ext}"
    loc = f"uploads/{name}"
    with open(loc, "wb+") as f: shutil.copyfileobj(file.file, f)

    # 🔧 תיקון לדמו (5): uploader_name קיבל אצלכם את המייל -
    # בכרטיסים בדמו היה מוצג "yair@alumni..." במקום "יאיר כהן".
    # עכשיו: השם מהטוקן (עם fallback לטופס), והמייל מהטוקן.
    await materials_collection.insert_one(
        {"title": title,
         "uploader_name": current_user["name"] or uploader_name,
         "uploader_email": current_user["email"],
         "uploader_major": uploader_major, "category": category,
         "file_url": f"http://127.0.0.1:8000/uploads/{name}", "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")})
    return {"msg": "Ok"}


@app.get("/api/materials")
async def get_mat(category: Optional[str] = None, search: Optional[str] = None):
    q = {}
    if category and category != "הכל": q["category"] = category
    if search:
        safe_search = re.escape(search)
        q["title"] = {"$regex": safe_search, "$options": "i"}
    return [{**doc, "_id": str(doc["_id"])} async for doc in materials_collection.find(q).sort("created_at", -1)]


@app.delete("/api/materials/{id}")
async def del_mat(id: str, current_user: dict = Depends(get_current_user)):
    d = await materials_collection.find_one({"_id": ObjectId(id)})
    if d and current_user["email"] != d.get("uploader_email") and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    if d:
        p = os.path.join("uploads", d["file_url"].split("/")[-1])
        if os.path.exists(p): os.remove(p)
    await materials_collection.delete_one({"_id": ObjectId(id)})
    return {"msg": "Ok"}


@app.post("/api/equipment")
async def upload_eq(description: str = Form(...), seller_name: str = Form(...), seller_email: str = Form(...),
                    seller_major: str = Form(""),
                    category: str = Form(...), file: UploadFile = File(...),
                    current_user: dict = Depends(get_current_user)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS: raise HTTPException(status_code=400, detail="קובץ לא נתמך")

    name = f"{uuid.uuid4().hex}.{ext}"
    loc = f"uploads/{name}"
    with open(loc, "wb+") as f: shutil.copyfileobj(file.file, f)

    # 🔧 תיקון לדמו (5): אותו תיקון כמו ב-materials - שם ולא מייל
    await equipment_collection.insert_one(
        {"description": description,
         "seller_name": current_user["name"] or seller_name,
         "seller_email": current_user["email"],
         "seller_major": seller_major, "category": category,
         "image_url": f"http://127.0.0.1:8000/uploads/{name}", "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")})
    return {"msg": "Ok"}


@app.get("/api/equipment")
async def get_eq(category: Optional[str] = None, search: Optional[str] = None):
    q = {}
    if category and category != "הכל": q["category"] = category
    if search:
        safe_search = re.escape(search)
        q["description"] = {"$regex": safe_search, "$options": "i"}
    return [{**doc, "_id": str(doc["_id"])} async for doc in equipment_collection.find(q).sort("created_at", -1)]


@app.delete("/api/equipment/{id}")
async def del_eq(id: str, current_user: dict = Depends(get_current_user)):
    d = await equipment_collection.find_one({"_id": ObjectId(id)})
    if d and current_user["email"] != d.get("seller_email") and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    if d:
        p = os.path.join("uploads", d["image_url"].split("/")[-1])
        if os.path.exists(p): os.remove(p)
    await equipment_collection.delete_one({"_id": ObjectId(id)})
    return {"msg": "Ok"}


# 🔒 הגשה: העלאת מסמכים למאגר הידע של הסוכן - דרך השרת בלבד.
# סוגר את הפרצה שבה ניתן היה לשלוח קבצים ישירות ל-webhook של n8n
# ללא אימות (data poisoning). כעת: בדיקת הרשאת Admin מהטוקן בצד השרת,
# ורק אז העברת הקובץ ל-n8n בצירוף הטוקן הפנימי המשותף.
N8N_UPLOAD_URL = os.environ.get("N8N_UPLOAD_URL", "http://localhost:5678/webhook/upload_file")


@app.post("/api/knowledge/upload")
async def upload_knowledge_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="רק מנהל רשאי להעלות מסמכים למאגר הידע")

    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ""
    if ext != "pdf":
        raise HTTPException(status_code=400, detail="מאגר הידע מקבל קבצי PDF בלבד")

    file_bytes = await file.read()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                N8N_UPLOAD_URL,
                files={"data": (file.filename, file_bytes, "application/pdf")},
                headers={"x-n8n-token": N8N_SECRET_TOKEN},
                timeout=120.0,
            )
        if resp.status_code == 200:
            return {"msg": "Ok"}
        raise HTTPException(status_code=502, detail=f"n8n החזיר שגיאה (קוד {resp.status_code}). ודא שה-Workflow פעיל.")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="לא ניתן להתחבר ל-n8n. ודא שהוא רץ בכתובת localhost:5678.")


@app.post("/api/ai/ask")
async def ask_ai(query: AIQuery, current_user: dict = Depends(get_current_user)):
    n8n_chat_url = N8N_CHAT_URL
    try:
        # 🔧 תיקון לדמו: sessionId לפי המשתמש המחובר במקום session גלובלי.
        # ככה אם שני אנשים מדברים עם הסוכן בהצגה - הזיכרון לא מתערבב.
        payload = {"chatInput": query.question, "sessionId": f"user_{current_user['email']}"}
        async with httpx.AsyncClient() as client:
            response = await client.post(n8n_chat_url, json=payload, timeout=60.0)
            if response.status_code == 200:
                data = response.json()
                ai_answer = ""
                if isinstance(data, list) and len(data) > 0:
                    ai_answer = data[0].get("output") or data[0].get("text")
                else:
                    ai_answer = data.get("output") or data.get("text") or data.get("response")
                return {"answer": ai_answer or "הסוכן הצליח לעבד את הבקשה אך לא החזיר טקסט."}
            else:
                return {"answer": f"שגיאה בתקשורת מול n8n (קוד {response.status_code}). וודא שה-Workflow במצב Active."}
    except httpx.ConnectError:
        return {"answer": "שגיאת חיבור: לא ניתן לגשת לשרת ה-n8n. וודא שהוא פועל בכתובת localhost:5678."}
    except Exception as e:
        return {"answer": f"תקלה במערכת ה-AI: {str(e)}"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)