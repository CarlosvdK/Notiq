"""
SmartNotes v6.0 — Folders, Smart Autocomplete, Next-Topics
Run: pip install streamlit plotly streamlit-quill
     streamlit run smartnotes_v6.py
"""
import streamlit as st
import re, html as html_mod, requests
from datetime import datetime
from collections import Counter

st.set_page_config(page_title="Notiq",page_icon="N",layout="wide",initial_sidebar_state="expanded")
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
:root{--bg:#0a0a0a;--bg2:#111;--bg3:#1a1a1a;--glass:rgba(255,255,255,.05);--glass-h:rgba(255,255,255,.09);--glass-b:rgba(255,255,255,.10);--shadow:0 4px 16px rgba(0,0,0,.5);--a1:#f0f0f0;--a2:#999;--a3:#666;--grad:linear-gradient(135deg,#e0e0e0,#aaa);--txt:#f5f5f5;--txt2:rgba(245,245,245,.40);--txt3:rgba(245,245,245,.62);--red:#ff5c5c;--amber:#c9912a;--blue:#7abfea;--purple:#b8b8b8;--cyan:#6ec8c8;--pink:#d0d0d0}
.stApp{background:var(--bg);font-family:'Inter',sans-serif;color:var(--txt)}
#MainMenu,footer,header{visibility:hidden}
.block-container{padding-top:.5rem;max-width:1500px}
.cd{background:var(--glass);border:1px solid var(--glass-b);border-radius:10px;padding:.9rem;margin-bottom:.5rem;box-shadow:var(--shadow);transition:all .2s}
.cd:hover{background:var(--glass-h);border-color:rgba(255,255,255,.18)}
.cg{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.9rem;margin:.5rem 0;box-shadow:var(--shadow)}
.cw{background:rgba(201,145,42,.06);border:1px solid rgba(201,145,42,.15);border-radius:10px;padding:.9rem;margin-bottom:.5rem;box-shadow:var(--shadow)}
.cb{background:rgba(122,191,234,.05);border:1px solid rgba(122,191,234,.12);border-radius:10px;padding:.9rem;margin-bottom:.5rem;box-shadow:var(--shadow)}
.sug{background:var(--glass);border:1px solid var(--glass-b);border-radius:8px;padding:.5rem;margin-bottom:.4rem;transition:all .2s;display:flex;gap:.5rem;align-items:center}
.sug:hover{border-color:rgba(255,255,255,.2);background:var(--glass-h)}
.sug-thumb{width:48px;height:34px;border-radius:5px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.5rem;color:var(--txt2);border:1px solid var(--glass-b)}
.sug-body{flex:1;min-width:0}.sug-t{font-size:.74rem;font-weight:600;color:var(--txt);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sug-m{font-size:.62rem;color:var(--txt2)}
.tag{display:inline-block;padding:2px 7px;border-radius:20px;font-size:.62rem;font-weight:600;margin:1px 2px;letter-spacing:.3px;text-transform:uppercase}
.t-task{background:rgba(240,240,240,.07);color:var(--a1)}.t-study{background:rgba(122,191,234,.10);color:var(--blue)}.t-health{background:rgba(110,200,200,.10);color:var(--cyan)}.t-plan{background:rgba(201,145,42,.10);color:var(--amber)}.t-idea{background:rgba(184,184,184,.08);color:var(--purple)}.t-social{background:rgba(110,200,200,.08);color:var(--cyan)}
.tt{display:inline-block;padding:1px 5px;border-radius:3px;font-size:.52rem;font-weight:700;text-transform:uppercase}.tt-yt{background:rgba(255,92,92,.15);color:var(--red)}.tt-art{background:rgba(122,191,234,.10);color:var(--blue)}.tt-tut{background:rgba(184,184,184,.10);color:var(--purple)}
.lvl{display:inline-block;padding:2px 7px;border-radius:5px;font-size:.62rem;font-weight:700;text-transform:uppercase}.l-nov{background:rgba(255,255,255,.05);color:var(--txt2)}.l-beg{background:rgba(122,191,234,.10);color:var(--blue)}.l-int{background:rgba(255,255,255,.07);color:var(--a1)}.l-adv{background:rgba(201,145,42,.10);color:var(--amber)}.l-exp{background:rgba(184,184,184,.10);color:var(--purple)}.l-mas{background:rgba(255,92,92,.10);color:var(--red)}
.pref{display:inline-block;padding:2px 6px;border-radius:20px;font-size:.64rem;font-weight:600;margin:1px 2px}.pref-y{background:rgba(255,255,255,.07);color:var(--a1)}.pref-n{background:rgba(255,92,92,.10);color:var(--red)}
.pri{display:inline-block;padding:2px 6px;border-radius:5px;font-size:.6rem;font-weight:700}.pri-u{background:rgba(255,92,92,.15);color:var(--red)}.pri-h{background:rgba(201,145,42,.12);color:var(--amber)}.pri-n{background:rgba(255,255,255,.06);color:var(--a1)}.pri-l{background:rgba(255,255,255,.04);color:var(--txt2)}
.pbb{background:rgba(255,255,255,.06);border-radius:6px;height:6px;width:100%;overflow:hidden;margin:3px 0}.pb{height:100%;border-radius:6px;transition:width .5s}
.sts{display:flex;gap:.5rem;margin:.5rem 0}.st{background:var(--glass);border:1px solid var(--glass-b);border-radius:10px;padding:.5rem .7rem;flex:1;text-align:center}.st-n{font-family:'JetBrains Mono',monospace;font-size:1.3rem;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700}.st-l{font-size:.6rem;color:var(--txt2);text-transform:uppercase;letter-spacing:.7px}
.mono{font-family:'JetBrains Mono',monospace}
.sh{font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--a2);letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem}
.sh2{font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--blue);letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem}
.sh3{font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--amber);letter-spacing:.5px;text-transform:uppercase;margin-bottom:.25rem}
/* autocomplete suggestion */
.ac{background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.15);border-radius:8px;padding:.7rem;margin:.4rem 0;cursor:pointer;transition:all .2s}
.ac:hover{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.06)}
.ac-t{font-size:.78rem;font-weight:600;color:var(--a1)}.ac-d{font-size:.7rem;color:var(--txt3);margin-top:2px}
/* next topic card */
.nt{background:var(--glass);border:1px solid var(--glass-b);border-radius:10px;padding:.7rem;margin-bottom:.4rem;display:flex;justify-content:space-between;align-items:center}
.stTextArea textarea,.stTextInput input{background:var(--glass)!important;border:1px solid var(--glass-b)!important;border-radius:8px!important;color:var(--txt)!important;font-family:'Inter',sans-serif!important;font-size:.88rem!important}
.stSelectbox>div>div{background:var(--glass)!important;border:1px solid var(--glass-b)!important;border-radius:8px!important}
div[data-testid="stSidebar"]{background:linear-gradient(180deg,#050505,#0a0a0a,#070707)!important;border-right:1px solid rgba(255,255,255,.07)!important}
.stButton>button{background:linear-gradient(135deg,#2d2d2d,#444)!important;color:#f0f0f0!important;font-weight:600!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:7px!important;padding:.35rem 1rem!important;font-family:'Inter',sans-serif!important;font-size:.78rem!important;box-shadow:none!important}
.stButton>button:hover{background:linear-gradient(135deg,#333,#555)!important;border-color:rgba(255,255,255,.2)!important}
div[data-testid="stSidebar"] .stButton>button{width:100%;margin-bottom:1px;font-size:.78rem!important;padding:.25rem .6rem!important;background:transparent!important;border:none!important;color:var(--txt3)!important;font-weight:400!important;box-shadow:none!important;border-radius:5px!important;text-align:left!important}
div[data-testid="stSidebar"] .stButton>button:hover{background:var(--glass)!important;color:var(--txt)!important;border-color:transparent!important}
.stTabs [data-baseweb="tab-list"]{gap:0;background:var(--glass);border-radius:8px;padding:3px;border:1px solid var(--glass-b)}
.stTabs [data-baseweb="tab"]{border-radius:6px;padding:5px 14px;font-weight:600;font-size:.78rem;color:var(--txt2)}
.stTabs [aria-selected="true"]{background:rgba(255,255,255,.08)!important;color:var(--a1)!important}
.stTabs [data-baseweb="tab-border"],.stTabs [data-baseweb="tab-highlight"]{display:none}
.ql-toolbar{background:rgba(255,255,255,.03)!important;border:none!important;border-bottom:1px solid var(--glass-b)!important;border-radius:10px 10px 0 0!important}
.ql-container{border:none!important;font-family:'Inter',sans-serif!important;color:var(--txt)!important}
.ql-editor{min-height:300px!important;color:var(--txt)!important}
.ql-editor.ql-blank::before{color:var(--txt2)!important}
.ql-snow .ql-stroke{stroke:var(--txt3)!important}.ql-snow .ql-fill{fill:var(--txt3)!important}.ql-snow .ql-picker-label{color:var(--txt3)!important}
.ql-snow .ql-picker-options{background:var(--bg2)!important;border:1px solid var(--glass-b)!important}
</style>
""",unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# API KEYS
# ═══════════════════════════════════════════════════════════════
GEMINI_KEY  = "AIzaSyC1ECDxN4bZbKlt1UmhRgrjEF1-5UNoJuw"
YOUTUBE_KEY = "AIzaSyB1ik2Qn1sDsEg1D3ZAesGvf6jsFqS0oGk"

# ═══════════════════════════════════════════════════════════════
# SECTION 2: DATA MODEL — Folders + Notes
# ═══════════════════════════════════════════════════════════════
CATS={"daily":{"lb":"Daily Tasks","tc":"t-task","cl":"#e879a8"},"study":{"lb":"Work / Study","tc":"t-study","cl":"#8be9fd"},"health":{"lb":"Health & Fitness","tc":"t-health","cl":"#ff79c6"},"plan":{"lb":"Planning & Finance","tc":"t-plan","cl":"#ffb86c"},"idea":{"lb":"Ideas & Creativity","tc":"t-idea","cl":"#bd93f9"},"social":{"lb":"Social & Memories","tc":"t-social","cl":"#67e8f9"}}

if "folders" not in st.session_state:
    st.session_state.folders = {
        "personal":{"name":"Personal","notes":["d1","d2","h1","h2","x1","x2"]},
        "mban_t2":{"name":"MBAn Term 2","notes":["s1","s2","s3"]},
        "projects":{"name":"Projects & Ideas","notes":["i1","i2"]},
        "planning":{"name":"Planning","notes":["p1","p2"]},
    }

if "notes" not in st.session_state:
    st.session_state.notes = {
        "d1":{"title":"Weekly Errands","cat":"daily","plain":"- [x] Buy groceries\n- [ ] Call mom\n- [x] Pay electricity bill\n- [ ] Pick up dry cleaning\n- [ ] Email professor about deadline\n- [x] Book dentist appointment\n- [ ] Return Amazon package","created":"2026-02-15 08:30"},
        "d2":{"title":"Grocery Shopping","cat":"daily","plain":"Chicken breast\nOnions\nBell peppers\nGarlic\nSoy sauce\nRice\nBroccoli\nGinger\nSesame oil\nGreen onions","created":"2026-02-16 09:00"},
        "s1":{"title":"Quantum Computing","cat":"study","plain":"Qubits vs classical bits — superposition allows qubits to be in multiple states simultaneously.\n\nKey concepts:\n- Quantum entanglement\n- Quantum gates (Hadamard, CNOT, Pauli)\n- Decoherence and error correction\n- Shor's algorithm for factoring\n- Grover's search algorithm\n\nNeed to review: Bloch sphere representation and density matrices.","created":"2026-02-14 14:22"},
        "s2":{"title":"Machine Learning","cat":"study","plain":"Supervised learning:\n- Linear regression, Logistic regression\n- Decision trees, Random forests, SVM\n\nUnsupervised learning:\n- K-means clustering\n- PCA dimensionality reduction\n- DBSCAN\n\nDeep learning:\n- Neural network architecture\n- Backpropagation & gradient descent\n- Activation functions (ReLU, sigmoid, tanh)\n\nLibraries: scikit-learn, TensorFlow, PyTorch\n\nAssignment due: Feb 28 — implement a CNN for image classification","created":"2026-02-15 10:30"},
        "s3":{"title":"Corporate Finance","cat":"study","plain":"Corporate Finance — Week 5\n- NPV and IRR calculations\n- Weighted average cost of capital (WACC)\n- Capital structure theory (Modigliani-Miller)\n- Dividend policy\n\nExam: March 15\nNeed to practice: DCF valuation models","created":"2026-02-16 11:00"},
        "h1":{"title":"Weekly Workout Plan","cat":"health","plain":"Monday: Upper body — bench press 4x8, rows 4x10, overhead press 3x8, bicep curls 3x12\nTuesday: Lower body — squats 5x5, deadlifts 3x5, lunges 3x10, leg press 3x12\nWednesday: Rest / active recovery — 30 min walk\nThursday: Push — chest press, shoulder press, tricep dips, lateral raises\nFriday: Pull — pull-ups, barbell rows, face pulls, hammer curls\nSaturday: Legs + core — front squats, RDLs, planks, hanging leg raises\nSunday: Rest","created":"2026-02-12 08:00"},
        "h2":{"title":"Meal Log This Week","cat":"health","plain":"Monday: Oatmeal + banana (350cal), Chicken salad (450cal), Pasta with veggies (600cal), Protein shake (200cal)\nTuesday: Eggs + toast (400cal), Rice bowl + chicken (550cal), Stir fry (500cal), Greek yogurt (150cal)\nWednesday: Smoothie (300cal), Sandwich (450cal), Salmon + rice (650cal), Fruit (100cal)\nThursday: Pancakes (500cal), Burrito bowl (600cal), Chicken breast + sweet potato (550cal)\nFriday: Granola + milk (350cal), Sushi (500cal), Pizza (700cal), Ice cream (250cal)","created":"2026-02-14 20:00"},
        "p1":{"title":"Barcelona Trip Plan","cat":"plan","plain":"Day 1: Sagrada Familia, Park Guell, Gracia neighborhood\nDay 2: Gothic Quarter, La Rambla, Barceloneta Beach\nDay 3: Camp Nou, Montjuic, Magic Fountain\nDay 4: La Boqueria market, El Born, Picasso Museum\n\nBudget: 800 for 4 days\nHotel: Hotel Jazz, Carrer de Pelai","created":"2026-02-10 15:00"},
        "p2":{"title":"February Budget","cat":"plan","plain":"Income: 2500\n\nRent: 800\nGroceries: 300\nTransport: 80\nSubscriptions: 45\nDining out: 150\nClothing: 100\nSavings: 500\nMiscellaneous: 200\n\nGoal: Save 500 this month\nGoal: Keep dining under 150","created":"2026-02-01 09:00"},
        "i1":{"title":"Restaurant Analytics SaaS","cat":"idea","plain":"Problem: Small restaurants don't have access to data analytics\nSolution: Simple dashboard that connects to POS systems\n\nFeatures:\n- Revenue trends & forecasting\n- Menu item performance\n- Peak hours analysis\n- Food cost tracking\n\nMonetization: 49/month per restaurant\nMarket: 500K+ independent restaurants in EU\nCompetitors: Toast, MarketMan\n\nNext steps: Build MVP, talk to 10 restaurant owners","created":"2026-02-08 22:00"},
        "i2":{"title":"YouTube Content Ideas","cat":"idea","plain":"1. Day in the life at ESADE\n2. How I built my first SaaS\n3. Study with me — Pomodoro session\n4. Barcelona on a student budget\n5. Comparing MBA programs in Europe\n\nGoal: 1 video per week\nEquipment needed: Better microphone","created":"2026-02-13 19:00"},
        "x1":{"title":"Birthday & Gift Ideas","cat":"social","plain":"Mom — March 12 — Loves gardening\nCarlos — April 3 — Into gaming\nSarah — Feb 28 — cookbook by Ottolenghi\nDad — June 15 — golf balls\n\nESADE class reunion: March 20","created":"2026-02-11 16:00"},
        "x2":{"title":"Journal — Feb Week 2","cat":"social","plain":"Monday: Great day — aced the finance quiz, feeling confident\nTuesday: Stressed about the ML assignment, stayed up late\nWednesday: Coffee with Sarah, feeling better\nThursday: Gym was amazing, hit a PR on deadlifts. Happy\nFriday: Went out with Carlos, fun night but tired\nSaturday: Lazy day, watched movies. Content\nSunday: Planned the week, feeling organized and motivated","created":"2026-02-16 21:00"},
    }

if "active_note" not in st.session_state: st.session_state.active_note = "s2"
if "active_folder" not in st.session_state: st.session_state.active_folder = "mban_t2"
if "show_ai" not in st.session_state: st.session_state.show_ai = True
if "reviews" not in st.session_state:
    st.session_state.reviews = [{"cat":"health","item":"Chicken Stir-Fry","rating":4,"likes":["quick","high protein"],"dislikes":["too salty"],"date":"2026-02-10"},{"cat":"health","item":"Push Day","rating":3,"likes":["compound movements"],"dislikes":["too long","shoulder fatigue"],"date":"2026-02-13"}]
if "preferences" not in st.session_state:
    st.session_state.preferences = {"health":{"likes":["quick","high protein","compound movements","efficient"],"dislikes":["too salty","too long","shoulder fatigue"]}}
if "ai_response" not in st.session_state: st.session_state.ai_response = ""
if "ai_note_id"  not in st.session_state: st.session_state.ai_note_id  = ""


# ═══════════════════════════════════════════════════════════════
# API FUNCTIONS — Gemini + YouTube
# ═══════════════════════════════════════════════════════════════
@st.cache_data(show_spinner=False, ttl=3600)
def gemini_chat(note_content, question, key):
    """Ask Gemini a question about the note content."""
    if not key:
        return "No Gemini API key configured."
    try:
        prompt = (
            "You are a helpful note-taking assistant. The user has the following note:\n\n"
            f"{note_content}\n\n"
            f"Answer this question concisely (3-5 sentences max):\n{question}"
        )
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

@st.cache_data(show_spinner=False, ttl=600)
def yt_live_search(query, key, max_results=3):
    """Search YouTube Data API v3 and return video cards."""
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
    """Build a YouTube search query from note title + top keywords."""
    base = title.strip()
    suffix = {"study":"tutorial explained","health":"fitness guide","plan":"tips guide",
              "idea":"startup business","daily":"how to","social":"ideas"}
    # grab a few long words from content as context
    words = re.findall(r'\b[a-zA-Z]{6,}\b', content[:300])
    kw = " ".join(list(dict.fromkeys(words))[:2])  # up to 2 unique keywords
    q = f"{base} {kw} {suffix.get(cat,'')}".strip()
    return q[:80]


# ═══════════════════════════════════════════════════════════════
# SECTION 3: HELPERS + AUTOCOMPLETE + NEXT TOPICS ENGINE
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
LVLS=[{"n":"Novice","min":0,"c":"l-nov","clr":"#bd93f9","bar":"rgba(189,147,249,.3)"},{"n":"Beginner","min":100,"c":"l-beg","clr":"#8be9fd","bar":"rgba(139,233,253,.3)"},{"n":"Intermediate","min":300,"c":"l-int","clr":"#e879a8","bar":"rgba(232,121,168,.4)"},{"n":"Advanced","min":600,"c":"l-adv","clr":"#ffb86c","bar":"rgba(255,184,108,.4)"},{"n":"Expert","min":1000,"c":"l-exp","clr":"#bd93f9","bar":"rgba(189,147,249,.5)"},{"n":"Master","min":1500,"c":"l-mas","clr":"#ff6b8a","bar":"rgba(255,107,138,.5)"}]
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
        {"title":"Add docstring template","desc":"Generate a function docstring with args, returns, examples","snippet":"\n\"\"\"\nDescription:\n\nArgs:\n    param1: description\n\nReturns:\n    description\n\nExample:\n    >>> func()\n\"\"\""},
        {"title":"Add error handling","desc":"Wrap with try/except and logging","snippet":"\ntry:\n    pass\nexcept Exception as e:\n    print(f'Error: {e}')"},
        {"title":"Add type hints template","desc":"Add typed function signature","snippet":"\ndef function_name(param: str, count: int = 0) -> bool:\n    pass"},
    ]},
    "ml":{"triggers":["machine learning","neural","regression","sklearn","pytorch","tensorflow","model"],"suggestions":[
        {"title":"Add model evaluation metrics","desc":"Accuracy, precision, recall, F1, confusion matrix","snippet":"\n\nModel Evaluation:\n- Accuracy: measures overall correctness\n- Precision: true positives / (true positives + false positives)\n- Recall: true positives / (true positives + false negatives)\n- F1 Score: harmonic mean of precision and recall\n- Confusion Matrix: visualize TP, TN, FP, FN"},
        {"title":"Add training pipeline checklist","desc":"Data split, normalization, training loop, validation","snippet":"\n\nTraining Pipeline:\n1. Data preprocessing (normalize, handle missing values)\n2. Train/validation/test split (70/15/15)\n3. Feature engineering\n4. Model selection and hyperparameter tuning\n5. Cross-validation\n6. Evaluate on test set\n7. Deploy and monitor"},
    ]},
    "finance":{"triggers":["npv","irr","wacc","dcf","valuation","cash flow","capital","dividend"],"suggestions":[
        {"title":"Add DCF valuation template","desc":"Step-by-step discounted cash flow framework","snippet":"\n\nDCF Valuation Steps:\n1. Project free cash flows (5-10 years)\n2. Calculate terminal value (Gordon Growth or Exit Multiple)\n3. Determine WACC (cost of equity + cost of debt, weighted)\n4. Discount all cash flows to present value\n5. Sum PV of FCFs + PV of terminal value\n6. Subtract net debt to get equity value\n7. Divide by shares outstanding = price per share"},
        {"title":"Add WACC formula breakdown","desc":"Component-by-component WACC calculation","snippet":"\n\nWACC = (E/V * Re) + (D/V * Rd * (1-T))\nWhere:\n  E = Market value of equity\n  D = Market value of debt\n  V = E + D (total value)\n  Re = Cost of equity (use CAPM)\n  Rd = Cost of debt\n  T = Tax rate"},
    ]},
    "workout":{"triggers":["bench","squat","deadlift","workout","exercise","sets","reps","press"],"suggestions":[
        {"title":"Add progressive overload plan","desc":"Week-by-week weight increase schedule","snippet":"\n\nProgressive Overload Plan:\nWeek 1-2: Current weight, focus on form\nWeek 3-4: +5% weight, maintain reps\nWeek 5-6: +5% weight or +1 rep per set\nWeek 7: Deload week (60% intensity)\nWeek 8: Test new 1RM"},
        {"title":"Add warm-up protocol","desc":"Pre-workout activation routine","snippet":"\n\nWarm-up (10 min):\n- 5 min light cardio\n- Arm circles, leg swings\n- Band pull-aparts 2x15\n- Bodyweight squats 2x10\n- Light set at 50% working weight"},
    ]},
    "trip":{"triggers":["trip","travel","flight","hotel","day 1","itinerary","destination"],"suggestions":[
        {"title":"Add packing checklist","desc":"Essential travel items organized by category","snippet":"\n\nPacking List:\nDocuments: Passport, boarding pass, hotel confirmation, insurance\nClothes: 3 outfits, comfortable shoes, rain jacket\nTech: Phone charger, power bank, adapter\nToiletries: Travel-size essentials\nMisc: Snacks, water bottle, guidebook/app"},
    ]},
}

def get_autocomplete(plain):
    """Return relevant autocomplete suggestions based on note content."""
    cl = plain.lower()
    results = []
    for key, data in AUTOCOMPLETE_DB.items():
        if any(t in cl for t in data["triggers"]):
            for s in data["suggestions"]:
                results.append({**s, "key": key})
    return results[:3]

# --- Next Topics Engine ---
NEXT_TOPICS = {
    "quantum_computing":[
        {"topic":"Quantum Error Correction","desc":"Essential for building practical quantum computers","video":"https://www.youtube.com/results?search_query=quantum+error+correction","target_note":"s1"},
        {"topic":"Quantum Machine Learning","desc":"Intersection of QC and ML — emerging field","video":"https://www.youtube.com/results?search_query=quantum+machine+learning","target_note":"s1"},
    ],
    "machine_learning":[
        {"topic":"Transformers & Attention Mechanism","desc":"Foundation of modern NLP and LLMs","video":"https://www.youtube.com/results?search_query=transformer+attention+mechanism+explained","target_note":"s2"},
        {"topic":"Reinforcement Learning Basics","desc":"Agents, rewards, policies — next frontier","video":"https://www.youtube.com/results?search_query=reinforcement+learning+basics","target_note":"s2"},
        {"topic":"MLOps & Model Deployment","desc":"Taking models from notebook to production","video":"https://www.youtube.com/results?search_query=mlops+model+deployment","target_note":"s2"},
    ],
    "finance":[
        {"topic":"Monte Carlo Simulation for Finance","desc":"Risk analysis and option pricing","video":"https://www.youtube.com/results?search_query=monte+carlo+simulation+finance","target_note":"s3"},
        {"topic":"Leveraged Buyout (LBO) Modeling","desc":"Advanced PE valuation technique","video":"https://www.youtube.com/results?search_query=lbo+model+tutorial","target_note":"s3"},
    ],
}

def get_next_topics(knowledge):
    """Get recommended next topics based on knowledge gaps."""
    results = []
    for topic_key, info in knowledge.items():
        if info["pct"] < 80 and topic_key in NEXT_TOPICS:
            for nt in NEXT_TOPICS[topic_key]:
                results.append({**nt, "subject": info["name"], "current_pct": info["pct"]})
    return results[:5]

def get_sug(cat,content):
    c=content.lower();prefs=st.session_state.preferences.get(cat,{"likes":[],"dislikes":[]})
    DB={"daily_shop":[{"t":"Easy Chicken Stir-Fry","ch":"Quick Kitchen","v":"2.3M","ty":"youtube","url":"https://www.youtube.com/results?search_query=chicken+stir+fry","tags":["quick"]},{"t":"One-Pot Garlic Chicken","ch":"J. Weissman","v":"4.1M","ty":"youtube","url":"https://www.youtube.com/results?search_query=garlic+chicken+rice","tags":["quick","cheap"]},{"t":"Low-Sodium Stir Fry","ch":"Healthy Eats","v":"620K","ty":"youtube","url":"https://www.youtube.com/results?search_query=low+sodium+stir+fry","tags":["low sodium"]}],"daily_task":[{"t":"Get Things Done","ch":"Ali Abdaal","v":"5.1M","ty":"youtube","url":"https://www.youtube.com/results?search_query=productivity","tags":["productivity"]}],"study":[{"t":"Quantum Computing","ch":"Kurzgesagt","v":"12M","ty":"youtube","url":"https://www.youtube.com/results?search_query=quantum+computing","tags":[],"rel":["quantum","qubit"]},{"t":"ML Full Course","ch":"freeCodeCamp","v":"8.3M","ty":"youtube","url":"https://www.youtube.com/results?search_query=machine+learning","tags":[],"rel":["machine learning","neural","regression"]},{"t":"NPV & IRR","ch":"365 Financial","v":"1.2M","ty":"youtube","url":"https://www.youtube.com/results?search_query=npv+irr","tags":["finance"],"rel":["npv","irr","wacc"]},{"t":"PyTorch Quick Start","ch":"Fireship","v":"2.1M","ty":"youtube","url":"https://www.youtube.com/results?search_query=pytorch","tags":["quick"],"rel":["pytorch","tensorflow"]}],"health_w":[{"t":"30-Min PPL","ch":"Jeff Nippard","v":"4.2M","ty":"youtube","url":"https://www.youtube.com/results?search_query=push+pull+legs","tags":["efficient","short"]},{"t":"Shoulder-Safe Push","ch":"Squat Univ","v":"1.9M","ty":"youtube","url":"https://www.youtube.com/results?search_query=shoulder+friendly","tags":["rehab"]}],"health_m":[{"t":"Protein Meal Prep","ch":"R. James","v":"3.4M","ty":"youtube","url":"https://www.youtube.com/results?search_query=protein+meal+prep","tags":["high protein"]}],"plan_t":[{"t":"Barcelona Guide","ch":"Lost LeBlanc","v":"2.1M","ty":"youtube","url":"https://www.youtube.com/results?search_query=barcelona+guide","tags":[]}],"plan_b":[{"t":"50/30/20 Rule","ch":"Two Cents","v":"2.8M","ty":"youtube","url":"https://www.youtube.com/results?search_query=budget+rule","tags":[]}],"idea":[{"t":"Validate Startup","ch":"YC","v":"1.9M","ty":"youtube","url":"https://www.youtube.com/results?search_query=validate+startup","tags":[]},{"t":"Build SaaS MVP","ch":"Fireship","v":"2.3M","ty":"youtube","url":"https://www.youtube.com/results?search_query=saas+mvp","tags":[]}],"social":[{"t":"Gift Ideas 2026","ch":"BuzzFeed","v":"1.2M","ty":"youtube","url":"https://www.youtube.com/results?search_query=gift+ideas","tags":[]}]}
    if cat=="daily":pool=list(DB["daily_shop"] if is_shopping(content) else DB["daily_task"])
    elif cat=="study":
        pool=[s for s in DB["study"] if any(r in c for r in s.get("rel",[]))]
        if not pool:pool=DB["study"][:2]
    elif cat=="health":pool=list(DB["health_m"] if any(w in c for w in ["cal)","calorie","meal"]) else DB["health_w"])
    elif cat=="plan":pool=list(DB["plan_t"] if any(w in c for w in ["trip","flight","hotel","sagrada"]) else DB["plan_b"])
    elif cat=="idea":pool=list(DB["idea"])
    else:pool=list(DB["social"])
    for s in pool:
        sc=0
        for lk in prefs.get("likes",[]):
            if any(lk.lower() in t.lower() for t in s.get("tags",[])):sc+=2
        for dk in prefs.get("dislikes",[]):
            if "too salty"==dk and "low sodium" in " ".join(s.get("tags",[])):sc+=5
            if "too long"==dk and any(t in ["short","efficient"] for t in s.get("tags",[])):sc+=5
        s["_sc"]=sc
    pool.sort(key=lambda x:x.get("_sc",0),reverse=True)
    return pool[:3]

def render_sug(s):
    tcls={"youtube":"tt-yt","article":"tt-art","tutorial":"tt-tut"}.get(s.get("ty","youtube"),"tt-art")
    vw=f" · {s['v']}" if s.get("v") else ""
    if s.get("thumb"):
        thumb_html=f'<img src="{s["thumb"]}" width="54" height="38" style="border-radius:5px;object-fit:cover;flex-shrink:0">'
    else:
        thumb_html=f'<div class="sug-thumb"><span class="tt {tcls}">{s.get("ty","YT").upper()}</span></div>'
    st.markdown(f'<a href="{s["url"]}" target="_blank" style="text-decoration:none"><div class="sug">{thumb_html}<div class="sug-body"><div class="sug-t">{html_mod.escape(s["t"])}</div><div class="sug-m">{html_mod.escape(s["ch"])}{vw}</div></div></div></a>',unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════
# SECTION 4: SIDEBAR — Folders + Notes tree
# ═══════════════════════════════════════════════════════════════
with st.sidebar:
    g_dot=f'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:{"#f0f0f0" if GEMINI_KEY else "rgba(255,255,255,.15)"};margin-right:3px;vertical-align:middle"></span>'
    yt_dot=f'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:{"#f0f0f0" if YOUTUBE_KEY else "rgba(255,255,255,.15)"};margin-right:3px;vertical-align:middle"></span>'
    st.markdown(f'''<div style="padding:.3rem 0 .6rem">
  <div class="mono" style="color:var(--txt);font-size:1.2rem;font-weight:700;letter-spacing:-.3px;line-height:1.1">Notiq</div>
  <div style="font-size:.62rem;color:var(--txt2);margin:.1rem 0 .4rem">AI-powered · Gemini + YouTube</div>
  <div style="display:flex;gap:10px;align-items:center">
    <span>{g_dot}<span style="font-size:.62rem;color:var(--txt2)">Gemini</span></span>
    <span>{yt_dot}<span style="font-size:.62rem;color:var(--txt2)">YouTube</span></span>
  </div></div>''',unsafe_allow_html=True)
    st.markdown("---")
    # Create note
    st.markdown('<p class="sh">New Note</p>',unsafe_allow_html=True)
    nt=st.text_input("t",placeholder="Title...",label_visibility="collapsed",key="nt")
    nf=st.selectbox("folder",list(st.session_state.folders.keys()),format_func=lambda x:st.session_state.folders[x]["name"],label_visibility="collapsed",key="nf")
    if st.button("+ Create",use_container_width=True):
        if nt:
            nid=f"n_{datetime.now().strftime('%H%M%S')}";ck=detect_cat(nt)
            st.session_state.notes[nid]={"title":nt,"cat":ck,"plain":"","created":datetime.now().strftime("%Y-%m-%d %H:%M")}
            st.session_state.folders[nf]["notes"].append(nid)
            st.session_state.active_note=nid;st.session_state.active_folder=nf;st.rerun()
    # Create folder
    st.markdown("---")
    st.markdown('<p class="sh">New Folder</p>',unsafe_allow_html=True)
    nfn=st.text_input("fn",placeholder="Folder name...",label_visibility="collapsed",key="nfn")
    if st.button("+ Folder",use_container_width=True):
        if nfn:
            fid=nfn.lower().replace(" ","_")[:20]
            st.session_state.folders[fid]={"name":nfn,"notes":[]}
            st.session_state.active_folder=fid;st.rerun()
    st.markdown("---")

    # Folder tree
    for fid,folder in st.session_state.folders.items():
        is_active_f = fid==st.session_state.active_folder
        f_clr="color:var(--a1);font-weight:700" if is_active_f else "color:var(--txt3);font-weight:600"
        st.markdown(f'<p style="{f_clr};font-size:.76rem;margin:.7rem 0 .1rem;letter-spacing:.2px;text-transform:uppercase;font-family:\'JetBrains Mono\',monospace">▸ {folder["name"]}</p>',unsafe_allow_html=True)
        for nid in folder["notes"]:
            if nid in st.session_state.notes:
                note=st.session_state.notes[nid]
                is_active_n = nid==st.session_state.active_note
                prefix="▶ " if is_active_n else "    "
                if st.button(f"{prefix}{note['title']}",key=f"sb_{nid}",use_container_width=True):
                    st.session_state.active_note=nid;st.session_state.active_folder=fid


# ═══════════════════════════════════════════════════════════════
# MAIN CONTENT — Top tabs: Notes / Summary / Reviews
# ═══════════════════════════════════════════════════════════════
main_tab=st.tabs(["Notes","Summary","Reviews"])

# ═══════════════════════════════════════════════════════════════
# TAB 1: NOTES
# ═══════════════════════════════════════════════════════════════
with main_tab[0]:
    active=st.session_state.notes.get(st.session_state.active_note)
    if not active:
        st.markdown('<div style="text-align:center;padding:2rem"><h1 class="mono" style="color:var(--txt)">SmartNotes</h1><p style="color:var(--txt2)">Select or create a note.</p></div>',unsafe_allow_html=True)
    else:
        ci=CATS.get(active["cat"],CATS["daily"]);plain=active.get("plain","");cat=active["cat"]
        sugs=get_sug(cat,plain) if plain else []
        autocompletes=get_autocomplete(plain) if plain else []

        # Header
        hc1,hc2=st.columns([8,2])
        with hc1:
            folder_name=""
            for fid,f in st.session_state.folders.items():
                if st.session_state.active_note in f["notes"]:folder_name=f["name"];break
            st.markdown(f'<span style="font-size:.65rem;color:var(--txt2)">{folder_name} / {active["created"]}</span><h2 class="mono" style="color:var(--txt);margin:.05rem 0;font-size:1.2rem">{active["title"]}</h2><span class="tag {ci["tc"]}">{ci["lb"]}</span>',unsafe_allow_html=True)
        with hc2:
            if st.button("Hide AI" if st.session_state.show_ai else "Show AI",key="tai"):
                st.session_state.show_ai=not st.session_state.show_ai;st.rerun()

        if st.session_state.show_ai:
            col_ed,col_ai=st.columns([7,3],gap="medium")
        else:
            col_ed=st.container();col_ai=None

        with col_ed:
            try:
                from streamlit_quill import st_quill
                result=st_quill(value=active.get("content",active.get("plain","")),html=True,toolbar=[[{'header':[1,2,3,False]}],['bold','italic','underline','strike'],[{'list':'ordered'},{'list':'bullet'}],['blockquote','code-block'],['link'],['clean']],key=f"q_{st.session_state.active_note}")
                if result is not None and result!=active.get("content",""):
                    active["content"]=result;active["plain"]=html_mod.unescape(re.sub(r'<[^>]+>','',result))
                    if len(active["plain"])>20:active["cat"]=detect_cat(active["plain"])
            except ImportError:
                updated=st.text_area("c",value=plain,height=350,label_visibility="collapsed",key=f"ed_{st.session_state.active_note}")
                if updated!=plain:active["plain"]=updated;active["content"]=updated
                if len(active.get("plain",""))>20:active["cat"]=detect_cat(active["plain"])

            # Smart autocomplete suggestions INSIDE the editor area
            if autocompletes:
                st.markdown('<p class="sh2" style="margin-top:.5rem">Smart Suggestions</p>',unsafe_allow_html=True)
                for i,ac in enumerate(autocompletes):
                    with st.expander(f"{ac['title']}"):
                        st.markdown(f'<p style="color:var(--txt3);font-size:.78rem">{ac["desc"]}</p>',unsafe_allow_html=True)
                        st.code(ac["snippet"],language=None)
                        if st.button(f"Add to note",key=f"ac_{i}_{st.session_state.active_note}"):
                            active["plain"]+=ac["snippet"]
                            active["content"]=active["plain"]
                            st.rerun()

            bc1,bc2,bc3=st.columns(3)
            with bc1:
                ncs=st.selectbox("cat",[v["lb"] for v in CATS.values()],index=list(CATS.keys()).index(active["cat"]),label_visibility="collapsed",key="cc")
                for k,v in CATS.items():
                    if v["lb"]==ncs:active["cat"]=k;break
            with bc2:
                if st.button("Refresh"):st.rerun()
            with bc3:
                if st.button("Delete"):
                    if len(st.session_state.notes)>1:
                        nid=st.session_state.active_note
                        for f in st.session_state.folders.values():
                            if nid in f["notes"]:f["notes"].remove(nid)
                        del st.session_state.notes[nid]
                        st.session_state.active_note=list(st.session_state.notes.keys())[0];st.rerun()

        # AI Panel
        if col_ai is not None:
            with col_ai:
                # Live YouTube or static fallback
                if YOUTUBE_KEY and plain:
                    yt_q = build_yt_query(active.get("title",""), plain, cat)
                    live_vids = yt_live_search(yt_q, YOUTUBE_KEY)
                else:
                    live_vids = []
                shown = live_vids if live_vids else sugs
                lbl_extra = '<span style="font-size:.55rem;color:var(--cyan);margin-left:4px">● LIVE</span>' if live_vids else ""
                st.markdown(f'<p class="sh">Suggestions{lbl_extra}</p>',unsafe_allow_html=True)
                if shown:
                    for s in shown: render_sug(s)
                else:
                    st.markdown('<p style="color:var(--txt2);font-size:.76rem">Type to get suggestions.</p>',unsafe_allow_html=True)
                st.markdown('<p class="sh2" style="margin-top:.5rem">Analysis</p>',unsafe_allow_html=True)
                if not plain:
                    st.markdown('<p style="color:var(--txt2);font-size:.76rem">Start writing for analysis.</p>',unsafe_allow_html=True)
                else:
                    if cat=="daily":
                        if is_shopping(plain):
                            st.markdown('<div class="cg"><p class="sh">Shopping List</p><p style="color:var(--txt3);font-size:.76rem">Recipes matched from ingredients.</p></div>',unsafe_allow_html=True)
                        else:
                            p=parse_tasks(plain)
                            if p["tasks"]:
                                st.markdown(f'<div class="cg"><p class="sh">Tasks</p><p style="color:var(--txt3)"><span class="mono" style="color:var(--a1)">{p["done"]}/{p["total"]}</span> done</p></div>',unsafe_allow_html=True)
                    if cat=="study":
                        know=calc_knowledge()
                        rel={k:v for k,v in know.items() if any(w in plain.lower() for w in k.replace("_"," ").split())}
                        if not rel:rel=know
                        st.markdown('<div class="cg"><p class="sh">Knowledge</p>',unsafe_allow_html=True)
                        for k,info in rel.items():
                            lv=info["lvl"]
                            st.markdown(f'<div style="margin-bottom:.4rem"><div style="display:flex;justify-content:space-between"><span style="color:var(--txt);font-size:.78rem;font-weight:600">{info["name"]}</span><span class="lvl {lv["c"]}">{lv["n"]}</span></div><div class="pbb"><div class="pb" style="width:{info["pct"]}%;background:linear-gradient(90deg,{lv["bar"]},{lv["clr"]})"></div></div></div>',unsafe_allow_html=True)
                        st.markdown('</div>',unsafe_allow_html=True)
                        dls=re.findall(r'(?:due|deadline|exam)[:\s]*(\w+\s+\d{1,2})',plain,re.I)
                        if dls:
                            st.markdown('<div class="cw"><p class="sh3">Deadlines</p>',unsafe_allow_html=True)
                            for d in dls:st.markdown(f'<p style="color:var(--amber);font-size:.78rem">{d}</p>',unsafe_allow_html=True)
                            st.markdown('</div>',unsafe_allow_html=True)
                    if cat=="health":
                        cd=parse_cals(plain)
                        if cd:
                            avg=sum(d["cal"] for d in cd.values())//len(cd)
                            st.markdown(f'<div class="cg"><p class="sh">Meals</p><p style="color:var(--txt3)"><span class="mono" style="color:var(--a1)">{avg}</span> avg cal/day</p></div>',unsafe_allow_html=True)
                        else:
                            exs=[w for w in ["bench","squat","deadlift","press","curl","row","pull-up","lunge","plank"] if w in plain.lower()]
                            if exs:
                                st.markdown(f'<div class="cg"><p class="sh">Workout</p><p style="color:var(--txt3)">{len(exs)} exercises</p></div>',unsafe_allow_html=True)
                    if cat=="plan":
                        bg=parse_budget(plain)
                        if bg["income"]>0:
                            rem=bg["income"]-bg["total"]
                            st.markdown(f'<div class="cg"><p class="sh">Budget</p><p style="color:var(--txt3);font-size:.78rem">In: {bg["income"]} / Out: {bg["total"]} / Left: {rem}</p></div>',unsafe_allow_html=True)
                    if cat=="idea":
                        sc=score_idea(plain)
                        st.markdown(f'<div class="cg"><p class="sh">Score: <span style="color:var(--a1)">{sc["overall"]}/10</span></p></div>',unsafe_allow_html=True)
                    if cat=="social":
                        evts=parse_events(plain)
                        if evts:
                            st.markdown('<div class="cg"><p class="sh">Events</p>',unsafe_allow_html=True)
                            for ev in evts[:4]:
                                badge=f'<span class="pri pri-u">{ev["days"]}d</span>' if 0<=ev["days"]<=7 else f'<span class="pri pri-h">{ev["days"]}d</span>' if 0<=ev["days"]<=30 else f'<span class="pri pri-n">{ev["days"]}d</span>' if ev["days"]>0 else '<span class="pri pri-l">past</span>'
                                st.markdown(f'<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="color:var(--txt);font-size:.76rem">{ev["name"]}</span>{badge}</div>',unsafe_allow_html=True)
                            st.markdown('</div>',unsafe_allow_html=True)

                # ── AI Chatbot ──────────────────────────────────────
                st.markdown('<p class="sh" style="margin-top:.85rem">Ask AI</p>',unsafe_allow_html=True)
                ai_q=st.text_input("q",placeholder="Ask anything about this note…",label_visibility="collapsed",key=f"ai_q_{st.session_state.active_note}")
                ask_c,clr_c=st.columns(2)
                with ask_c:
                    if st.button("Ask Gemini",key="btn_ask_ai",use_container_width=True):
                        if ai_q and plain:
                            with st.spinner("Thinking…"):
                                st.session_state.ai_response=gemini_chat(plain[:3000],ai_q,GEMINI_KEY)
                                st.session_state.ai_note_id=st.session_state.active_note
                        elif not plain:
                            st.session_state.ai_response="Write something in the note first."
                with clr_c:
                    if st.button("Clear",key="btn_clr_ai",use_container_width=True):
                        st.session_state.ai_response=""
                if st.session_state.ai_response:
                    safe_resp=html_mod.escape(st.session_state.ai_response)
                    st.markdown(f'<div class="cg"><p class="sh2">AI Answer</p><p style="color:var(--txt3);font-size:.78rem;line-height:1.55;white-space:pre-wrap">{safe_resp}</p></div>',unsafe_allow_html=True)
                    if st.button("+ Add to Note",key="btn_copy_ai",use_container_width=True):
                        nid=st.session_state.ai_note_id or st.session_state.active_note
                        if nid in st.session_state.notes:
                            st.session_state.notes[nid]["plain"]+=f"\n\n**AI:** {st.session_state.ai_response}"
                            st.session_state.notes[nid]["content"]=st.session_state.notes[nid]["plain"]
                        st.session_state.ai_response=""
                        st.rerun()


# ═══════════════════════════════════════════════════════════════
# TAB 2: SUMMARY + NEXT TOPICS
# ═══════════════════════════════════════════════════════════════
with main_tab[1]:
    st.markdown('<h2 class="mono" style="color:var(--txt);font-size:1.15rem">Summary Dashboard</h2>',unsafe_allow_html=True)
    stabs=st.tabs([v["lb"] for v in CATS.values()])
    def nfor(cat):return[n for n in st.session_state.notes.values() if n["cat"]==cat]

    # Daily
    with stabs[0]:
        dn=nfor("daily");at=[]
        for n in dn:at.extend(parse_tasks(n["plain"])["tasks"])
        done=sum(1 for t in at if t["done"]);total=len(at);pct=int(done/total*100) if total else 0
        st.markdown(f'<div class="sts"><div class="st"><div class="st-n">{done}/{total}</div><div class="st-l">Done</div></div><div class="st"><div class="st-n">{pct}%</div><div class="st-l">Rate</div></div></div>',unsafe_allow_html=True)

    # Study + Next Topics
    with stabs[1]:
        know=calc_knowledge()
        c1,c2=st.columns([2,1])
        with c1:
            try:
                import plotly.graph_objects as go
                names=[t["name"] for t in know.values()];pcts=[t["pct"] for t in know.values()]
                fig=go.Figure(go.Scatterpolar(r=pcts+[pcts[0]],theta=names+[names[0]],fill='toself',line=dict(color='#e879a8'),fillcolor='rgba(232,121,168,.12)'))
                fig.update_layout(polar=dict(bgcolor="rgba(26,10,30,.5)",radialaxis=dict(visible=True,range=[0,100],gridcolor="rgba(255,255,255,.08)"),angularaxis=dict(gridcolor="rgba(255,255,255,.08)",tickfont=dict(color="#f0e6f6",size=11))),paper_bgcolor="#1a0a1e",font=dict(color="#f0e6f6"),margin=dict(t=25,b=25,l=55,r=55),height=300)
                st.plotly_chart(fig,use_container_width=True)
            except ImportError:pass
            for k,info in know.items():
                lv=info["lvl"]
                st.markdown(f'<div class="cd"><div style="display:flex;justify-content:space-between"><span style="color:var(--txt);font-weight:600;font-size:.82rem">{info["name"]}</span><span class="lvl {lv["c"]}">{lv["n"]}</span></div><div class="pbb"><div class="pb" style="width:{info["pct"]}%;background:linear-gradient(90deg,{lv["bar"]},{lv["clr"]})"></div></div></div>',unsafe_allow_html=True)

        with c2:
            # NEXT TOPICS — the new feature
            st.markdown('<p class="sh" style="margin-bottom:.4rem">Recommended Next Topics</p>',unsafe_allow_html=True)
            st.markdown('<p style="color:var(--txt2);font-size:.7rem;margin-bottom:.4rem">Click to add a topic to your notes with a linked resource.</p>',unsafe_allow_html=True)
            next_topics=get_next_topics(know)
            for i,nt in enumerate(next_topics):
                st.markdown(f'<div class="nt"><div><div style="font-size:.78rem;font-weight:600;color:var(--txt)">{nt["topic"]}</div><div style="font-size:.65rem;color:var(--txt2)">{nt["subject"]} ({nt["current_pct"]}%) — {nt["desc"]}</div></div></div>',unsafe_allow_html=True)
                bc1_nt,bc2_nt=st.columns([1,1])
                with bc1_nt:
                    if st.button(f"Add to notes",key=f"nt_{i}"):
                        target=nt.get("target_note","s1")
                        if target in st.session_state.notes:
                            n=st.session_state.notes[target]
                            snippet=f"\n\n--- AI Suggested Topic ---\n{nt['topic']}: {nt['desc']}\nResource: {nt['video']}"
                            n["plain"]+=snippet;n["content"]=n["plain"]
                            st.success(f"Added '{nt['topic']}' to {n['title']}");st.rerun()
                with bc2_nt:
                    st.markdown(f'<a href="{nt["video"]}" target="_blank" style="text-decoration:none;font-size:.7rem;color:var(--a2)">Watch video</a>',unsafe_allow_html=True)

    # Health
    with stabs[2]:
        hn=nfor("health");acd={}
        for n in hn:acd.update(parse_cals(n["plain"]))
        if acd:
            try:
                import plotly.graph_objects as go
                do=["Monday","Tuesday","Wednesday","Thursday","Friday"]
                sd=[d for d in do if d in acd];cv=[acd[d]["cal"] for d in sd]
                cls=["#e879a8" if c<2000 else "#ffb86c" if c<2500 else "#ff6b8a" for c in cv]
                fig=go.Figure(go.Bar(x=sd,y=cv,marker_color=cls,text=cv,textposition="outside",textfont=dict(color="#f0e6f6")))
                fig.update_layout(paper_bgcolor="#1a0a1e",plot_bgcolor="rgba(26,10,30,.5)",font=dict(color="#f0e6f6"),margin=dict(t=25,b=25),height=250)
                st.plotly_chart(fig,use_container_width=True)
            except ImportError:pass

    # Planning
    with stabs[3]:
        pn=nfor("plan")
        for n in pn:
            bg=parse_budget(n["plain"])
            if bg["income"]>0:
                try:
                    import plotly.graph_objects as go
                    fig=go.Figure(go.Pie(labels=list(bg["expenses"].keys()),values=list(bg["expenses"].values()),marker=dict(colors=["#e879a8","#c27bf0","#ffb86c","#ff79c6","#bd93f9","#67e8f9","#f0935a"]),hole=.4))
                    fig.update_layout(paper_bgcolor="#1a0a1e",font=dict(color="#f0e6f6"),margin=dict(t=15,b=15),height=260)
                    st.plotly_chart(fig,use_container_width=True)
                except ImportError:pass
                break

    # Ideas
    with stabs[4]:
        idn=nfor("idea")
        scored=sorted([{"title":n["title"],**score_idea(n["plain"])} for n in idn],key=lambda x:x["overall"],reverse=True)
        for i,idea in enumerate(scored):
            st.markdown(f'<div class="cd"><div style="display:flex;justify-content:space-between"><span style="color:var(--txt);font-weight:600">#{i+1} {idea["title"]}</span><span class="mono" style="color:var(--a1)">{idea["overall"]}/10</span></div></div>',unsafe_allow_html=True)

    # Social
    with stabs[5]:
        sn2=nfor("social");amoods=[]
        for n in sn2:amoods.extend(parse_moods(n["plain"]))
        if amoods:
            try:
                import plotly.graph_objects as go
                MC={1:"#ff6b8a",2:"#ffb86c",3:"#bd93f9",4:"#e879a8",5:"#67e8f9"}
                fig=go.Figure(go.Scatter(x=[m["day"] for m in amoods],y=[m["mood"] for m in amoods],mode='lines+markers',line=dict(color="#67e8f9",width=3),marker=dict(size=10,color=[MC.get(s["mood"],"#bd93f9") for s in amoods]),fill='tozeroy',fillcolor='rgba(103,232,249,.06)'))
                fig.update_layout(paper_bgcolor="#1a0a1e",plot_bgcolor="rgba(26,10,30,.5)",font=dict(color="#f0e6f6"),yaxis=dict(range=[0,6],dtick=1),margin=dict(t=15,b=25),height=240)
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
            st.markdown(f'<div class="cw"><div style="display:flex;justify-content:space-between"><div><span class="tag {ci["tc"]}">{ci["lb"]}</span><div style="color:var(--txt);font-weight:600;margin-top:2px">{rev["item"]}</div></div><span class="mono" style="color:var(--a1)">{rev["rating"]}/5</span></div><div style="margin-top:3px">{lh}{dh}</div></div>',unsafe_allow_html=True)
    with r2:
        st.markdown('<div class="cg"><p class="sh">Learned Preferences</p></div>',unsafe_allow_html=True)
        for ck,prefs in st.session_state.preferences.items():
            ci=CATS.get(ck,CATS["daily"]);lh=" ".join(f'<span class="pref pref-y">{l}</span>' for l in prefs.get("likes",[]));dh=" ".join(f'<span class="pref pref-n">{d}</span>' for d in prefs.get("dislikes",[]))
            if lh or dh:st.markdown(f'<div class="cd"><span class="tag {ci["tc"]}">{ci["lb"]}</span><div style="margin-top:3px">{lh}</div><div>{dh}</div></div>',unsafe_allow_html=True)