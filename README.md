# Just A.S.K — Afeka Shared Knowledge 🎓

A web-based student community platform featuring a Q&A forum with automatic NLP tagging, an industry job board, study-material sharing, a second-hand marketplace, private messaging, an admin panel — and a RAG-powered AI agent that answers questions based on the college's official regulations.

## Architecture

| Component | Technology | Port |
|---|---|---|
| Frontend | React (Vite) | 5173 |
| Backend API | FastAPI (Python) | 8000 |
| Database | MongoDB | 27017 |
| Automation & AI | n8n (auto-tagging + RAG agent) | 5678 |
| LLM & Embeddings | Google Gemini API | — |

Main flow: React ↔ FastAPI ↔ MongoDB, with FastAPI calling n8n for automatic tagging of new questions and for AI-agent queries. The RAG agent retrieves answers from a vector knowledge base built from the college's regulation PDFs.

## Prerequisites

Install the following before setup:

1. **Python 3.10+** — https://www.python.org/downloads
2. **Node.js 18+ (includes npm)** — https://nodejs.org
3. **MongoDB Community Server** (running locally on port 27017) — https://www.mongodb.com/try/download/community
4. **n8n** — `npm install -g n8n` (or run via Docker)
5. **Google Gemini API key** (free tier available) — https://aistudio.google.com/apikey

## Installation

### 1) Backend (FastAPI)

From the project root:

```bash
pip install -r requirements.txt
```

**Environment variables (recommended):** copy `.env.example` to a file named `.env` in the same directory and fill in real values (JWT secret, internal n8n token, Gemini key). The project also runs **without** a `.env` file, using built-in development defaults.

### 2) Frontend (React)

```bash
cd frontend
npm install
```

Note: `node_modules` is intentionally excluded from the repository — `npm install` recreates it from `package.json`.

### 3) n8n — Importing the Workflows

1. Run `n8n` and open the UI at http://localhost:5678
2. Import the two workflow files from the `n8n_workflows/` folder (Workflows → Import from File):
   - `PDF_RAG_Chatbot_with_Gemini.json` — the RAG agent + document ingestion
   - `Auto_Tag_Questions_NLP.json` — automatic question tagging
3. Configure credentials:
   - **Google Gemini (PaLM) API** — paste your API key. The key is required in the chat-model node and both embedding nodes.
   - **MongoDB** — connection to `mongodb://localhost:27017`, database `ask_database`.
4. In the auto-tag workflow: make sure the `x-n8n-token` header sent back to the API matches the `N8N_SECRET_TOKEN` value in your `.env` (or the built-in default if no `.env` is used).
5. **Activate both workflows** — the Active toggle at the top right must be ON, and the upload Webhook node must be enabled (not greyed out).

## Running — Startup Order

In four separate terminals, in this order:

```bash
# 1. Database (if not running as a service)
mongod

# 2. Automation
n8n

# 3. Backend (from the project root)
python main.py
# Server starts at http://127.0.0.1:8000

# 4. Frontend
cd frontend
npm run dev
# App starts at http://localhost:5173
```

⚠️ **Important:** the frontend must run on port **5173** exactly (the server's CORS policy allows only that origin). If Vite reports a different port, close duplicate instances and restart.

## Seeding Demo Data

Once the server is running, run once:

```bash
python seed.py
```

The script creates 8 demo users (password for all: `password123`), forum questions with replies, and an industry job post by an alumnus. Example login: `dana@student.afeka.ac.il`.

### Creating an Admin User

For security reasons, the Admin role cannot be selected during registration (Mass-Assignment prevention). Admins are appointed manually in the database:

1. Register a regular user on the site (e.g., `admin@afeka.ac.il`).
2. In a terminal:
   ```javascript
   mongosh
   use ask_database
   db.users.updateOne({email: "admin@afeka.ac.il"}, {$set: {role: "Admin"}})
   ```
3. Log out and log back in (so the token includes the new role).

## Loading Regulations into the AI Agent

1. Log in as admin → **"Knowledge Base"** tab → upload a regulation PDF.
2. The file is sent to the server (admin permission check), forwarded to n8n, split into chunks, embedded (Gemini Embeddings), and stored in the vector store.
3. Any user can now ask the **"A.S.K Agent"** questions about the regulations.

⚠️ **Important note:** the vector store in this version is In-Memory (inside the n8n process) — a deliberate choice for a development/demo environment. **After every n8n restart, the PDFs must be re-uploaded.** In production, the store would be replaced with a dedicated vector database (e.g., Qdrant or MongoDB Atlas Vector Search).

## Security — Implemented & Known Limitations

**Implemented:**
- JWT-based authentication (120-minute expiry) on all sensitive endpoints; author identity is derived from the token server-side (prevents impersonation and IDOR).
- Passwords hashed with Bcrypt; the password field is excluded from every API response.
- Registration with the Admin role is blocked (Mass-Assignment prevention); admins are appointed manually only.
- File-extension whitelist for uploads; search-input sanitization (ReDoS prevention).
- Knowledge-base document uploads are routed exclusively through the server (`POST /api/knowledge/upload`): server-side admin enforcement plus an internal token to n8n — preventing unauthorized document injection (data poisoning).
- CORS restricted to the frontend origin; system secrets managed via environment variables.

**Known limitations (planned for a future version):**
- The n8n webhooks themselves do not enforce authentication on the n8n side (the node accepts any request); the effective protection is that uploads from the system pass through FastAPI with a permission check. A production version would add Header Auth on the n8n Webhook node (natively supported) to verify the internal token, and the webhook would not be exposed outside the internal network.
- In-Memory vector store (see the note above).

## Project Structure

```
├── main.py              # FastAPI server — all endpoints
├── seed.py              # Demo-data seeding script
├── requirements.txt     # Python dependencies
├── .env.example         # Environment-variables template
├── n8n_workflows/       # n8n workflow JSONs (import into n8n)
│   ├── PDF_RAG_Chatbot_with_Gemini.json
│   └── Auto_Tag_Questions_NLP.json
├── frontend/
│   ├── package.json
│   └── src/
│       ├── pages/       # Login, Register, Forum, Home
│       ├── components/  # FeedTab, InboxTab, AdminPanel, AiAgentTab...
│       └── utils/       # Shared constants
└── uploads/             # Runtime user uploads (kept empty in the repo)
```

## Submission Notes

Per the course guidelines, the submitted archive **excludes** build and install artifacts: `node_modules`, `dist`, `__pycache__`, `.idea`, as well as `uploads` content (user data) and `.env` (secrets) — all excluded via `.gitignore`. To build the project from source, follow the Installation and Running sections above.
