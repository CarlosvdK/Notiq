"""
Notiq — AI-Powered Note Taking
Run: pip install streamlit plotly requests python-dotenv
     streamlit run notiq_streamlit.py
"""
import streamlit as st
import re, html as html_mod, requests, os, hashlib
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

st.set_page_config(page_title="Notiq",page_icon="N",layout="wide",initial_sidebar_state="expanded")
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
:root{
  --bg:#f3f0eb;--bg2:#eae7e1;--bg3:#e2dfd9;
  --sidebar:#1b2a4a;--sidebar2:#162240;--sidebar-border:rgba(255,255,255,.08);
  --panel:#f8f6f2;--panel-border:#e0dcd6;
  --card:rgba(255,255,255,.7);--card-h:rgba(255,255,255,.85);--card-b:#ddd8d0;
  --shadow:0 2px 8px rgba(27,42,74,.06);
  --blue:#1b2a4a;--blue2:#2a3f6e;--blue3:#3d5a99;--blue-light:#4a6fa5;
  --accent:#c9912a;--accent-bg:rgba(201,145,42,.08);
  --red:#c0392b;--green:#27ae60;--cyan:#2980b9;
  --txt:#1b2a4a;--txt2:#8b8578;--txt3:#6b6560;
  --border:#ddd8d0;
  --grad:linear-gradient(135deg,#1b2a4a,#2a3f6e);
}
/* ── App shell ── */
.stApp{background:var(--bg);font-family:'Inter',sans-serif;color:var(--txt)}
#MainMenu,footer,header{visibility:hidden}
.block-container{padding-top:.5rem;max-width:100%}
/* ── Glass cards (light theme) ── */
.cd{background:var(--card);border:1px solid var(--card-b);border-radius:12px;padding:14px;margin-bottom:.5rem;box-shadow:var(--shadow);transition:all .2s}
.cd:hover{background:var(--card-h);border-color:#ccc7be}
.cg{background:rgba(27,42,74,.03);border:1px solid rgba(27,42,74,.08);border-radius:12px;padding:14px;margin:.5rem 0;box-shadow:var(--shadow)}
.cw{background:var(--accent-bg);border:1px solid rgba(201,145,42,.18);border-radius:12px;padding:14px;margin-bottom:.5rem;box-shadow:var(--shadow)}
.cb{background:rgba(41,128,185,.05);border:1px solid rgba(41,128,185,.12);border-radius:12px;padding:14px;margin-bottom:.5rem;box-shadow:var(--shadow)}
/* ── YouTube suggestion cards ── */
.sug{background:var(--card);border:1px solid var(--card-b);border-radius:8px;padding:.5rem;margin-bottom:.4rem;transition:all .25s ease;display:flex;gap:.5rem;align-items:center;overflow:hidden;max-width:100%}
.sug:hover{border-color:#bbb5ab;background:var(--card-h);transform:translateY(-1px)}
.sug-thumb{width:48px;height:34px;border-radius:5px;background:rgba(27,42,74,.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.5rem;color:var(--txt2);border:1px solid var(--card-b)}
.sug-body{flex:1;min-width:0;overflow:hidden}.sug-t{font-size:.74rem;font-weight:600;color:var(--txt);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sug-m{font-size:.62rem;color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* ── Tags ── */
.tag{display:inline-block;padding:2px 7px;border-radius:20px;font-size:.62rem;font-weight:600;margin:1px 2px;letter-spacing:.3px;text-transform:uppercase}
.t-task{background:rgba(27,42,74,.06);color:var(--txt)}.t-study{background:rgba(41,128,185,.10);color:var(--cyan)}.t-health{background:rgba(39,174,96,.08);color:var(--green)}.t-plan{background:rgba(201,145,42,.10);color:var(--accent)}.t-idea{background:rgba(61,90,153,.08);color:var(--blue3)}.t-social{background:rgba(41,128,185,.08);color:var(--cyan)}
.tt{display:inline-block;padding:1px 5px;border-radius:3px;font-size:.52rem;font-weight:700;text-transform:uppercase}.tt-yt{background:rgba(192,57,43,.12);color:var(--red)}.tt-art{background:rgba(41,128,185,.10);color:var(--cyan)}.tt-tut{background:rgba(27,42,74,.08);color:var(--blue)}
/* ── Levels ── */
.lvl{display:inline-block;padding:2px 7px;border-radius:5px;font-size:.62rem;font-weight:700;text-transform:uppercase}
.l-nov{background:rgba(27,42,74,.05);color:var(--txt2)}.l-beg{background:rgba(41,128,185,.10);color:var(--cyan)}.l-int{background:rgba(27,42,74,.08);color:var(--txt)}.l-adv{background:rgba(201,145,42,.10);color:var(--accent)}.l-exp{background:rgba(41,128,185,.12);color:var(--cyan)}.l-mas{background:rgba(192,57,43,.10);color:var(--red)}
/* ── Prefs & priority ── */
.pref{display:inline-block;padding:2px 6px;border-radius:20px;font-size:.64rem;font-weight:600;margin:1px 2px}.pref-y{background:rgba(27,42,74,.06);color:var(--txt)}.pref-n{background:rgba(192,57,43,.08);color:var(--red)}
.pri{display:inline-block;padding:2px 6px;border-radius:5px;font-size:.6rem;font-weight:700}.pri-u{background:rgba(192,57,43,.12);color:var(--red)}.pri-h{background:rgba(201,145,42,.10);color:var(--accent)}.pri-n{background:rgba(27,42,74,.06);color:var(--txt)}.pri-l{background:rgba(27,42,74,.04);color:var(--txt2)}
/* ── Progress bars ── */
.pbb{background:rgba(27,42,74,.06);border-radius:7px;height:7px;width:100%;overflow:hidden;margin:3px 0}.pb{height:100%;border-radius:7px;transition:width .5s}
/* ── Stats ── */
.sts{display:flex;gap:.5rem;margin:.5rem 0}.st{background:var(--card);border:1px solid var(--card-b);border-radius:12px;padding:.5rem .7rem;flex:1;text-align:center;box-shadow:var(--shadow)}.st-n{font-family:'JetBrains Mono',monospace;font-size:1.3rem;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700}.st-l{font-size:.6rem;color:var(--txt2);text-transform:uppercase;letter-spacing:.7px}
.mono{font-family:'JetBrains Mono',monospace}
/* ── Section headers ── */
.sh{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2);letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem}
.sh2{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--blue3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem}
.sh3{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent);letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem}
/* ── Next topic card ── */
.nt{background:var(--card);border:1px solid var(--card-b);border-radius:12px;padding:.7rem;margin-bottom:.4rem;display:flex;justify-content:space-between;align-items:center;box-shadow:var(--shadow)}
/* ── Chat messages ── */
.chat-user{background:rgba(27,42,74,.06);border:1px solid rgba(27,42,74,.10);border-radius:12px 12px 4px 12px;padding:10px 14px;margin:4px 0;margin-left:20%;font-size:.78rem;color:var(--txt);line-height:1.5}
.chat-ai{background:var(--card);border:1px solid var(--card-b);border-radius:12px 12px 12px 4px;padding:10px 14px;margin:4px 0;margin-right:20%;font-size:.78rem;color:var(--txt3);line-height:1.55;white-space:pre-wrap}
/* ── Form elements ── */
.stTextArea textarea,.stTextInput input{background:white!important;border:1px solid var(--border)!important;border-radius:8px!important;color:var(--txt)!important;font-family:'Inter',sans-serif!important;font-size:15px!important;line-height:1.7!important}
.stTextArea textarea{min-height:350px!important;padding:14px 18px!important}
.stSelectbox>div>div{background:white!important;border:1px solid var(--border)!important;border-radius:8px!important;color:var(--txt)!important}
.stSelectbox svg{fill:var(--txt2)!important}
.stSelectbox [data-baseweb="select"] span{color:var(--txt)!important}
/* ── Sidebar — dark blue ── */
div[data-testid="stSidebar"]{background:linear-gradient(180deg,#1b2a4a,#162240,#111b38)!important;border-right:1px solid rgba(255,255,255,.06)!important;width:250px!important;min-width:250px!important}
div[data-testid="stSidebar"] *{color:#c8cdd8!important}
div[data-testid="stSidebar"] .stTextInput input{background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.10)!important;color:#e8ecf4!important}
div[data-testid="stSidebar"] .stSelectbox>div>div{background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.10)!important;color:#e8ecf4!important}
div[data-testid="stSidebar"] .stSelectbox svg{fill:#8899bb!important}
div[data-testid="stSidebar"] .stButton>button{width:100%;margin-bottom:1px;font-size:12px!important;padding:4px 8px!important;background:transparent!important;border:none!important;color:rgba(200,210,225,.65)!important;font-weight:400!important;box-shadow:none!important;border-radius:5px!important;text-align:left!important}
div[data-testid="stSidebar"] .stButton>button:hover{background:rgba(255,255,255,.08)!important;color:#fff!important;border-color:transparent!important}
div[data-testid="stSidebar"] hr{border-color:rgba(255,255,255,.08)!important}
/* ── Main buttons ── */
.stButton>button{background:var(--grad)!important;color:#fff!important;font-weight:600!important;border:none!important;border-radius:7px!important;padding:.35rem 1rem!important;font-family:'Inter',sans-serif!important;font-size:13px!important;box-shadow:0 2px 6px rgba(27,42,74,.15)!important}
.stButton>button:hover{background:linear-gradient(135deg,#2a3f6e,#3d5a99)!important}
/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"]{gap:0;background:var(--card);border-radius:8px;padding:3px;border:1px solid var(--card-b)}
.stTabs [data-baseweb="tab"]{border-radius:6px;padding:6px 16px;font-weight:600;font-size:13px;color:var(--txt2)}
.stTabs [aria-selected="true"]{background:var(--blue)!important;color:#fff!important}
.stTabs [data-baseweb="tab-border"],.stTabs [data-baseweb="tab-highlight"]{display:none}
/* ── Slider ── */
.stSlider [data-baseweb="slider"] div[role="slider"]{background:var(--blue)!important;border-color:var(--blue)!important}
.stSlider [data-baseweb="slider"] [data-testid="stTickBar"]>div{background:var(--blue)!important}
</style>
""",unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# API KEYS
# ═══════════════════════════════════════════════════════════════
GEMINI_KEY = st.secrets["GEMINI_KEY"]
YOUTUBE_KEY = st.secrets["YOUTUBE_KEY"]

# ═══════════════════════════════════════════════════════════════
# DATA MODEL
# ═══════════════════════════════════════════════════════════════
CATS={"daily":{"lb":"Daily Tasks","tc":"t-task","cl":"#1b2a4a"},"study":{"lb":"Work / Study","tc":"t-study","cl":"#2980b9"},"health":{"lb":"Health & Fitness","tc":"t-health","cl":"#27ae60"},"plan":{"lb":"Planning & Finance","tc":"t-plan","cl":"#c9912a"},"idea":{"lb":"Ideas & Creativity","tc":"t-idea","cl":"#3d5a99"},"social":{"lb":"Social & Memories","tc":"t-social","cl":"#2980b9"}}

if "folders" not in st.session_state:
    st.session_state.folders = {
        "mban_t2":{"name":"MBAn Term 2","notes":["s1","s2","s3"]},
        "personal":{"name":"Personal","notes":["d1","d2","h1","h2"]},
        "projects":{"name":"Projects & Ideas","notes":["i1","i2"]},
        "planning":{"name":"Planning","notes":["p1","p2"]},
        "social":{"name":"Social","notes":["x1","x2"]},
    }

if "notes" not in st.session_state:
    st.session_state.notes = {
        "s1":{"title":"Quantum Computing","cat":"study","children":["s1a","s1b"],"plain":"","created":"2026-02-14 14:22"},
        "s1a":{"title":"Lesson 1: Fundamentals","cat":"study","parent":"s1","plain":"Qubits vs classical bits — superposition allows qubits to be in multiple states simultaneously.\n\nKey concepts:\n- Quantum entanglement\n- Quantum gates (Hadamard, CNOT, Pauli)\n- Decoherence and error correction","created":"2026-02-14 14:22"},
        "s1b":{"title":"Lesson 2: Algorithms","cat":"study","parent":"s1","plain":"Quantum Algorithms:\n- Shor's algorithm for factoring\n- Grover's search algorithm\n\nNeed to review: Bloch sphere representation and density matrices.","created":"2026-02-15 10:00"},
        "s2":{"title":"Machine Learning","cat":"study","children":["s2a","s2b","s2c"],"plain":"","created":"2026-02-15 10:30"},
        "s2a":{"title":"Lesson 1: Supervised","cat":"study","parent":"s2","plain":"Supervised learning:\n- Linear regression, Logistic regression\n- Decision trees, Random forests, SVM\n\nKey: model learns from labeled data.","created":"2026-02-15 10:30"},
        "s2b":{"title":"Lesson 2: Unsupervised","cat":"study","parent":"s2","plain":"Unsupervised learning:\n- K-means clustering\n- PCA dimensionality reduction\n- DBSCAN\n\nNo labels — finds structure in data.","created":"2026-02-16 09:00"},
        "s2c":{"title":"Lesson 3: Deep Learning","cat":"study","parent":"s2","plain":"Deep learning:\n- Neural network architecture\n- Backpropagation & gradient descent\n- Activation functions (ReLU, sigmoid, tanh)\n\nLibraries: scikit-learn, TensorFlow, PyTorch\n\nAssignment due: Feb 28 — implement a CNN for image classification","created":"2026-02-17 11:00"},
        "s3":{"title":"Corporate Finance","cat":"study","children":["s3a"],"plain":"","created":"2026-02-16 11:00"},
        "s3a":{"title":"Lesson 1: Valuation","cat":"study","parent":"s3","plain":"Corporate Finance — Week 5\n- NPV and IRR calculations\n- Weighted average cost of capital (WACC)\n- Capital structure theory (Modigliani-Miller)\n- Dividend policy\n\nExam: March 15\nNeed to practice: DCF valuation models","created":"2026-02-16 11:00"},
        "d1":{"title":"Weekly Errands","cat":"daily","plain":"- [x] Buy groceries\n- [ ] Call mom\n- [x] Pay electricity bill\n- [ ] Pick up dry cleaning\n- [ ] Email professor about deadline\n- [x] Book dentist appointment\n- [ ] Return Amazon package","created":"2026-02-15 08:30"},
        "d2":{"title":"Grocery Shopping","cat":"daily","plain":"Chicken breast\nOnions\nBell peppers\nGarlic\nSoy sauce\nRice\nBroccoli\nGinger\nSesame oil\nGreen onions","created":"2026-02-16 09:00"},
        "h1":{"title":"Weekly Workout Plan","cat":"health","plain":"Monday: Upper body — bench press 4x8, rows 4x10, overhead press 3x8, bicep curls 3x12\nTuesday: Lower body — squats 5x5, deadlifts 3x5, lunges 3x10, leg press 3x12\nWednesday: Rest / active recovery — 30 min walk\nThursday: Push — chest press, shoulder press, tricep dips, lateral raises\nFriday: Pull — pull-ups, barbell rows, face pulls, hammer curls\nSaturday: Legs + core — front squats, RDLs, planks, hanging leg raises\nSunday: Rest","created":"2026-02-12 08:00"},
        "h2":{"title":"Meal Log This Week","cat":"health","plain":"Monday: Oatmeal + banana (350cal), Chicken salad (450cal), Pasta with veggies (600cal), Protein shake (200cal)\nTuesday: Eggs + toast (400cal), Rice bowl + chicken (550cal), Stir fry (500cal), Greek yogurt (150cal)\nWednesday: Smoothie (300cal), Sandwich (450cal), Salmon + rice (650cal), Fruit (100cal)\nThursday: Pancakes (500cal), Burrito bowl (600cal), Chicken breast + sweet potato (550cal)\nFriday: Granola + milk (350cal), Sushi (500cal), Pizza (700cal), Ice cream (250cal)","created":"2026-02-14 20:00"},
        "p1":{"title":"Barcelona Trip Plan","cat":"plan","plain":"Day 1: Sagrada Familia, Park Guell, Gracia neighborhood\nDay 2: Gothic Quarter, La Rambla, Barceloneta Beach\nDay 3: Camp Nou, Montjuic, Magic Fountain\nDay 4: La Boqueria market, El Born, Picasso Museum\n\nBudget: 800 for 4 days\nHotel: Hotel Jazz, Carrer de Pelai","created":"2026-02-10 15:00"},
        "p2":{"title":"February Budget","cat":"plan","plain":"Income: 2500\n\nRent: 800\nGroceries: 300\nTransport: 80\nSubscriptions: 45\nDining out: 150\nClothing: 100\nSavings: 500\nMiscellaneous: 200\n\nGoal: Save 500 this month\nGoal: Keep dining under 150","created":"2026-02-01 09:00"},
        "i1":{"title":"Restaurant Analytics SaaS","cat":"idea","plain":"Problem: Small restaurants don't have access to data analytics\nSolution: Simple dashboard that connects to POS systems\n\nFeatures:\n- Revenue trends & forecasting\n- Menu item performance\n- Peak hours analysis\n- Food cost tracking\n\nMonetization: 49/month per restaurant\nMarket: 500K+ independent restaurants in EU\nCompetitors: Toast, MarketMan\n\nNext steps: Build MVP, talk to 10 restaurant owners","created":"2026-02-08 22:00"},
        "i2":{"title":"YouTube Content Ideas","cat":"idea","plain":"1. Day in the life at ESADE\n2. How I built my first SaaS\n3. Study with me — Pomodoro session\n4. Barcelona on a student budget\n5. Comparing MBA programs in Europe\n\nGoal: 1 video per week\nEquipment needed: Better microphone","created":"2026-02-13 19:00"},
        "x1":{"title":"Birthday & Gift Ideas","cat":"social","plain":"Mom — March 12 — Loves gardening\nCarlos — April 3 — Into gaming\nSarah — Feb 28 — cookbook by Ottolenghi\nDad — June 15 — golf balls\n\nESADE class reunion: March 20","created":"2026-02-11 16:00"},
        "x2":{"title":"Journal — Feb Week 2","cat":"social","plain":"Monday: Great day — aced the finance quiz, feeling confident\nTuesday: Stressed about the ML assignment, stayed up late\nWednesday: Coffee with Sarah, feeling better\nThursday: Gym was amazing, hit a PR on deadlifts. Happy\nFriday: Went out with Carlos, fun night but tired\nSaturday: Lazy day, watched movies. Content\nSunday: Planned the week, feeling organized and motivated","created":"2026-02-16 21:00"},
    }

if "active_note" not in st.session_state: st.session_state.active_note = "s2a"
if "active_folder" not in st.session_state: st.session_state.active_folder = "mban_t2"
if "show_ai" not in st.session_state: st.session_state.show_ai = True
if "reviews" not in st.session_state:
    st.session_state.reviews = [{"cat":"health","item":"Chicken Stir-Fry","rating":4,"likes":["quick","high protein"],"dislikes":["too salty"],"date":"2026-02-10"},{"cat":"health","item":"Push Day","rating":3,"likes":["compound movements"],"dislikes":["too long","shoulder fatigue"],"date":"2026-02-13"}]
if "preferences" not in st.session_state:
    st.session_state.preferences = {"health":{"likes":["quick","high protein","compound movements","efficient"],"dislikes":["too salty","too long","shoulder fatigue"]}}
if "chat_history" not in st.session_state: st.session_state.chat_history = {}
if "chat_note_id" not in st.session_state: st.session_state.chat_note_id = ""


# ═══════════════════════════════════════════════════════════════
# API FUNCTIONS
# ═══════════════════════════════════════════════════════════════
@st.cache_data(show_spinner=False, ttl=3600)
def gemini_chat(note_content, question, history_text, key):
    if not key:
        return "No Gemini API key configured."
    try:
        prompt = (
            "You are a helpful note-taking assistant. The user has the following note:\n\n"
            f"{note_content}\n\n"
        )
        if history_text:
            prompt += f"Previous conversation:\n{history_text}\n\n"
        prompt += f"Answer this question concisely (3-5 sentences max):\n{question}"
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
            headers={"Content-Type": "application/json"},
            json={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":400,"temperature":0.5}},
            timeout=12
        )
        d = r.json()
        return d.get("candidates",[{}])[0].get("content",{}).get("parts",[{}])[0].get("text","No response received.")
    except Exception as e:
        return f"Error: {e}"

@st.cache_data(show_spinner=False, ttl=3600)
def gemini_next_steps(note_content, key):
    if not key or not note_content.strip():
        return []
    try:
        prompt = (
            "Given this note, suggest exactly 2 short actionable next steps (max 8 words each). "
            "Return ONLY the steps, one per line, no numbers or bullets.\n\n"
            f"{note_content[:1500]}"
        )
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
            headers={"Content-Type": "application/json"},
            json={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":100,"temperature":0.3}},
            timeout=8
        )
        d = r.json()
        text = d.get("candidates",[{}])[0].get("content",{}).get("parts",[{}])[0].get("text","")
        steps = [s.strip().lstrip("0123456789.-) ") for s in text.strip().split("\n") if s.strip()]
        return steps[:2]
    except:
        return []

@st.cache_data(show_spinner=False, ttl=3600)
def gemini_yt_query(note_content, title, key):
    if not key:
        return None
    try:
        prompt = (
            f"Generate a short YouTube search query (3-6 words) to find helpful videos about this note. "
            f"Title: {title}\nContent: {note_content[:500]}\n\n"
            "Return ONLY the search query, nothing else."
        )
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
            headers={"Content-Type": "application/json"},
            json={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":30,"temperature":0.3}},
            timeout=6
        )
        d = r.json()
        q = d.get("candidates",[{}])[0].get("content",{}).get("parts",[{}])[0].get("text","").strip()
        return q[:80] if q else None
    except:
        return None

@st.cache_data(show_spinner=False, ttl=600)
def yt_live_search(query, key, max_results=3):
    if not key:
        return []
    try:
        r = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={"part":"snippet","q":query,"type":"video","maxResults":max_results,"key":key},
            timeout=8
        )
        d = r.json()
        if "items" not in d:
            return []
        return [
            {"t":i["snippet"]["title"],"ch":i["snippet"]["channelTitle"],
             "thumb":i["snippet"]["thumbnails"].get("medium",{}).get("url",""),
             "url":f"https://www.youtube.com/watch?v={i['id']['videoId']}","ty":"youtube"}
            for i in d["items"]
        ]
    except:
        return []

def build_yt_query(title, content, cat):
    base = title.strip()
    suffix = {"study":"tutorial explained","health":"fitness guide","plan":"tips guide",
              "idea":"startup business","daily":"how to","social":"ideas"}
    words = re.findall(r'\b[a-zA-Z]{6,}\b', content[:300])
    kw = " ".join(list(dict.fromkeys(words))[:2])
    q = f"{base} {kw} {suffix.get(cat,'')}".strip()
    return q[:80]


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════
def detect_cat(c):
    cl=c.lower();sc={"daily":sum(1 for w in ["buy","grocery","errand","call","email","pay","bill","appointment","pick up"] if w in cl),"study":sum(1 for w in ["study","exam","lecture","assignment","algorithm","theory","concept","class","quiz","neural","regression","supervised","due"] if w in cl),"health":sum(1 for w in ["workout","exercise","squat","deadlift","bench","gym","protein","calories","cal)","meal","weight"] if w in cl),"plan":sum(1 for w in ["budget","income","rent","savings","trip","flight","hotel","travel","goal","expense"] if w in cl),"idea":sum(1 for w in ["idea","startup","saas","problem","solution","market","mvp","competitor","business"] if w in cl),"social":sum(1 for w in ["birthday","gift","friend","journal","feeling","happy","stressed","dinner","mom","dad"] if w in cl)}
    b=max(sc,key=sc.get);return b if sc[b]>0 else "daily"

def parse_tasks(c):
    tasks=[]
    for l in c.strip().split("\n"):
        l=l.strip()
        if not l:continue
        done=l.startswith("- [x]") or l.startswith("- [X]")
        t=l.lstrip("- ").lstrip("[x] ").lstrip("[X] ").lstrip("[ ] ").strip()
        if not t:continue
        tl=t.lower();pri="urgent" if any(w in tl for w in ["urgent","asap","today"]) else "high" if any(w in tl for w in ["deadline","due","exam","bill","pay"]) else "low" if any(w in tl for w in ["maybe","sometime"]) else "normal"
        tasks.append({"text":t,"done":done,"pri":pri})
    return {"tasks":tasks,"done":sum(1 for t in tasks if t["done"]),"total":len(tasks)}

def is_shopping(c):return sum(1 for w in ["chicken","rice","onion","garlic","pepper","milk","eggs","bread","tomato","butter","cheese","pasta","broccoli","ginger","sauce","oil"] if w in c.lower())>=3

def parse_cals(c):
    d={}
    for l in c.split("\n"):
        m=re.match(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[:\s]',l,re.I)
        if m:cals=re.findall(r'(\d+)\s*cal',l,re.I);d[m.group(1).title()]={"cal":sum(int(x) for x in cals),"meals":len(cals)}
    return d

def parse_budget(c):
    inc=0;exp={};goals=[]
    for l in c.split("\n"):
        ll=l.strip().lower();m=re.search(r'income[:\s]*(\d+)',ll)
        if m:inc=int(m.group(1));continue
        if ll.startswith("goal"):goals.append(l.strip().replace("Goal: ","").replace("Goal:",""));continue
        m=re.match(r'^([a-z\s]+)[:\s]+[€$]?(\d+)',ll)
        if m and "income" not in m.group(1) and "goal" not in m.group(1):exp[m.group(1).strip().title()]=int(m.group(2))
    return {"income":inc,"expenses":exp,"goals":goals,"total":sum(exp.values())}

def score_idea(c):
    cl=c.lower();n=min(10,3+sum(1 for w in ["unique","novel","innovative","disrupt"] if w in cl)*2);f=min(10,4+sum(1 for w in ["mvp","prototype","simple","api","build"] if w in cl));m=min(10,2+sum(1 for w in ["market","500k","million","restaurant","revenue","saas"] if w in cl));return{"novelty":n,"feasibility":f,"market":m,"overall":round((n+f+m)/3,1)}

def parse_moods(c):
    MW={"great":5,"amazing":5,"happy":5,"motivated":5,"confident":5,"aced":5,"good":4,"fun":4,"better":4,"content":4,"organized":4,"okay":3,"lazy":3,"tired":2,"stressed":2,"bad":1,"sad":1}
    d=[]
    for l in c.split("\n"):
        dm=re.match(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[:\s]',l.strip(),re.I)
        if dm:
            mood=3
            for w,s in MW.items():
                if w in l.lower():mood=s;break
            d.append({"day":dm.group(1).title(),"mood":mood})
    return d

def parse_events(c):
    MO={"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,"jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12,"january":1,"february":2,"march":3,"april":4,"june":6,"july":7,"august":8,"september":9,"october":10,"november":11,"december":12}
    ev=[]
    for l in c.split("\n"):
        m=re.search(r'(.+?)\s*[—\-–]\s*(\w+)\s+(\d{1,2})',l.strip())
        if m and m.group(2).lower() in MO:
            try:
                ed=datetime(2026,MO[m.group(2).lower()],int(m.group(3)));delta=(ed-datetime(2026,2,17)).days
                det="";gm=re.search(r'[—\-–]\s*\w+\s+\d{1,2}\s*[—\-–]\s*(.+)',l.strip())
                if gm:det=gm.group(1).strip()
                ev.append({"name":m.group(1).strip(),"date":ed.strftime("%b %d"),"days":delta,"detail":det})
            except:pass
    return sorted(ev,key=lambda e:e["days"])

LVLS=[{"n":"Novice","min":0,"c":"l-nov","clr":"#8b8578","bar":"rgba(139,133,120,.3)"},{"n":"Beginner","min":100,"c":"l-beg","clr":"#2980b9","bar":"rgba(41,128,185,.3)"},{"n":"Intermediate","min":300,"c":"l-int","clr":"#1b2a4a","bar":"rgba(27,42,74,.3)"},{"n":"Advanced","min":600,"c":"l-adv","clr":"#c9912a","bar":"rgba(201,145,42,.4)"},{"n":"Expert","min":1000,"c":"l-exp","clr":"#2980b9","bar":"rgba(41,128,185,.4)"},{"n":"Master","min":1500,"c":"l-mas","clr":"#c0392b","bar":"rgba(192,57,43,.4)"}]

def get_lvl(xp):
    cur=LVLS[0]
    for l in LVLS:
        if xp>=l["min"]:cur=l
    return cur

def calc_knowledge():
    TC={"quantum_computing":{"kw":["qubit","quantum","superposition","entanglement","hadamard","cnot","pauli","decoherence","shor","grover","bloch"],"tot":15},"machine_learning":{"kw":["regression","decision tree","random forest","svm","supervised","unsupervised","k-means","pca","dbscan","neural","backpropag","gradient","relu","sigmoid","cnn","pytorch","tensorflow","scikit"],"tot":20},"finance":{"kw":["npv","irr","wacc","capital structure","modigliani","dividend","dcf","valuation","cash flow","risk","portfolio","capm"],"tot":15}}
    r={};all_c=" ".join(n["plain"] for n in st.session_state.notes.values() if n["cat"]=="study").lower()
    for t,i in TC.items():
        found=sum(1 for kw in i["kw"] if kw in all_c);pct=min(100,int(found/i["tot"]*100));xp=found*30
        r[t]={"name":t.replace("_"," ").title(),"pct":pct,"xp":xp,"lvl":get_lvl(xp),"found":found,"tot":i["tot"],"missing":[kw.title() for kw in i["kw"] if kw not in all_c][:5]}
    return r

# --- Smart Autocomplete Engine ---
AUTOCOMPLETE_DB = {
    "python":{"triggers":["python","def ","class ","import "],"suggestions":[
        {"title":"Docstring template","snippet":"\n\"\"\"\nDescription:\n\nArgs:\n    param1: description\n\nReturns:\n    description\n\"\"\""},
        {"title":"Error handling","snippet":"\ntry:\n    pass\nexcept Exception as e:\n    print(f'Error: {e}')"},
    ]},
    "ml":{"triggers":["machine learning","neural","regression","sklearn","pytorch","tensorflow","model"],"suggestions":[
        {"title":"Evaluation metrics","snippet":"\n\nModel Evaluation:\n- Accuracy, Precision, Recall, F1 Score\n- Confusion Matrix: TP, TN, FP, FN"},
        {"title":"Training pipeline","snippet":"\n\nTraining Pipeline:\n1. Preprocess & normalize\n2. Train/val/test split (70/15/15)\n3. Feature engineering\n4. Hyperparameter tuning\n5. Cross-validation\n6. Evaluate & deploy"},
    ]},
    "finance":{"triggers":["npv","irr","wacc","dcf","valuation","cash flow","capital","dividend"],"suggestions":[
        {"title":"DCF template","snippet":"\n\nDCF Steps:\n1. Project free cash flows (5-10y)\n2. Calculate terminal value\n3. Determine WACC\n4. Discount to present value\n5. Subtract net debt = equity value"},
        {"title":"WACC formula","snippet":"\n\nWACC = (E/V * Re) + (D/V * Rd * (1-T))"},
    ]},
    "workout":{"triggers":["bench","squat","deadlift","workout","exercise","sets","reps","press"],"suggestions":[
        {"title":"Progressive overload","snippet":"\n\nProgressive Overload:\nWk 1-2: Focus on form\nWk 3-4: +5% weight\nWk 5-6: +5% or +1 rep\nWk 7: Deload (60%)"},
    ]},
    "trip":{"triggers":["trip","travel","flight","hotel","day 1","itinerary"],"suggestions":[
        {"title":"Packing checklist","snippet":"\n\nPacking: Passport, charger, adapter, 3 outfits, rain jacket, toiletries"},
    ]},
}

def get_autocomplete(plain):
    cl = plain.lower()
    results = []
    for key, data in AUTOCOMPLETE_DB.items():
        if any(t in cl for t in data["triggers"]):
            for s in data["suggestions"]:
                results.append({**s, "key": key})
    return results[:4]

# --- Next Topics Engine ---
NEXT_TOPICS = {
    "quantum_computing":[
        {"topic":"Quantum Error Correction","desc":"Essential for practical quantum computers","video":"https://www.youtube.com/results?search_query=quantum+error+correction","target_note":"s1"},
        {"topic":"Quantum Machine Learning","desc":"Intersection of QC and ML","video":"https://www.youtube.com/results?search_query=quantum+machine+learning","target_note":"s1"},
    ],
    "machine_learning":[
        {"topic":"Transformers & Attention","desc":"Foundation of modern NLP and LLMs","video":"https://www.youtube.com/results?search_query=transformer+attention+mechanism+explained","target_note":"s2"},
        {"topic":"Reinforcement Learning","desc":"Agents, rewards, policies","video":"https://www.youtube.com/results?search_query=reinforcement+learning+basics","target_note":"s2"},
        {"topic":"MLOps & Deployment","desc":"Models from notebook to production","video":"https://www.youtube.com/results?search_query=mlops+model+deployment","target_note":"s2"},
    ],
    "finance":[
        {"topic":"Monte Carlo Simulation","desc":"Risk analysis and option pricing","video":"https://www.youtube.com/results?search_query=monte+carlo+simulation+finance","target_note":"s3"},
        {"topic":"LBO Modeling","desc":"Advanced PE valuation","video":"https://www.youtube.com/results?search_query=lbo+model+tutorial","target_note":"s3"},
    ],
}

def get_next_topics(knowledge):
    results = []
    for topic_key, info in knowledge.items():
        if info["pct"] < 80 and topic_key in NEXT_TOPICS:
            for nt in NEXT_TOPICS[topic_key]:
                results.append({**nt, "subject": info["name"], "current_pct": info["pct"]})
    return results[:5]

def render_sug(s):
    tcls={"youtube":"tt-yt","article":"tt-art","tutorial":"tt-tut"}.get(s.get("ty","youtube"),"tt-art")
    if s.get("thumb"):
        thumb_html=f'<img src="{s["thumb"]}" width="54" height="38" style="border-radius:5px;object-fit:cover;flex-shrink:0">'
    else:
        thumb_html=f'<div class="sug-thumb"><span class="tt {tcls}">{s.get("ty","YT").upper()}</span></div>'
    st.markdown(f'<a href="{s["url"]}" target="_blank" style="text-decoration:none"><div class="sug">{thumb_html}<div class="sug-body"><div class="sug-t">{html_mod.escape(s["t"])}</div><div class="sug-m">{html_mod.escape(s["ch"])}</div></div></div></a>',unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════
# SIDEBAR — Dark blue
# ═══════════════════════════════════════════════════════════════
with st.sidebar:
    g_clr="#4ade80" if GEMINI_KEY else "rgba(255,255,255,.2)"
    yt_clr="#4ade80" if YOUTUBE_KEY else "rgba(255,255,255,.2)"
    g_dot=f'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:{g_clr};margin-right:3px;vertical-align:middle"></span>'
    yt_dot=f'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:{yt_clr};margin-right:3px;vertical-align:middle"></span>'
    st.markdown(f'''<div style="padding:.3rem 0 .6rem">
  <div class="mono" style="color:#fff!important;font-size:1.2rem;font-weight:700;letter-spacing:-.3px;line-height:1.1">Notiq</div>
  <div style="font-size:.62rem;color:rgba(200,210,225,.5)!important;margin:.1rem 0 .4rem">AI-powered notes</div>
  <div style="display:flex;gap:10px;align-items:center">
    <span>{g_dot}<span style="font-size:.58rem;color:rgba(200,210,225,.5)!important">Gemini</span></span>
    <span>{yt_dot}<span style="font-size:.58rem;color:rgba(200,210,225,.5)!important">YouTube</span></span>
  </div></div>''',unsafe_allow_html=True)
    st.markdown("---")

    st.markdown('<p style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:rgba(200,210,225,.4)!important;letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem">New Note</p>',unsafe_allow_html=True)
    nt=st.text_input("t",placeholder="Title...",label_visibility="collapsed",key="nt")
    nf=st.selectbox("folder",list(st.session_state.folders.keys()),format_func=lambda x:st.session_state.folders[x]["name"],label_visibility="collapsed",key="nf")
    if st.button("+ Create",use_container_width=True):
        if nt:
            nid=f"n_{datetime.now().strftime('%H%M%S')}";ck=detect_cat(nt)
            st.session_state.notes[nid]={"title":nt,"cat":ck,"plain":"","created":datetime.now().strftime("%Y-%m-%d %H:%M")}
            st.session_state.folders[nf]["notes"].append(nid)
            st.session_state.active_note=nid;st.session_state.active_folder=nf;st.rerun()

    st.markdown("---")

    # Folder tree
    for fid,folder in st.session_state.folders.items():
        is_active_f = fid==st.session_state.active_folder
        f_clr="color:#fff!important;font-weight:700" if is_active_f else "color:rgba(200,210,225,.5)!important;font-weight:600"
        st.markdown(f'<p style="{f_clr};font-size:12px;margin:.7rem 0 .1rem;letter-spacing:.2px;text-transform:uppercase;font-family:\'JetBrains Mono\',monospace">{folder["name"]}</p>',unsafe_allow_html=True)
        for nid in folder["notes"]:
            if nid not in st.session_state.notes:continue
            note=st.session_state.notes[nid]
            if note.get("parent"):continue
            has_children=bool(note.get("children"))
            is_active_n = nid==st.session_state.active_note
            prefix="▸ " if has_children else "  "
            if st.button(f"{prefix}{note['title']}",key=f"sb_{nid}",use_container_width=True):
                if has_children and note["children"]:
                    st.session_state.active_note=note["children"][0]
                else:
                    st.session_state.active_note=nid
                st.session_state.active_folder=fid
            if has_children:
                for cid in note.get("children",[]):
                    if cid not in st.session_state.notes:continue
                    child=st.session_state.notes[cid]
                    is_active_c = cid==st.session_state.active_note
                    c_prefix="    "
                    if st.button(f"{c_prefix}{child['title']}",key=f"sb_{cid}",use_container_width=True):
                        st.session_state.active_note=cid;st.session_state.active_folder=fid

    st.markdown("---")
    st.markdown('<p style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:rgba(200,210,225,.4)!important;letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem">New Folder</p>',unsafe_allow_html=True)
    nfn=st.text_input("fn",placeholder="Folder name...",label_visibility="collapsed",key="nfn")
    if st.button("+ Folder",use_container_width=True):
        if nfn:
            fid=nfn.lower().replace(" ","_")[:20]
            st.session_state.folders[fid]={"name":nfn,"notes":[]}
            st.session_state.active_folder=fid;st.rerun()


# ═══════════════════════════════════════════════════════════════
# TOP BAR — Tabs + status dots + toggle
# ═══════════════════════════════════════════════════════════════
main_tab=st.tabs(["Notes","Summary","Reviews"])

# ═══════════════════════════════════════════════════════════════
# TAB 1: NOTES
# ═══════════════════════════════════════════════════════════════
with main_tab[0]:
    active=st.session_state.notes.get(st.session_state.active_note)
    if not active:
        st.markdown('<div style="text-align:center;padding:3rem"><h1 class="mono" style="color:var(--txt)">Notiq</h1><p style="color:var(--txt2)">Select or create a note.</p></div>',unsafe_allow_html=True)
    else:
        ci=CATS.get(active["cat"],CATS["daily"]);plain=active.get("plain","");cat=active["cat"]
        autocompletes=get_autocomplete(plain) if plain else []
        anid=st.session_state.active_note

        # Breadcrumb + title + toggle
        tb1,tb2=st.columns([7,3])
        with tb1:
            folder_name=""
            parent_id=active.get("parent")
            lookup_id=parent_id if parent_id else anid
            for fid,f in st.session_state.folders.items():
                if lookup_id in f["notes"]:folder_name=f["name"];break
            crumbs=folder_name
            if parent_id and parent_id in st.session_state.notes:
                crumbs+=f" / {st.session_state.notes[parent_id]['title']}"
            crumbs+=f" / {active['created']}"
            st.markdown(f'<span style="font-size:.62rem;color:var(--txt2)">{crumbs}</span><h2 class="mono" style="color:var(--txt);margin:.05rem 0;font-size:1.15rem">{active["title"]}</h2><span class="tag {ci["tc"]}">{ci["lb"]}</span>',unsafe_allow_html=True)
        with tb2:
            t_c1,t_c2=st.columns([1,1])
            with t_c1:
                ai_label="Hide AI" if st.session_state.show_ai else "Show AI"
                if st.button(ai_label,key="tai",use_container_width=True):
                    st.session_state.show_ai=not st.session_state.show_ai;st.rerun()
            with t_c2:
                if st.button("Refresh",key="ref_btn",use_container_width=True):st.rerun()

        # Layout: editor + optional AI panel
        if st.session_state.show_ai:
            col_ed,col_ai=st.columns([7,3],gap="medium")
        else:
            col_ed=st.container();col_ai=None

        # ── Editor ──
        with col_ed:
            updated=st.text_area("c",value=plain,height=400,label_visibility="collapsed",key=f"ed_{anid}")
            if updated!=plain:
                active["plain"]=updated;active["content"]=updated
                if len(updated)>20:active["cat"]=detect_cat(updated)

            bc1,bc2=st.columns([3,1])
            with bc1:
                ncs=st.selectbox("cat",[v["lb"] for v in CATS.values()],index=list(CATS.keys()).index(active["cat"]),label_visibility="collapsed",key="cc")
                for k,v in CATS.items():
                    if v["lb"]==ncs:active["cat"]=k;break
            with bc2:
                if st.button("Delete",key="del_btn",use_container_width=True):
                    if len(st.session_state.notes)>1:
                        nid=st.session_state.active_note
                        note_to_del=st.session_state.notes[nid]
                        pid=note_to_del.get("parent")
                        if pid and pid in st.session_state.notes:
                            pn=st.session_state.notes[pid]
                            if nid in pn.get("children",[]):pn["children"].remove(nid)
                        for f in st.session_state.folders.values():
                            if nid in f["notes"]:f["notes"].remove(nid)
                        for cid in note_to_del.get("children",[]):
                            if cid in st.session_state.notes:del st.session_state.notes[cid]
                        del st.session_state.notes[nid]
                        remaining=[k for k in st.session_state.notes if not st.session_state.notes[k].get("parent")]
                        st.session_state.active_note=remaining[0] if remaining else list(st.session_state.notes.keys())[0];st.rerun()

        # ── AI Panel ──
        if col_ai is not None:
            with col_ai:
                # YouTube suggestions
                if YOUTUBE_KEY and plain:
                    yt_q = gemini_yt_query(plain[:500], active.get("title",""), GEMINI_KEY)
                    if not yt_q:
                        yt_q = build_yt_query(active.get("title",""), plain, cat)
                    live_vids = yt_live_search(yt_q, YOUTUBE_KEY)
                else:
                    live_vids = []

                lbl_extra = '<span style="font-size:.5rem;color:#27ae60;margin-left:4px">● LIVE</span>' if live_vids else ""
                st.markdown(f'<p class="sh">Resources{lbl_extra}</p>',unsafe_allow_html=True)
                if live_vids:
                    for s in live_vids: render_sug(s)
                else:
                    st.markdown('<p style="color:var(--txt2);font-size:.72rem">Type to get suggestions.</p>',unsafe_allow_html=True)

                # Autocomplete
                if autocompletes:
                    st.markdown('<p class="sh2" style="margin-top:.6rem">Quick Add</p>',unsafe_allow_html=True)
                    for i,ac in enumerate(autocompletes):
                        if st.button(f"+ {ac['title']}",key=f"ac_{i}_{anid}",use_container_width=True):
                            active["plain"]+=ac["snippet"]
                            active["content"]=active["plain"]
                            st.rerun()

                # Knowledge (study notes)
                if cat=="study":
                    know=calc_knowledge()
                    rel={k:v for k,v in know.items() if any(w in plain.lower() for w in k.replace("_"," ").split())}
                    if not rel:rel=know
                    st.markdown('<p class="sh" style="margin-top:.6rem">Knowledge</p>',unsafe_allow_html=True)
                    for k,info in rel.items():
                        lv=info["lvl"]
                        st.markdown(f'<div style="margin-bottom:.5rem"><div style="display:flex;justify-content:space-between;align-items:center"><span style="color:var(--txt);font-size:.76rem;font-weight:600">{info["name"]}</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:.68rem;color:var(--txt2)">{info["pct"]}%</span></div><div class="pbb"><div class="pb" style="width:{info["pct"]}%;background:linear-gradient(90deg,{lv["bar"]},{lv["clr"]})"></div></div></div>',unsafe_allow_html=True)
                    dls=re.findall(r'(?:due|deadline|exam)[:\s]*(\w+\s+\d{1,2})',plain,re.I)
                    if dls:
                        st.markdown('<div class="cw"><p class="sh3">Deadlines</p>',unsafe_allow_html=True)
                        for d in dls:st.markdown(f'<p style="color:var(--accent);font-size:.76rem">{d}</p>',unsafe_allow_html=True)
                        st.markdown('</div>',unsafe_allow_html=True)

                # Analysis for other categories
                if cat!="study" and plain:
                    st.markdown('<p class="sh" style="margin-top:.6rem">Analysis</p>',unsafe_allow_html=True)
                    if cat=="daily":
                        if is_shopping(plain):
                            st.markdown('<div class="cg"><p class="sh">Shopping List</p><p style="color:var(--txt3);font-size:.72rem">Recipes matched from ingredients.</p></div>',unsafe_allow_html=True)
                        else:
                            p=parse_tasks(plain)
                            if p["tasks"]:
                                st.markdown(f'<div class="cg"><p class="sh">Tasks</p><p style="color:var(--txt3)"><span class="mono" style="color:var(--txt)">{p["done"]}/{p["total"]}</span> done</p></div>',unsafe_allow_html=True)
                    if cat=="health":
                        cd=parse_cals(plain)
                        if cd:
                            avg=sum(d["cal"] for d in cd.values())//len(cd)
                            st.markdown(f'<div class="cg"><p class="sh">Meals</p><p style="color:var(--txt3)"><span class="mono" style="color:var(--txt)">{avg}</span> avg cal/day</p></div>',unsafe_allow_html=True)
                        else:
                            exs=[w for w in ["bench","squat","deadlift","press","curl","row","pull-up","lunge","plank"] if w in plain.lower()]
                            if exs:
                                st.markdown(f'<div class="cg"><p class="sh">Workout</p><p style="color:var(--txt3)">{len(exs)} exercises</p></div>',unsafe_allow_html=True)
                    if cat=="plan":
                        bg=parse_budget(plain)
                        if bg["income"]>0:
                            rem=bg["income"]-bg["total"]
                            st.markdown(f'<div class="cg"><p class="sh">Budget</p><p style="color:var(--txt3);font-size:.76rem">In: {bg["income"]} / Out: {bg["total"]} / Left: {rem}</p></div>',unsafe_allow_html=True)
                    if cat=="idea":
                        sc=score_idea(plain)
                        st.markdown(f'<div class="cg"><p class="sh">Score: <span style="color:var(--txt)">{sc["overall"]}/10</span></p></div>',unsafe_allow_html=True)
                    if cat=="social":
                        evts=parse_events(plain)
                        if evts:
                            st.markdown('<div class="cg"><p class="sh">Events</p>',unsafe_allow_html=True)
                            for ev in evts[:4]:
                                badge=f'<span class="pri pri-u">{ev["days"]}d</span>' if 0<=ev["days"]<=7 else f'<span class="pri pri-h">{ev["days"]}d</span>' if 0<=ev["days"]<=30 else f'<span class="pri pri-n">{ev["days"]}d</span>' if ev["days"]>0 else '<span class="pri pri-l">past</span>'
                                st.markdown(f'<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="color:var(--txt);font-size:.74rem">{ev["name"]}</span>{badge}</div>',unsafe_allow_html=True)
                            st.markdown('</div>',unsafe_allow_html=True)

                # Next steps
                if GEMINI_KEY and plain:
                    content_hash = hashlib.md5(plain[:500].encode()).hexdigest()[:8]
                    steps = gemini_next_steps(plain[:1500], GEMINI_KEY)
                    if steps:
                        st.markdown('<p class="sh" style="margin-top:.6rem">Next Steps</p>',unsafe_allow_html=True)
                        for i,step in enumerate(steps):
                            if st.button(f"+ {step}",key=f"ns_{i}_{anid}_{content_hash}",use_container_width=True):
                                active["plain"]+=f"\n\n- [ ] {step}"
                                active["content"]=active["plain"]
                                st.rerun()

                # AI Chatbot
                st.markdown('<p class="sh" style="margin-top:.85rem">Ask AI</p>',unsafe_allow_html=True)
                note_chat_key = f"chat_{anid}"
                if note_chat_key not in st.session_state.chat_history:
                    st.session_state.chat_history[note_chat_key] = []
                history = st.session_state.chat_history[note_chat_key]

                if history:
                    for msg in history[-6:]:
                        if msg["role"]=="user":
                            st.markdown(f'<div class="chat-user">{html_mod.escape(msg["text"])}</div>',unsafe_allow_html=True)
                        else:
                            st.markdown(f'<div class="chat-ai">{html_mod.escape(msg["text"])}</div>',unsafe_allow_html=True)

                ai_q=st.text_input("q",placeholder="Ask about this note...",label_visibility="collapsed",key=f"ai_q_{anid}")
                ask_c,add_c,clr_c=st.columns([2,1,1])
                with ask_c:
                    if st.button("Ask",key="btn_ask_ai",use_container_width=True):
                        if ai_q and plain:
                            hist_text=""
                            for msg in history[-6:]:
                                role="User" if msg["role"]=="user" else "AI"
                                hist_text+=f"{role}: {msg['text']}\n"
                            with st.spinner("Thinking..."):
                                response=gemini_chat(plain[:3000],ai_q,hist_text,GEMINI_KEY)
                            history.append({"role":"user","text":ai_q})
                            history.append({"role":"ai","text":response})
                            st.rerun()
                        elif not plain:
                            history.append({"role":"ai","text":"Write something in the note first."})
                            st.rerun()
                with add_c:
                    if history and history[-1]["role"]=="ai":
                        if st.button("+Note",key="btn_add_ai",use_container_width=True):
                            last_ai = history[-1]["text"]
                            active["plain"]+=f"\n\n---\n{last_ai}"
                            active["content"]=active["plain"]
                            st.rerun()
                with clr_c:
                    if st.button("Clear",key="btn_clr_ai",use_container_width=True):
                        st.session_state.chat_history[note_chat_key]=[]
                        st.rerun()


# ═══════════════════════════════════════════════════════════════
# TAB 2: SUMMARY + NEXT TOPICS
# ═══════════════════════════════════════════════════════════════
with main_tab[1]:
    st.markdown('<h2 class="mono" style="color:var(--txt);font-size:1.15rem">Summary Dashboard</h2>',unsafe_allow_html=True)
    stabs=st.tabs([v["lb"] for v in CATS.values()])
    def nfor(cat):return[n for n in st.session_state.notes.values() if n["cat"]==cat]

    with stabs[0]:
        dn=nfor("daily");at=[]
        for n in dn:at.extend(parse_tasks(n["plain"])["tasks"])
        done=sum(1 for t in at if t["done"]);total=len(at);pct=int(done/total*100) if total else 0
        st.markdown(f'<div class="sts"><div class="st"><div class="st-n">{done}/{total}</div><div class="st-l">Done</div></div><div class="st"><div class="st-n">{pct}%</div><div class="st-l">Rate</div></div></div>',unsafe_allow_html=True)

    with stabs[1]:
        know=calc_knowledge()
        c1,c2=st.columns([2,1])
        with c1:
            try:
                import plotly.graph_objects as go
                names=[t["name"] for t in know.values()];pcts=[t["pct"] for t in know.values()]
                fig=go.Figure(go.Scatterpolar(r=pcts+[pcts[0]],theta=names+[names[0]],fill='toself',line=dict(color='#2980b9'),fillcolor='rgba(41,128,185,.12)'))
                fig.update_layout(polar=dict(bgcolor="#f8f6f2",radialaxis=dict(visible=True,range=[0,100],gridcolor="rgba(27,42,74,.08)"),angularaxis=dict(gridcolor="rgba(27,42,74,.08)",tickfont=dict(color="#1b2a4a",size=11))),paper_bgcolor="#f3f0eb",font=dict(color="#1b2a4a"),margin=dict(t=25,b=25,l=55,r=55),height=300)
                st.plotly_chart(fig,use_container_width=True)
            except ImportError:pass
            for k,info in know.items():
                lv=info["lvl"]
                st.markdown(f'<div class="cd"><div style="display:flex;justify-content:space-between"><span style="color:var(--txt);font-weight:600;font-size:.82rem">{info["name"]}</span><span class="lvl {lv["c"]}">{lv["n"]}</span></div><div class="pbb"><div class="pb" style="width:{info["pct"]}%;background:linear-gradient(90deg,{lv["bar"]},{lv["clr"]})"></div></div></div>',unsafe_allow_html=True)

        with c2:
            st.markdown('<p class="sh" style="margin-bottom:.4rem">Recommended Next Topics</p>',unsafe_allow_html=True)
            st.markdown('<p style="color:var(--txt2);font-size:.68rem;margin-bottom:.4rem">Click to add a topic to your notes.</p>',unsafe_allow_html=True)
            next_topics=get_next_topics(know)
            for i,nt_item in enumerate(next_topics):
                st.markdown(f'<div class="nt"><div><div style="font-size:.76rem;font-weight:600;color:var(--txt)">{nt_item["topic"]}</div><div style="font-size:.62rem;color:var(--txt2)">{nt_item["subject"]} ({nt_item["current_pct"]}%) — {nt_item["desc"]}</div></div></div>',unsafe_allow_html=True)
                bc1_nt,bc2_nt=st.columns([1,1])
                with bc1_nt:
                    if st.button(f"Add to notes",key=f"nt_{i}"):
                        target=nt_item.get("target_note","s1")
                        if target in st.session_state.notes:
                            n=st.session_state.notes[target]
                            snippet=f"\n\n---\n{nt_item['topic']}: {nt_item['desc']}\nResource: {nt_item['video']}"
                            n["plain"]+=snippet;n["content"]=n["plain"]
                            st.success(f"Added '{nt_item['topic']}' to {n['title']}");st.rerun()
                with bc2_nt:
                    st.markdown(f'<a href="{nt_item["video"]}" target="_blank" style="text-decoration:none;font-size:.68rem;color:var(--txt2)">Watch video</a>',unsafe_allow_html=True)

    with stabs[2]:
        hn=nfor("health");acd={}
        for n in hn:acd.update(parse_cals(n["plain"]))
        if acd:
            try:
                import plotly.graph_objects as go
                do=["Monday","Tuesday","Wednesday","Thursday","Friday"]
                sd=[d for d in do if d in acd];cv=[acd[d]["cal"] for d in sd]
                cls=["#2980b9" if c<2000 else "#c9912a" if c<2500 else "#c0392b" for c in cv]
                fig=go.Figure(go.Bar(x=sd,y=cv,marker_color=cls,text=cv,textposition="outside",textfont=dict(color="#1b2a4a")))
                fig.update_layout(paper_bgcolor="#f3f0eb",plot_bgcolor="#f8f6f2",font=dict(color="#1b2a4a"),margin=dict(t=25,b=25),height=250)
                st.plotly_chart(fig,use_container_width=True)
            except ImportError:pass

    with stabs[3]:
        pn=nfor("plan")
        for n in pn:
            bg=parse_budget(n["plain"])
            if bg["income"]>0:
                try:
                    import plotly.graph_objects as go
                    fig=go.Figure(go.Pie(labels=list(bg["expenses"].keys()),values=list(bg["expenses"].values()),marker=dict(colors=["#1b2a4a","#2a3f6e","#3d5a99","#4a6fa5","#2980b9","#c9912a","#c0392b","#8b8578"]),hole=.4))
                    fig.update_layout(paper_bgcolor="#f3f0eb",font=dict(color="#1b2a4a"),margin=dict(t=15,b=15),height=260)
                    st.plotly_chart(fig,use_container_width=True)
                except ImportError:pass
                break

    with stabs[4]:
        idn=nfor("idea")
        scored=sorted([{"title":n["title"],**score_idea(n["plain"])} for n in idn],key=lambda x:x["overall"],reverse=True)
        for i,idea in enumerate(scored):
            st.markdown(f'<div class="cd"><div style="display:flex;justify-content:space-between"><span style="color:var(--txt);font-weight:600">#{i+1} {idea["title"]}</span><span class="mono" style="color:var(--txt)">{idea["overall"]}/10</span></div></div>',unsafe_allow_html=True)

    with stabs[5]:
        sn2=nfor("social");amoods=[]
        for n in sn2:amoods.extend(parse_moods(n["plain"]))
        if amoods:
            try:
                import plotly.graph_objects as go
                MC={1:"#c0392b",2:"#c9912a",3:"#8b8578",4:"#2980b9",5:"#27ae60"}
                fig=go.Figure(go.Scatter(x=[m["day"] for m in amoods],y=[m["mood"] for m in amoods],mode='lines+markers',line=dict(color="#2980b9",width=3),marker=dict(size=10,color=[MC.get(s["mood"],"#8b8578") for s in amoods]),fill='tozeroy',fillcolor='rgba(41,128,185,.06)'))
                fig.update_layout(paper_bgcolor="#f3f0eb",plot_bgcolor="#f8f6f2",font=dict(color="#1b2a4a"),yaxis=dict(range=[0,6],dtick=1),margin=dict(t=15,b=25),height=240)
                st.plotly_chart(fig,use_container_width=True)
            except ImportError:pass


# ═══════════════════════════════════════════════════════════════
# TAB 3: REVIEWS
# ═══════════════════════════════════════════════════════════════
with main_tab[2]:
    st.markdown('<h2 class="mono" style="color:var(--txt);font-size:1.15rem">Reviews</h2>',unsafe_allow_html=True)
    r1,r2=st.columns([3,2],gap="large")
    with r1:
        fc1,fc2=st.columns(2)
        with fc1:
            rcat=st.selectbox("Cat",[v["lb"] for v in CATS.values()],key="rc");rck="daily"
            for k,v in CATS.items():
                if v["lb"]==rcat:rck=k;break
        with fc2:ritm=st.text_input("What?",placeholder="e.g. Stir-Fry",key="ri")
        rrat=st.slider("Rating",1,5,3,key="rr")
        fc3,fc4=st.columns(2)
        with fc3:rlk=st.text_input("Liked?",placeholder="quick, tasty",key="rl")
        with fc4:rdk=st.text_input("Disliked?",placeholder="too salty",key="rd")
        if st.button("Submit",use_container_width=True):
            if ritm:
                lks=[x.strip() for x in rlk.split(",") if x.strip()] if rlk else [];dks=[x.strip() for x in rdk.split(",") if x.strip()] if rdk else []
                st.session_state.reviews.append({"cat":rck,"item":ritm,"rating":rrat,"likes":lks,"dislikes":dks,"date":datetime.now().strftime("%Y-%m-%d")})
                if rck not in st.session_state.preferences:st.session_state.preferences[rck]={"likes":[],"dislikes":[]}
                p=st.session_state.preferences[rck]
                for l in lks:
                    if l not in p["likes"]:p["likes"].append(l)
                for d in dks:
                    if d not in p["dislikes"]:p["dislikes"].append(d)
                st.success(f"Saved: {ritm}");st.rerun()
        for rev in reversed(st.session_state.reviews):
            ci=CATS.get(rev["cat"],CATS["daily"])
            lh=" ".join(f'<span class="pref pref-y">{l}</span>' for l in rev.get("likes",[]))
            dh=" ".join(f'<span class="pref pref-n">{d}</span>' for d in rev.get("dislikes",[]))
            st.markdown(f'<div class="cw"><div style="display:flex;justify-content:space-between"><div><span class="tag {ci["tc"]}">{ci["lb"]}</span><div style="color:var(--txt);font-weight:600;margin-top:2px">{rev["item"]}</div></div><span class="mono" style="color:var(--txt)">{rev["rating"]}/5</span></div><div style="margin-top:3px">{lh}{dh}</div></div>',unsafe_allow_html=True)
    with r2:
        st.markdown('<div class="cg"><p class="sh">Learned Preferences</p></div>',unsafe_allow_html=True)
        for ck,prefs in st.session_state.preferences.items():
            ci=CATS.get(ck,CATS["daily"]);lh=" ".join(f'<span class="pref pref-y">{l}</span>' for l in prefs.get("likes",[]));dh=" ".join(f'<span class="pref pref-n">{d}</span>' for d in prefs.get("dislikes",[]))
            if lh or dh:st.markdown(f'<div class="cd"><span class="tag {ci["tc"]}">{ci["lb"]}</span><div style="margin-top:3px">{lh}</div><div>{dh}</div></div>',unsafe_allow_html=True)
