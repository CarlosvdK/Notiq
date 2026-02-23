// ══════════════════════════════════════════════════════════════
// NOTIQ v4 — AI Notes · Gemini · YouTube · Files · Sub-notes
// ══════════════════════════════════════════════════════════════
//
// ┌───────────────────────────────────────────────────────────┐
// │  PASTE YOUR API KEYS HERE (line 10-11)                   │
// └───────────────────────────────────────────────────────────┘
const GEMINI_KEY = "AIzaSyC1ECDxN4bZbKlt1UmhRgrjEF1-5UNoJuw";    // ← Gemini key from aistudio.google.com/apikey
const YOUTUBE_KEY = "AIzaSyB1ik2Qn1sDsEg1D3ZAesGvf6jsFqS0oGk";   // ← YouTube Data API v3 key
//
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ══════════════════════════════════════════════════════════════
// SECTION 1: THEME
// ══════════════════════════════════════════════════════════════
// Dark: near-black bg, white/grey text + accents
const DARK_CSS=`
  --t-bg:#0a0a0a;--t-bg2:#111;--t-bg3:#1a1a1a;
  --t-glass:rgba(255,255,255,.05);--t-glassH:rgba(255,255,255,.09);--t-border:rgba(255,255,255,.1);
  --t-a1:#f0f0f0;--t-a2:#999;--t-a3:#666;
  --t-txt:#f5f5f5;--t-txt2:rgba(245,245,245,.4);--t-txt3:rgba(245,245,245,.62);
  --t-red:#ff5c5c;--t-amber:#c9912a;--t-blue:#7abfea;--t-purple:#b8b8b8;--t-cyan:#6ec8c8;--t-pink:#d0d0d0;
  --t-grad:linear-gradient(135deg,#e0e0e0,#aaa);
  --t-btn:linear-gradient(135deg,#2d2d2d,#444);
  --t-btn-txt:#f0f0f0;
  --t-sidebar:linear-gradient(180deg,#050505,#0a0a0a,#070707);
  --t-tab-active:rgba(255,255,255,.08);
  --t-note-active:rgba(255,255,255,.07);
  --t-glass-accent:rgba(255,255,255,.04);
  --t-panel:rgba(255,255,255,.016);
  --t-pbar:rgba(255,255,255,.06);
  --t-dot-off:rgba(255,255,255,.15);
  --t-topbar:rgba(255,255,255,.02);
`;
// Light: white bg, dark-navy text, dark-blue gradient accents
const LIGHT_CSS=`
  --t-bg:#ffffff;--t-bg2:#f8fafc;--t-bg3:#f1f5f9;
  --t-glass:rgba(0,0,0,.04);--t-glassH:rgba(0,0,0,.07);--t-border:rgba(0,0,0,.09);
  --t-a1:#1e3a8a;--t-a2:#2563eb;--t-a3:#3b82f6;
  --t-txt:#0f172a;--t-txt2:rgba(15,23,42,.45);--t-txt3:rgba(15,23,42,.65);
  --t-red:#dc2626;--t-amber:#d97706;--t-blue:#1d4ed8;--t-purple:#4338ca;--t-cyan:#0891b2;--t-pink:#9333ea;
  --t-grad:linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6);
  --t-btn:linear-gradient(135deg,#1e3a8a,#2563eb);
  --t-btn-txt:#ffffff;
  --t-sidebar:linear-gradient(180deg,#f8fafc,#f1f5f9,#e2e8f0);
  --t-tab-active:rgba(30,58,138,.12);
  --t-note-active:rgba(30,58,138,.08);
  --t-glass-accent:rgba(30,58,138,.05);
  --t-panel:rgba(0,0,0,.02);
  --t-pbar:rgba(0,0,0,.06);
  --t-dot-off:rgba(0,0,0,.15);
  --t-topbar:rgba(0,0,0,.02);
`;
const T={bg:"var(--t-bg)",bg2:"var(--t-bg2)",bg3:"var(--t-bg3)",glass:"var(--t-glass)",glassH:"var(--t-glassH)",border:"var(--t-border)",a1:"var(--t-a1)",a2:"var(--t-a2)",a3:"var(--t-a3)",txt:"var(--t-txt)",txt2:"var(--t-txt2)",txt3:"var(--t-txt3)",red:"var(--t-red)",amber:"var(--t-amber)",blue:"var(--t-blue)",purple:"var(--t-purple)",cyan:"var(--t-cyan)",pink:"var(--t-pink)",grad:"var(--t-grad)"};
const CM = {
  daily:{lb:"Daily Tasks",color:T.a1,bg:"rgba(232,121,168,.1)"},study:{lb:"Work / Study",color:T.blue,bg:"rgba(139,233,253,.1)"},
  health:{lb:"Health & Fitness",color:T.pink,bg:"rgba(255,121,198,.1)"},plan:{lb:"Planning & Finance",color:T.amber,bg:"rgba(255,184,108,.1)"},
  idea:{lb:"Ideas & Creativity",color:T.blue,bg:"rgba(122,191,234,.1)"},social:{lb:"Social & Memories",color:T.cyan,bg:"rgba(103,232,249,.1)"},
};

// ══════════════════════════════════════════════════════════════
// SECTION 2: DATA — with sub-notes (children/parent)
// ══════════════════════════════════════════════════════════════
const INIT_FOLDERS = [
  {id:"mban",name:"MBAn Term 2",notes:["s1","s2","s3"]},{id:"personal",name:"Personal",notes:["d1","d2","h1","h2"]},
  {id:"projects",name:"Projects & Ideas",notes:["i1","i2"]},{id:"planning",name:"Planning",notes:["p1","p2"]},{id:"social",name:"Social",notes:["x1","x2"]},
];
const INIT_NOTES = {
  s2:{title:"Machine Learning",cat:"study",created:"2026-02-15",children:["s2a","s2b","s2c"],content:""},
  s2a:{title:"Lesson 1: Supervised",cat:"study",created:"2026-02-15",parent:"s2",content:"<h2>Supervised Learning</h2><ul><li>Linear regression, Logistic regression</li><li>Decision trees, Random forests, SVM</li></ul><p><strong>Key:</strong> model learns from labeled data.</p>"},
  s2b:{title:"Lesson 2: Unsupervised",cat:"study",created:"2026-02-16",parent:"s2",content:"<h2>Unsupervised Learning</h2><ul><li>K-means clustering</li><li>PCA dimensionality reduction</li><li>DBSCAN</li></ul><p>No labels — finds structure.</p>"},
  s2c:{title:"Lesson 3: Deep Learning",cat:"study",created:"2026-02-17",parent:"s2",content:"<h2>Deep Learning</h2><ul><li>Neural network architecture</li><li>Backpropagation &amp; gradient descent</li><li>Activation functions (ReLU, sigmoid, tanh)</li></ul><p>Libraries: scikit-learn, TensorFlow, PyTorch</p><p><strong>Due: Feb 28</strong> — CNN assignment</p>"},
  s1:{title:"Quantum Computing",cat:"study",created:"2026-02-14",children:["s1a","s1b"],content:""},
  s1a:{title:"Lesson 1: Fundamentals",cat:"study",created:"2026-02-14",parent:"s1",content:"<h2>Qubits vs Classical Bits</h2><p>Superposition allows qubits to be in multiple states.</p><ul><li><strong>Quantum entanglement</strong></li><li><strong>Gates:</strong> Hadamard, CNOT, Pauli</li><li><strong>Decoherence</strong></li></ul>"},
  s1b:{title:"Lesson 2: Algorithms",cat:"study",created:"2026-02-15",parent:"s1",content:"<h2>Quantum Algorithms</h2><ul><li><strong>Shor's</strong> — factoring</li><li><strong>Grover's</strong> — search</li></ul><p><em>Review:</em> Bloch sphere, density matrices.</p>"},
  s3:{title:"Corporate Finance",cat:"study",created:"2026-02-16",children:["s3a"],content:""},
  s3a:{title:"Lesson 1: Valuation",cat:"study",created:"2026-02-16",parent:"s3",content:"<h2>Valuation — Week 5</h2><ul><li>NPV and IRR</li><li>WACC</li><li>Modigliani-Miller</li><li>Dividend policy</li></ul><p><strong>Exam: Mar 15</strong></p>"},
  d1:{title:"Weekly Errands",cat:"daily",created:"2026-02-15",content:"<ul><li><s>Buy groceries</s></li><li>Call mom</li><li><s>Pay electricity</s></li><li>Pick up dry cleaning</li><li>Email professor</li><li><s>Book dentist</s></li></ul>"},
  d2:{title:"Grocery Shopping",cat:"daily",created:"2026-02-16",content:"<p>Chicken breast</p><p>Onions, Bell peppers, Garlic</p><p>Soy sauce, Rice, Broccoli, Ginger, Sesame oil</p>"},
  h1:{title:"Weekly Workout",cat:"health",created:"2026-02-12",content:"<table><tr><th>Day</th><th>Focus</th><th>Exercises</th></tr><tr><td>Mon</td><td>Upper</td><td>Bench 4x8, Rows 4x10, OHP 3x8</td></tr><tr><td>Tue</td><td>Lower</td><td>Squats 5x5, Deadlifts 3x5, Lunges 3x10</td></tr><tr><td>Wed</td><td>Rest</td><td>30 min walk</td></tr><tr><td>Thu</td><td>Push</td><td>Chest press, Shoulder press, Dips</td></tr><tr><td>Fri</td><td>Pull</td><td>Pull-ups, Rows, Face pulls</td></tr></table>"},
  h2:{title:"Meal Log",cat:"health",created:"2026-02-14",content:"<p><strong>Monday:</strong> Oatmeal (350cal), Chicken salad (450cal), Pasta (600cal), Shake (200cal)</p><p><strong>Tuesday:</strong> Eggs (400cal), Rice bowl (550cal), Stir fry (500cal), Yogurt (150cal)</p><p><strong>Wednesday:</strong> Smoothie (300cal), Sandwich (450cal), Salmon (650cal), Fruit (100cal)</p><p><strong>Thursday:</strong> Pancakes (500cal), Burrito (600cal), Chicken (550cal)</p><p><strong>Friday:</strong> Granola (350cal), Sushi (500cal), Pizza (700cal), Ice cream (250cal)</p>"},
  p1:{title:"Barcelona Trip",cat:"plan",created:"2026-02-10",content:"<h2>Barcelona 4-Day Itinerary</h2><p><strong>Day 1:</strong> Sagrada Familia, Park Guell</p><p><strong>Day 2:</strong> Gothic Quarter, La Rambla, Beach</p><p><strong>Day 3:</strong> Camp Nou, Montjuic</p><p><strong>Day 4:</strong> La Boqueria, El Born, Picasso Museum</p><p>Budget: 800 / Hotel Jazz</p>"},
  p2:{title:"February Budget",cat:"plan",created:"2026-02-01",content:'<h3>Income: 2500</h3><table><tr><th>Category</th><th>Amount</th></tr><tr><td>Rent</td><td>800</td></tr><tr><td>Groceries</td><td>300</td></tr><tr><td>Transport</td><td>80</td></tr><tr><td>Subscriptions</td><td>45</td></tr><tr><td>Dining out</td><td>150</td></tr><tr><td>Clothing</td><td>100</td></tr><tr><td>Savings</td><td>500</td></tr><tr><td>Misc</td><td>200</td></tr></table><p><em>Goal: Save 500/month</em></p>'},
  i1:{title:"Restaurant Analytics SaaS",cat:"idea",created:"2026-02-08",content:"<h2>Problem</h2><p>Small restaurants lack analytics</p><h2>Solution</h2><p>Dashboard for POS</p><ul><li>Revenue forecasting</li><li>Menu performance</li><li>Peak hours</li></ul><p>Market: 500K+ EU restaurants at 49/month</p>"},
  i2:{title:"YouTube Content Ideas",cat:"idea",created:"2026-02-13",content:"<ol><li>Day in life at ESADE</li><li>Built a SaaS</li><li>Study with me</li><li>Barcelona budget</li></ol>"},
  x1:{title:"Birthdays & Gifts",cat:"social",created:"2026-02-11",content:"<table><tr><th>Person</th><th>Date</th><th>Idea</th></tr><tr><td>Mom</td><td>Mar 12</td><td>Garden tools</td></tr><tr><td>Carlos</td><td>Apr 3</td><td>PS5 controller</td></tr><tr><td>Sarah</td><td>Feb 28</td><td>Cookbook</td></tr></table>"},
  x2:{title:"Journal — Feb Wk2",cat:"social",created:"2026-02-16",content:"<p><strong>Mon:</strong> Aced finance quiz — confident</p><p><strong>Tue:</strong> Stressed ML</p><p><strong>Wed:</strong> Coffee Sarah, better</p><p><strong>Thu:</strong> Gym PR — happy</p><p><strong>Fri:</strong> Out with Carlos, tired</p><p><strong>Sat:</strong> Movies, content</p><p><strong>Sun:</strong> Planned week, motivated</p>"},
};
const INIT_REVIEWS = [{cat:"health",item:"Chicken Stir-Fry",rating:4,likes:["quick","high protein"],dislikes:["too salty"],date:"2026-02-10"},{cat:"health",item:"Leg Day",rating:5,likes:["strength gains"],dislikes:[],date:"2026-02-14"}];


// ══════════════════════════════════════════════════════════════
// SECTION 3: AI ENGINES (Gemini + YouTube + fallbacks)
// ══════════════════════════════════════════════════════════════
async function geminiComplete(ctx,key){if(!key)return null;try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"You are a copilot for note-taking. Suggest a concise continuation (4-8 lines). Only output the completion.\n\nNotes:\n"+ctx+"\n\nCompletion:"}]}],generationConfig:{maxOutputTokens:300,temperature:0.7}})});const d=await r.json();return d?.candidates?.[0]?.content?.parts?.[0]?.text||null;}catch(e){return null;}}
async function geminiAnalyze(content,q,key){if(!key)return null;try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"Notes:\n"+content.replace(/<[^>]+>/g,"")+"\n\n"+q+"\nBe concise (3-5 sentences)."}]}],generationConfig:{maxOutputTokens:200,temperature:0.5}})});const d=await r.json();return d?.candidates?.[0]?.content?.parts?.[0]?.text||null;}catch(e){return null;}}
async function ytSearch(query,key,max=3){if(!key)return[];try{const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${max}&key=${key}`);const d=await r.json();if(!d.items)return[];return d.items.map(i=>({t:i.snippet.title,ch:i.snippet.channelTitle,thumb:i.snippet.thumbnails?.medium?.url||"",url:`https://www.youtube.com/watch?v=${i.id.videoId}`,ty:"youtube"}));}catch(e){return[];}}

const GHOST_DB = [
  // ML concepts
  {trigger:"random forest",ghost:"Random Forest is an ensemble method that builds multiple decision trees and merges their predictions.\n\nHow it works:\n  1. Bootstrap sampling — create N random subsets of training data\n  2. Build a decision tree on each subset (with random feature selection)\n  3. Aggregate predictions — majority vote (classification) or average (regression)\n\nKey hyperparameters:\n  - n_estimators: number of trees (100-500 typical)\n  - max_depth: tree depth limit\n  - min_samples_split: minimum samples to split a node\n  - max_features: sqrt(n) for classification, n/3 for regression\n\nAdvantages: handles non-linearity, resistant to overfitting, feature importance ranking\nLimitations: slow inference on large forests, less interpretable than single trees",
    video:{t:"Random Forest Clearly Explained",ch:"StatQuest",v:"4.8M",url:"https://www.youtube.com/results?search_query=random+forest+statquest"}},
  {trigger:"linear regression",ghost:"Linear Regression models the relationship Y = β₀ + β₁X₁ + β₂X₂ + ... + ε\n\nAssumptions:\n  1. Linearity — relationship between X and Y is linear\n  2. Independence — observations are independent\n  3. Homoscedasticity — constant variance of residuals\n  4. Normality — residuals are normally distributed\n\nCost function: MSE = (1/n) Σ(yᵢ - ŷᵢ)²\nOptimization: Ordinary Least Squares (OLS) or Gradient Descent\n\nR² score: proportion of variance explained (0 to 1)\nAdjusted R²: penalizes adding irrelevant features",
    video:{t:"Linear Regression Explained",ch:"StatQuest",v:"3.2M",url:"https://www.youtube.com/results?search_query=linear+regression+statquest"}},
  {trigger:"gradient descent",ghost:"Gradient Descent iteratively minimizes a loss function by moving in the direction of steepest descent.\n\nUpdate rule: θ = θ - α · ∂L/∂θ\n  where α = learning rate, L = loss function\n\nVariants:\n  - Batch GD: uses entire dataset per step (stable but slow)\n  - Stochastic GD: one sample per step (noisy but fast)\n  - Mini-batch GD: compromise (32-256 samples per step)\n\nAdvanced optimizers:\n  - Adam: adaptive learning rates + momentum\n  - RMSprop: running average of squared gradients\n  - AdaGrad: per-parameter learning rates\n\nLearning rate too high → diverges | too low → stuck in local minimum",
    video:{t:"Gradient Descent Step-by-Step",ch:"3Blue1Brown",v:"7.1M",url:"https://www.youtube.com/results?search_query=gradient+descent+3blue1brown"}},
  {trigger:"neural network",ghost:"Neural Network Architecture:\n\n  Input Layer → Hidden Layers → Output Layer\n\nEach neuron computes: output = activation(Σ(wᵢ · xᵢ) + bias)\n\nCommon activation functions:\n  - ReLU: max(0, x) — default for hidden layers\n  - Sigmoid: 1/(1+e⁻ˣ) — output layer for binary classification\n  - Softmax: e^xᵢ/Σe^xⱼ — output for multi-class\n  - Tanh: (eˣ-e⁻ˣ)/(eˣ+e⁻ˣ) — centered version of sigmoid\n\nTraining: forward pass → compute loss → backpropagation → update weights\nRegularization: dropout, L2 weight decay, batch normalization",
    video:{t:"Neural Networks from Scratch",ch:"3Blue1Brown",v:"14M",url:"https://www.youtube.com/results?search_query=neural+networks+3blue1brown"}},
  {trigger:"backpropagation",ghost:"Backpropagation computes gradients of the loss w.r.t. each weight using the chain rule.\n\nSteps:\n  1. Forward pass: compute predictions layer by layer\n  2. Compute loss at output (e.g. cross-entropy, MSE)\n  3. Backward pass: propagate gradients from output to input\n  4. Update weights: w = w - lr × ∂L/∂w\n\nChain rule example for 2-layer network:\n  ∂L/∂w₁ = ∂L/∂a₂ · ∂a₂/∂z₂ · ∂z₂/∂a₁ · ∂a₁/∂z₁ · ∂z₁/∂w₁\n\nVanishing gradient problem: deep networks with sigmoid/tanh\nSolution: ReLU activation, residual connections, proper initialization",
    video:{t:"Backpropagation Calculus",ch:"3Blue1Brown",v:"6.5M",url:"https://www.youtube.com/results?search_query=backpropagation+3blue1brown"}},
  {trigger:"k-means",ghost:"K-Means Clustering Algorithm:\n\n  1. Choose K (number of clusters)\n  2. Initialize K centroids randomly\n  3. Assign each point to nearest centroid\n  4. Recompute centroids as mean of assigned points\n  5. Repeat steps 3-4 until convergence\n\nChoosing K: Elbow method — plot inertia vs K, look for the \"elbow\"\nInertia = Σ ||xᵢ - μ_cluster||²\n\nLimitations:\n  - Assumes spherical clusters of equal size\n  - Sensitive to initialization (use k-means++)\n  - Must specify K in advance\n\nAlternatives: DBSCAN (density-based), hierarchical clustering, Gaussian Mixture Models",
    video:{t:"K-Means Clustering Explained",ch:"StatQuest",v:"2.1M",url:"https://www.youtube.com/results?search_query=kmeans+clustering+statquest"}},
  {trigger:"decision tree",ghost:"Decision Tree splits data recursively based on feature thresholds.\n\nSplitting criteria:\n  - Classification: Gini impurity = 1 - Σpᵢ², or Entropy = -Σpᵢlog₂(pᵢ)\n  - Regression: Variance reduction (MSE)\n\nThe algorithm greedily selects the split that maximizes information gain at each node.\n\nPruning (prevent overfitting):\n  - Pre-pruning: max_depth, min_samples_leaf, min_samples_split\n  - Post-pruning: cost-complexity pruning (ccp_alpha)\n\nAdvantages: interpretable, handles mixed data types, no scaling needed\nLimitations: high variance (overfitting), axis-aligned splits only",
    video:{t:"Decision Trees Explained",ch:"StatQuest",v:"3.5M",url:"https://www.youtube.com/results?search_query=decision+tree+statquest"}},
  // Finance
  {trigger:"npv",ghost:"Net Present Value (NPV) = Σ [CFₜ / (1+r)ᵗ] - Initial Investment\n\nWhere:\n  CFₜ = Cash flow at time t\n  r = Discount rate (usually WACC)\n  t = Time period\n\nDecision rule: NPV > 0 → accept project (creates value)\n\nExample: Investment of 1000, returns 400/year for 3 years at 10% discount:\n  NPV = -1000 + 400/1.1 + 400/1.21 + 400/1.331 = -5.26 (reject)\n\nAdvantages: accounts for time value of money, considers all cash flows\nLimitations: requires accurate cash flow estimates, sensitive to discount rate",
    video:{t:"NPV Explained Simply",ch:"365 Financial",v:"1.8M",url:"https://www.youtube.com/results?search_query=npv+explained"}},
  {trigger:"wacc",ghost:"WACC = (E/V × Re) + (D/V × Rd × (1-T))\n\nComponents:\n  E = Market value of equity\n  D = Market value of debt\n  V = E + D (total firm value)\n  Re = Cost of equity (from CAPM: Rf + β(Rm-Rf))\n  Rd = Cost of debt (yield on existing debt)\n  T = Corporate tax rate\n\nExample: E=600, D=400, V=1000, Re=12%, Rd=6%, T=25%\n  WACC = (0.6×12%) + (0.4×6%×0.75) = 7.2% + 1.8% = 9.0%\n\nUsed as discount rate for NPV calculations and firm valuation.",
    video:{t:"WACC Calculation Walk-Through",ch:"CFI",v:"800K",url:"https://www.youtube.com/results?search_query=wacc+calculation"}},
  {trigger:"capm",ghost:"Capital Asset Pricing Model: E(Rᵢ) = Rf + βᵢ(E(Rm) - Rf)\n\nWhere:\n  Rf = Risk-free rate (e.g. 10-year government bond yield)\n  βᵢ = Beta of stock i (systematic risk measure)\n  E(Rm) = Expected market return\n  E(Rm)-Rf = Market risk premium (typically 4-7%)\n\nBeta interpretation:\n  β = 1 → moves with market\n  β > 1 → more volatile than market\n  β < 1 → less volatile (defensive stock)\n  β < 0 → inversely correlated (rare)\n\nLimitations: assumes efficient markets, single-period model, historical beta may not predict future",
    video:{t:"CAPM Explained",ch:"365 Financial",v:"1.1M",url:"https://www.youtube.com/results?search_query=capm+explained"}},
  // Quantum
  {trigger:"quantum entanglement",ghost:"Quantum Entanglement occurs when two particles become correlated such that the state of one instantly determines the state of the other, regardless of distance.\n\nBell State (maximally entangled): |Φ+⟩ = (|00⟩ + |11⟩)/√2\n\nKey properties:\n  - Measuring one particle instantly collapses the other\n  - No faster-than-light communication (no-communication theorem)\n  - Cannot be explained by hidden variables (Bell's theorem)\n\nApplications:\n  - Quantum teleportation\n  - Quantum key distribution (QKD) for secure communication\n  - Superdense coding (2 classical bits per qubit)\n  - Quantum error correction",
    video:{t:"Entanglement Explained",ch:"Veritasium",v:"9.2M",url:"https://www.youtube.com/results?search_query=quantum+entanglement+veritasium"}},
  // Health
  {trigger:"progressive overload",ghost:"Progressive Overload — the principle of gradually increasing training stimulus:\n\nMethods:\n  1. Increase weight (most common) — add 2.5-5kg per session\n  2. Increase reps — add 1-2 reps per set\n  3. Increase sets — add 1 set per exercise\n  4. Increase frequency — train muscle group more often\n  5. Decrease rest time — more metabolic stress\n\nSample 8-week progression for bench press:\n  Week 1-2: 60kg × 4×8\n  Week 3-4: 62.5kg × 4×8\n  Week 5-6: 65kg × 4×8\n  Week 7: Deload 50kg × 3×8\n  Week 8: Test 70kg × 1RM",
    video:{t:"Progressive Overload Science",ch:"Jeff Nippard",v:"3.8M",url:"https://www.youtube.com/results?search_query=progressive+overload+nippard"}},
  {trigger:"protein",ghost:"Protein Requirements for Muscle Growth:\n\n  Recommended intake: 1.6 - 2.2g per kg bodyweight per day\n  For a 75kg person: 120-165g protein daily\n\nBest sources (per 100g):\n  - Chicken breast: 31g protein\n  - Greek yogurt: 10g protein\n  - Eggs: 13g protein (2 large)\n  - Whey protein scoop: 24g protein\n  - Salmon: 25g protein\n  - Lentils: 9g protein\n\nTiming: spread across 3-5 meals (30-40g per meal)\nPost-workout window: within 2 hours, 20-40g",
    video:{t:"How Much Protein?",ch:"Jeff Nippard",v:"5.1M",url:"https://www.youtube.com/results?search_query=protein+muscle+growth"}},
  // Budget
  {trigger:"50/30/20",ghost:"50/30/20 Budget Rule:\n\n  50% Needs (essentials):\n    Rent/mortgage, groceries, transport, insurance, utilities, minimum debt payments\n\n  30% Wants (lifestyle):\n    Dining out, entertainment, subscriptions, shopping, hobbies, travel\n\n  20% Savings (future):\n    Emergency fund (3-6 months expenses), investments, extra debt payments, retirement\n\nFor income of 2500:\n  Needs: 1250 max\n  Wants: 750 max\n  Savings: 500 minimum",
    video:{t:"50/30/20 Rule Explained",ch:"Two Cents",v:"2.8M",url:"https://www.youtube.com/results?search_query=50+30+20+budget+rule"}},
  // General
  {trigger:"pomodoro",ghost:"Pomodoro Technique:\n\n  1. Choose a task to work on\n  2. Set timer for 25 minutes (one \"pomodoro\")\n  3. Work with full focus — no distractions\n  4. Short break: 5 minutes\n  5. After 4 pomodoros: long break (15-30 minutes)\n\nTips:\n  - Track completed pomodoros per day\n  - If interrupted, mark it and restart\n  - Plan tasks in pomodoro units (1-4 per task)\n  - Adjust timer length to your attention span (25-50 min)",
    video:{t:"Pomodoro Technique",ch:"Thomas Frank",v:"2.8M",url:"https://www.youtube.com/results?search_query=pomodoro+technique"}},
];

function getGhost(text) {
  const plain = text.replace(/<[^>]+>/g,"").toLowerCase();
  const lines = plain.split("\n").filter(l=>l.trim());
  const lastLine = (lines[lines.length-1]||"").trim();
  const last2 = lines.slice(-3).join(" ");
  for (const r of GHOST_DB) {
    if (lastLine.includes(r.trigger) || last2.includes(r.trigger)) return r;
  }
  return null;
}

// --- 3B: Video suggestion panel ---
const VID_DB = [
  {t:"Quantum Computing Explained",ch:"Kurzgesagt",v:"12M",ty:"youtube",url:"https://www.youtube.com/results?search_query=quantum+computing",triggers:["quantum","qubit","superposition"]},
  {t:"ML Full Course 2026",ch:"freeCodeCamp",v:"8.3M",ty:"youtube",url:"https://www.youtube.com/results?search_query=machine+learning+course",triggers:["machine learning","neural","regression","sklearn"]},
  {t:"Random Forest Deep Dive",ch:"StatQuest",v:"4.8M",ty:"youtube",url:"https://www.youtube.com/results?search_query=random+forest",triggers:["random forest","ensemble","bagging"]},
  {t:"NPV & IRR Finance",ch:"365 Financial",v:"1.2M",ty:"youtube",url:"https://www.youtube.com/results?search_query=npv+irr",triggers:["npv","irr","wacc","dcf"]},
  {t:"PyTorch Quick Start",ch:"Fireship",v:"2.1M",ty:"youtube",url:"https://www.youtube.com/results?search_query=pytorch",triggers:["pytorch","tensorflow","deep learning"]},
  {t:"CNN from Scratch",ch:"Sentdex",v:"1.5M",ty:"youtube",url:"https://www.youtube.com/results?search_query=cnn+tutorial",triggers:["cnn","convolutional","image classification"]},
  {t:"Chicken Stir-Fry — 15 Min",ch:"Quick Kitchen",v:"2.3M",ty:"youtube",url:"https://www.youtube.com/results?search_query=chicken+stir+fry",triggers:["chicken","stir fry","garlic"]},
  {t:"30-Min PPL Workout",ch:"Jeff Nippard",v:"4.2M",ty:"youtube",url:"https://www.youtube.com/results?search_query=push+pull+legs",triggers:["workout","bench","squat","deadlift"]},
  {t:"Barcelona Guide",ch:"Lost LeBlanc",v:"2.1M",ty:"youtube",url:"https://www.youtube.com/results?search_query=barcelona+guide",triggers:["barcelona","sagrada"]},
  {t:"Validate Startup Ideas",ch:"Y Combinator",v:"1.9M",ty:"youtube",url:"https://www.youtube.com/results?search_query=validate+startup",triggers:["startup","saas","mvp"]},
  {t:"Transformers Explained",ch:"3Blue1Brown",v:"5.6M",ty:"youtube",url:"https://www.youtube.com/results?search_query=transformer+attention",triggers:["transformer","attention","llm","gpt"]},
  {t:"Protein Meal Prep",ch:"R. James",v:"3.4M",ty:"youtube",url:"https://www.youtube.com/results?search_query=protein+meal+prep",triggers:["protein","meal prep","calories"]},
  {t:"Budget Like a Pro",ch:"Two Cents",v:"2.8M",ty:"youtube",url:"https://www.youtube.com/results?search_query=budget+rule",triggers:["budget","savings","income"]},
];
function getVideos(text,max=3){const l=text.replace(/<[^>]+>/g,"").toLowerCase();return VID_DB.map(v=>({...v,sc:v.triggers.reduce((s,t)=>s+(l.includes(t)?1:0),0)})).filter(v=>v.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,max);}

// --- 3C: Knowledge tracker ---
const KT={quantum_computing:{name:"Quantum Computing",kw:["qubit","quantum","superposition","entanglement","hadamard","cnot","pauli","decoherence","shor","grover","bloch"],tot:15},machine_learning:{name:"Machine Learning",kw:["regression","decision tree","random forest","svm","supervised","unsupervised","k-means","pca","dbscan","neural","backpropag","gradient","relu","sigmoid","cnn","pytorch","tensorflow","scikit"],tot:20},finance:{name:"Corporate Finance",kw:["npv","irr","wacc","capital structure","modigliani","dividend","dcf","valuation","cash flow","risk","portfolio","capm"],tot:15}};
function calcKnow(notes){const t=Object.values(notes).filter(n=>n.cat==="study").map(n=>(n.content||"").replace(/<[^>]+>/g,"").toLowerCase()).join(" ");const r={};for(const[k,v]of Object.entries(KT)){const f=v.kw.filter(w=>t.includes(w)).length;const p=Math.min(100,Math.round(f/v.tot*100));r[k]={name:v.name,pct:p,found:f,total:v.tot,missing:v.kw.filter(w=>!t.includes(w)).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).slice(0,5)};}return r;}

// --- 3D: Next topics ---
const NXT={quantum_computing:[{topic:"Quantum Error Correction",desc:"Essential for practical quantum computers",video:"https://www.youtube.com/results?search_query=quantum+error+correction",tn:"s1"},{topic:"Quantum Machine Learning",desc:"Intersection of QC and ML",video:"https://www.youtube.com/results?search_query=quantum+machine+learning",tn:"s1"}],machine_learning:[{topic:"Transformers & Attention",desc:"Foundation of modern NLP / LLMs",video:"https://www.youtube.com/results?search_query=transformer+attention",tn:"s2"},{topic:"Reinforcement Learning",desc:"Agents, rewards, and policies",video:"https://www.youtube.com/results?search_query=reinforcement+learning",tn:"s2"},{topic:"MLOps & Deployment",desc:"Taking models to production",video:"https://www.youtube.com/results?search_query=mlops+deployment",tn:"s2"}],finance:[{topic:"Monte Carlo Simulation",desc:"Risk analysis and option pricing",video:"https://www.youtube.com/results?search_query=monte+carlo+finance",tn:"s3"},{topic:"LBO Modeling",desc:"Leveraged buyout valuation",video:"https://www.youtube.com/results?search_query=lbo+model",tn:"s3"}]};
function getNextTopics(k){const r=[];for(const[key,info]of Object.entries(k)){if(info.pct<85&&NXT[key])for(const nt of NXT[key])r.push({...nt,subject:info.name,curPct:info.pct});}return r.slice(0,5);}

// --- 3E: Parsers ---
function parseCals(t){const p=t.replace(/<[^>]+>/g,"");const d={};for(const l of p.split("\n")){const m=l.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[:\s]/i);if(m){const c=[...l.matchAll(/(\d+)\s*cal/gi)].map(x=>parseInt(x[1]));if(c.length)d[m[1]]=c.reduce((a,b)=>a+b,0);}}return d;}
function parseBudget(t){const p=t.replace(/<[^>]+>/g,"");let inc=0;const exp={};const goals=[];for(const l of p.split("\n")){const ll=l.trim().toLowerCase();const im=ll.match(/income[:\s]*(\d+)/);if(im){inc=parseInt(im[1]);continue;}if(ll.startsWith("goal")){goals.push(l.trim());continue;}const em=ll.match(/^([a-z\s]+)[:\s]+(\d+)/);if(em&&!em[1].includes("income")&&!em[1].includes("goal"))exp[em[1].trim().replace(/\b\w/g,c=>c.toUpperCase())]=parseInt(em[2]);}return{income:inc,expenses:exp,goals,total:Object.values(exp).reduce((a,b)=>a+b,0)};}
function scoreIdea(t){const c=t.replace(/<[^>]+>/g,"").toLowerCase();const n=Math.min(10,3+["unique","novel","innovative","disrupt"].filter(w=>c.includes(w)).length*2);const f=Math.min(10,4+["mvp","prototype","simple","api","build"].filter(w=>c.includes(w)).length);const m=Math.min(10,2+["market","500k","million","restaurant","revenue","saas"].filter(w=>c.includes(w)).length);return{novelty:n,feasibility:f,market:m,overall:((n+f+m)/3).toFixed(1)};}
function parseMoods(t){const MW={great:5,amazing:5,happy:5,motivated:5,confident:5,aced:5,good:4,fun:4,better:4,content:4,organized:4,okay:3,lazy:3,tired:2,stressed:2,bad:1,sad:1};const p=t.replace(/<[^>]+>/g,"");const d=[];for(const l of p.split("\n")){const dm=l.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*/i);if(dm){let mood=3;for(const[w,s]of Object.entries(MW))if(l.toLowerCase().includes(w)){mood=s;break;}d.push({day:dm[0],mood});}}return d;}



// ══════════════════════════════════════════════════════════════
// SECTION 4: STYLES
// ══════════════════════════════════════════════════════════════
const S={
  app:{display:"flex",height:"100vh",width:"100%",background:T.bg,color:T.txt,fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"},
  sidebar:{width:250,minWidth:250,background:"var(--t-sidebar)",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"},
  sideScroll:{flex:1,overflowY:"auto",padding:"0 10px 10px"},
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  topBar:{display:"flex",gap:4,padding:"6px 16px",borderBottom:`1px solid ${T.border}`,background:"var(--t-topbar)",alignItems:"center"},
  tabBtn:a=>({padding:"6px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",background:a?"var(--t-tab-active)":"transparent",color:a?T.a1:T.txt2}),
  noteBtn:(a,indent=0)=>({display:"block",width:"100%",textAlign:"left",padding:`4px 8px 4px ${12+indent*10}px`,border:"none",borderRadius:6,cursor:"pointer",fontSize:indent?11:12,fontWeight:a?600:400,background:a?"var(--t-note-active)":"transparent",color:a?T.a1:T.txt3,fontFamily:"'Inter',sans-serif",marginBottom:1}),
  glass:{background:T.glass,backdropFilter:"blur(20px)",border:`1px solid ${T.border}`,borderRadius:12,padding:14,marginBottom:8},
  glassAccent:{background:"var(--t-glass-accent)",border:`1px solid ${T.border}`,borderRadius:12,padding:14,marginBottom:8},
  tag:c=>({display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,textTransform:"uppercase",background:CM[c]?.bg||T.glass,color:CM[c]?.color||T.txt2}),
  sh:{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.a1,letterSpacing:".5px",textTransform:"uppercase",marginBottom:5},
  sh2:{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.a2,letterSpacing:".5px",textTransform:"uppercase",marginBottom:5},
  sh3:{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.amber,letterSpacing:".5px",textTransform:"uppercase",marginBottom:5},
  editor:{minHeight:350,outline:"none",padding:"14px 18px",fontFamily:"'Inter',sans-serif",fontSize:15,lineHeight:1.7,color:T.txt,background:"transparent"},
  toolbar:{display:"flex",flexWrap:"wrap",gap:1,padding:"5px 10px",borderBottom:`1px solid ${T.border}`,background:"var(--t-topbar)"},
  toolBtn:{padding:"3px 7px",border:"none",borderRadius:4,cursor:"pointer",fontSize:12,background:"transparent",color:T.txt3,fontFamily:"'Inter',sans-serif"},
  sugPanel:{width:280,minWidth:280,borderLeft:`1px solid ${T.border}`,background:"var(--t-panel)",overflowY:"auto",padding:12},
  statCard:{background:T.glass,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 12px",textAlign:"center",flex:1},
  statN:{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,background:T.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  statL:{fontSize:9,color:T.txt2,textTransform:"uppercase",letterSpacing:".7px"},
  pBar:{height:7,borderRadius:7,background:"var(--t-pbar)",overflow:"hidden",margin:"3px 0"},
  pFill:(p,c)=>({height:"100%",borderRadius:7,width:`${p}%`,background:c,transition:"width .5s"}),
};

// ══════════════════════════════════════════════════════════════
// SECTION 5: RICH EDITOR
// ══════════════════════════════════════════════════════════════
function RichEditor({content,onChange,ghostData,onAcceptGhost,noteId,loading,onShowFiles}){
  const ref=useRef(null);const[init,setInit]=useState(false);const prev=useRef(noteId);const[dropOver,setDropOver]=useState(false);
  useEffect(()=>{if(noteId!==prev.current){setInit(false);prev.current=noteId;}},[noteId]);
  useEffect(()=>{if(ref.current&&!init){ref.current.innerHTML=content||"";setInit(true);}},[content,init]);
  // Ghost: inject inline span at cursor, accept with TAB
  useEffect(()=>{
    const old=ref.current?.querySelector("#nt-ghost");if(old)old.remove();
    if(!ghostData||!ref.current)return;
    const text=(typeof ghostData==="string"?ghostData:ghostData.ghost).split("\n").filter(l=>l.trim()).slice(0,2).join("\n");
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount||!ref.current.contains(sel.anchorNode))return;
    const ghost=document.createElement("span");ghost.id="nt-ghost";ghost.setAttribute("contenteditable","false");
    ghost.textContent=text;ghost.style.cssText="color:rgba(122,191,234,.5);pointer-events:none;user-select:none;white-space:pre-wrap;font-style:italic;";
    const r=sel.getRangeAt(0).cloneRange();r.collapse(false);r.insertNode(ghost);
    const nr=document.createRange();nr.setStartBefore(ghost);nr.collapse(true);
    sel.removeAllRanges();sel.addRange(nr);
  },[ghostData]);
  const onInput=useCallback(()=>{
    const g=ref.current?.querySelector("#nt-ghost");if(g)g.remove();
    if(ref.current)onChange(ref.current.innerHTML);
  },[onChange]);
  const onKey=useCallback(e=>{
    if(e.key==="Tab"){
      const ghost=ref.current?.querySelector("#nt-ghost");
      if(ghost){e.preventDefault();
        const tn=document.createTextNode(ghost.textContent);
        ghost.parentNode.replaceChild(tn,ghost);
        const r=document.createRange();r.setStartAfter(tn);r.collapse(true);
        const s=window.getSelection();s.removeAllRanges();s.addRange(r);
        if(ref.current)onChange(ref.current.innerHTML);onAcceptGhost();
        return;
      }
    }
    if(e.key==="Tab")e.preventDefault();
  },[onChange,onAcceptGhost]);
  // Drag-to-move video blocks already in editor
  const handleBlockDragStart=useCallback(e=>{
    const blk=e.target.closest("[data-vid-id]");
    if(blk){
      const vid=JSON.parse(blk.getAttribute("data-vid-json"));
      e.dataTransfer.setData("application/json",JSON.stringify({...vid,_moveId:blk.getAttribute("data-vid-id")}));
      e.dataTransfer.effectAllowed="move";
    }
  },[]);
  const handleDragOver=useCallback(e=>{if(e.dataTransfer.types.includes("application/json")){e.preventDefault();setDropOver(true);}},[]);
  const handleDragLeave=useCallback(e=>{if(!e.currentTarget.contains(e.relatedTarget))setDropOver(false);},[]);
  const handleDrop=useCallback(e=>{
    const raw=e.dataTransfer.getData("application/json");if(!raw)return;
    try{
      const data=JSON.parse(raw);if(data.type!=="youtube-video")return;
      e.preventDefault();setDropOver(false);
      // Position caret at drop point
      if(document.caretRangeFromPoint){const rng=document.caretRangeFromPoint(e.clientX,e.clientY);if(rng){const s=window.getSelection();s.removeAllRanges();s.addRange(rng);}}
      else if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(e.clientX,e.clientY);if(p){const rng=document.createRange();rng.setStart(p.offsetNode,p.offset);rng.collapse(true);const s=window.getSelection();s.removeAllRanges();s.addRange(rng);}}
      // Remove old block if moving
      if(data._moveId&&ref.current){
        const old=ref.current.querySelector(`[data-vid-id="${data._moveId}"]`);
        if(old)old.closest("div[data-vid-id]")?.remove()||old.remove();
      }
      const cid=`vp${Date.now()}`;
      const thumb=data.thumb?`<img src="${data.thumb}" style="width:80px;height:54px;border-radius:5px;object-fit:cover;flex-shrink:0;" alt="">`
        :`<div style="width:80px;height:54px;border-radius:5px;background:linear-gradient(135deg,#e62117,#c4302b);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-size:18px;">&#9654;</span></div>`;
      const html=`<div data-vid-id="${cid}" data-vid-json='${JSON.stringify({type:"youtube-video",t:data.t,ch:data.ch,v:data.v,url:data.url,thumb:data.thumb})}' contenteditable="false" draggable="true" style="padding:8px 12px;border-radius:8px;border:1px solid rgba(37,99,235,.25);background:rgba(37,99,235,.05);margin:8px 0;display:flex;align-items:center;gap:10px;user-select:none;cursor:grab;">${thumb}<div style="flex:1;min-width:0;"><strong style="color:#7abfea;font-size:13px;">${data.t}</strong><br><span style="font-size:11px;color:rgba(122,191,234,.5);">${data.ch}${data.v?" \u00b7 "+data.v:""}</span><br><a href="${data.url}" target="_blank" style="color:#5ba3d9;font-size:11px;text-decoration:none;">Watch &#8594;</a></div></div><p data-vc="${cid}"><br></p>`;
      ref.current?.focus();
      document.execCommand("insertHTML",false,html);
      if(ref.current)onChange(ref.current.innerHTML);
      setTimeout(()=>{
        const t=ref.current?.querySelector(`[data-vc="${cid}"]`);
        if(t){t.removeAttribute("data-vc");const r=document.createRange();r.setStart(t,0);r.collapse(true);const s=window.getSelection();s.removeAllRanges();s.addRange(r);ref.current?.focus();}
      },0);
    }catch(err){}
  },[onChange]);
  const exec=(cmd,val=null)=>{document.execCommand(cmd,false,val);ref.current?.focus();onInput();};
  return(
    <div style={{border:`1px solid ${dropOver?T.a2:T.border}`,borderRadius:12,overflow:"hidden",background:dropOver?"rgba(37,99,235,.04)":T.glass,flex:1,display:"flex",flexDirection:"column",transition:"border-color .15s"}} onDragStart={handleBlockDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div style={S.toolbar}>
        <select onChange={e=>{if(e.target.value)exec("formatBlock",e.target.value);e.target.value="";}} style={{...S.toolBtn,cursor:"pointer",background:"transparent"}}><option value="">Heading</option><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="p">Normal</option></select>
        <span style={{width:1,background:T.border,margin:"0 3px"}}/>
        <button onClick={()=>exec("bold")} style={S.toolBtn}><b>B</b></button>
        <button onClick={()=>exec("italic")} style={S.toolBtn}><i>I</i></button>
        <button onClick={()=>exec("underline")} style={S.toolBtn}><u>U</u></button>
        <button onClick={()=>exec("strikeThrough")} style={S.toolBtn}><s>S</s></button>
        <span style={{width:1,background:T.border,margin:"0 3px"}}/>
        <button onClick={()=>exec("insertUnorderedList")} style={S.toolBtn}>• List</button>
        <button onClick={()=>exec("insertOrderedList")} style={S.toolBtn}>1.</button>
        <button onClick={()=>exec("indent")} style={S.toolBtn}>→</button>
        <button onClick={()=>exec("outdent")} style={S.toolBtn}>←</button>
        <span style={{width:1,background:T.border,margin:"0 3px"}}/>
        <button onClick={()=>{document.execCommand("insertHTML",false,'<table style="width:100%;border-collapse:collapse;margin:8px 0"><tr><th style="border:1px solid rgba(255,255,255,.08);padding:5px 8px;background:rgba(255,255,255,.03)">Col 1</th><th style="border:1px solid rgba(255,255,255,.08);padding:5px 8px;background:rgba(255,255,255,.03)">Col 2</th></tr><tr><td style="border:1px solid rgba(255,255,255,.08);padding:5px 8px">\u2014</td><td style="border:1px solid rgba(255,255,255,.08);padding:5px 8px">\u2014</td></tr></table>');ref.current?.focus();onInput();}} style={S.toolBtn}>Table</button>
        <button onClick={()=>exec("formatBlock","blockquote")} style={S.toolBtn}>Quote</button>
        <button onClick={()=>exec("formatBlock","pre")} style={S.toolBtn}>Code</button>
        <button onClick={()=>{const u=prompt("URL:");if(u)exec("createLink",u);}} style={S.toolBtn}>Link</button>
        <button onClick={()=>exec("removeFormat")} style={S.toolBtn}>Clear</button>
        <span style={{width:1,background:T.border,margin:"0 3px"}}/>
        <button onClick={onShowFiles} style={{...S.toolBtn,color:T.a2,fontWeight:600}}>Show in Files</button>
      </div>
      <div style={{flex:1,overflowY:"auto",position:"relative"}}>
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={onInput} onKeyDown={onKey} style={S.editor}/>
        {loading&&<div style={{position:"absolute",bottom:6,right:12,fontSize:10,color:T.a2,fontFamily:"'JetBrains Mono',monospace",opacity:.6,pointerEvents:"none",background:"rgba(0,0,0,.3)",padding:"2px 7px",borderRadius:5}}>AI thinking…</div>}
        {ghostData&&!loading&&<div style={{position:"absolute",bottom:6,left:18,fontSize:10,color:T.txt2,fontFamily:"'JetBrains Mono',monospace",opacity:.5,pointerEvents:"none"}}>TAB to accept</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION 6: SIDEBAR (hierarchical)
// ══════════════════════════════════════════════════════════════
function Sidebar({folders,notes,activeNote,activeFolder,onSelect,onSelectFolder,onCreate,onCreateFolder,onSelectParent,onSelectFolderView}){
  const[nt,setNt]=useState("");const[nf,setNf]=useState(false);const[fn,setFn]=useState("");
  return(
    <div style={S.sidebar}>
      <div style={{padding:"12px 12px 0"}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700}}>Notiq</div><div style={{fontSize:10,color:T.txt2,marginBottom:10}}>AI-powered \u00b7 Gemini + YouTube</div></div>
      <div style={{padding:"0 10px 6px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",gap:3}}>
          <input value={nt} onChange={e=>setNt(e.target.value)} placeholder="New note..." style={{flex:1,padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.glass,color:T.txt,fontSize:11,outline:"none",fontFamily:"'Inter',sans-serif"}} onKeyDown={e=>{if(e.key==="Enter"&&nt.trim()){onCreate(nt.trim(),activeFolder);setNt("");}}}/>
          <button onClick={()=>{if(nt.trim()){onCreate(nt.trim(),activeFolder);setNt("");}}} style={{padding:"5px 10px",borderRadius:6,border:"none",background:"var(--t-btn)",color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer"}}>+</button>
        </div>
      </div>
      <div style={S.sideScroll}>
        {folders.map(f=>(<div key={f.id}>
          <div style={{fontSize:13,fontWeight:700,color:f.id===activeFolder?T.a1:T.txt3,padding:"6px 0 2px",cursor:"pointer"}} onClick={()=>{onSelectFolder(f.id);onSelectFolderView(f.id);}}>{f.name}</div>
          {f.notes.map(nid=>{const n=notes[nid];if(!n||n.parent)return null;const ch=n.children?.length>0;return(<div key={nid}>
            <button style={S.noteBtn(nid===activeNote,0)} onClick={()=>{ch?onSelectParent(nid):onSelect(nid);onSelectFolder(f.id);}}>{ch?"\u25b8 ":""}{n.title}</button>
            {ch&&n.children.map(cid=>{const cn=notes[cid];if(!cn)return null;return <button key={cid} style={S.noteBtn(cid===activeNote,1)} onClick={()=>{onSelect(cid);onSelectFolder(f.id);}}>{cn.title}</button>;})}
          </div>);})}
        </div>))}
        <div style={{marginTop:10}}>
          {nf?(<div style={{display:"flex",gap:3}}><input value={fn} onChange={e=>setFn(e.target.value)} placeholder="Folder name..." autoFocus style={{flex:1,padding:"4px 7px",borderRadius:6,border:`1px solid ${T.border}`,background:T.glass,color:T.txt,fontSize:10,outline:"none"}} onKeyDown={e=>{if(e.key==="Enter"&&fn.trim()){onCreateFolder(fn.trim());setFn("");setNf(false);}}}/><button onClick={()=>{if(fn.trim()){onCreateFolder(fn.trim());setFn("");setNf(false);}}} style={{padding:"4px 7px",borderRadius:6,border:"none",background:T.a2,color:"#fff",fontSize:9,cursor:"pointer"}}>+</button></div>):(<button onClick={()=>setNf(true)} style={{...S.noteBtn(false,0),color:T.txt2,fontSize:11}}>+ New Folder</button>)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION 7: FILE PANEL (drag-drop, "Show in Files")
// ══════════════════════════════════════════════════════════════
function FilePanel({files,onUpload,onClose,searchText}){
  const[dragOver,setDragOver]=useState(false);const[active,setActive]=useState(0);
  const handle=fileList=>{[...fileList].forEach(f=>{const r=new FileReader();r.onload=e=>onUpload({name:f.name,type:f.type,data:e.target.result,size:f.size});f.type.startsWith("image/")||f.type==="application/pdf"?r.readAsDataURL(f):r.readAsText(f);});};
  const cur=files[active];
  return(
    <div style={S.sugPanel}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={S.sh}>Files & Resources</div><button onClick={onClose} style={{border:"none",background:"transparent",color:T.txt2,cursor:"pointer",fontSize:16}}>\u00d7</button></div>
      <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handle(e.dataTransfer.files);}}
        style={{border:`2px dashed ${dragOver?T.a2:T.border}`,borderRadius:10,padding:16,textAlign:"center",marginBottom:10,background:dragOver?"rgba(37,99,235,.06)":"transparent",cursor:"pointer"}}
        onClick={()=>document.getElementById("fInput")?.click()}>
        <div style={{fontSize:12,color:dragOver?T.a2:T.txt2}}>Drop files here</div>
        <div style={{fontSize:10,color:T.txt2}}>PDF, images, text</div>
        <input id="fInput" type="file" multiple accept="image/*,.pdf,.txt,.md,.csv" style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      </div>
      {files.length>0&&<div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:8}}>
        {files.map((f,i)=><button key={i} onClick={()=>setActive(i)} style={{padding:"3px 8px",borderRadius:6,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:i===active?"rgba(37,99,235,.15)":T.glass,color:i===active?T.a2:T.txt2}}>{f.name.length>18?f.name.slice(0,18)+"...":f.name}</button>)}
      </div>}
      {cur&&<div style={{borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`}}>
        {cur.type.startsWith("image/")&&<img src={cur.data} alt="" style={{width:"100%",borderRadius:8}}/>}
        {cur.type==="application/pdf"&&<iframe src={cur.data} style={{width:"100%",height:400,border:"none"}} title={cur.name}/>}
        {!cur.type.startsWith("image/")&&cur.type!=="application/pdf"&&(
          <div style={{padding:10,fontSize:11,color:T.txt3,maxHeight:400,overflowY:"auto",background:"rgba(0,0,0,.2)",borderRadius:8,whiteSpace:"pre-wrap",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.5}}>
            {(cur.data||"").split("\n").map((line,i)=>{const hl=searchText&&line.toLowerCase().includes(searchText.toLowerCase());return <div key={i} style={{background:hl?"rgba(232,121,168,.15)":"transparent",padding:hl?"1px 4px":"0",borderRadius:hl?4:0}}>{line||" "}</div>;})}
          </div>
        )}
      </div>}
      {files.length===0&&<div style={{fontSize:11,color:T.txt2,textAlign:"center",padding:10}}>Upload lecture slides, cookbooks, exercise plans \u2014 highlight text in notes and click "Show in Files" to search</div>}
    </div>
  );
}

// EditableNote: contentEditable note for combined view
function EditableNote({id,content,onChange}){
  const ref=useRef(null);const[init,setInit]=useState(false);const prevId=useRef(id);
  useEffect(()=>{if(id!==prevId.current){setInit(false);prevId.current=id;}},[id]);
  useEffect(()=>{if(ref.current&&!init){ref.current.innerHTML=content||"";setInit(true);}},[content,init]);
  return(<div ref={ref} contentEditable suppressContentEditableWarning
    onInput={()=>{if(ref.current)onChange(id,ref.current.innerHTML);}}
    style={{...S.glass,padding:16,fontSize:15,lineHeight:1.7,outline:"none",minHeight:40,cursor:"text",borderRadius:10}}
  />);
}

// ══════════════════════════════════════════════════════════════
// SECTION 8: COMBINED VIEW (folder or parent note)
// ══════════════════════════════════════════════════════════════
function CombinedView({title,items,onSelect,onAddLesson,parentId,onChangeNote}){
  const[nt,setNt]=useState("");
  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
      <h2 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,margin:"0 0 4px"}}>{title}</h2>
      <span style={{fontSize:11,color:T.txt2}}>{items.length} note{items.length!==1?"s":""}</span>
      {parentId&&<div style={{display:"flex",gap:4,margin:"10px 0"}}><input value={nt} onChange={e=>setNt(e.target.value)} placeholder="Add new lesson..." style={{flex:1,padding:"6px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.glass,color:T.txt,fontSize:12,outline:"none"}} onKeyDown={e=>{if(e.key==="Enter"&&nt.trim()){onAddLesson(nt.trim());setNt("");}}}/><button onClick={()=>{if(nt.trim()){onAddLesson(nt.trim());setNt("");}}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:"var(--t-btn)",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>+ Lesson</button></div>}
      <div style={{...S.glass,padding:12,marginBottom:14}}><div style={S.sh}>Table of Contents</div>
        {items.map((c,i)=><div key={c.id} onClick={()=>onSelect(c.id)} style={{padding:"5px 8px",cursor:"pointer",fontSize:13,color:T.txt3,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.a2,fontWeight:600,marginRight:6}}>{i+1}.</span>{c.title}<span style={{fontSize:10,color:T.txt2,marginLeft:8}}>{c.created}</span></div>)}
      </div>
      {items.map(c=>(<div key={c.id} style={{marginBottom:20}}>
        <h3 style={{fontSize:15,color:T.a1,margin:"0 0 6px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}} onClick={()=>onSelect(c.id)}>{c.title}</h3>
        <EditableNote id={c.id} content={c.content||""} onChange={onChangeNote}/>
      </div>))}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// SECTION 9: AI SUGGESTION PANEL
// ══════════════════════════════════════════════════════════════
function SugPanel({videos,ytResults,knowledge,cat,prefs,aiInsight,loadingYT}){
  const all=ytResults.length>0?ytResults:videos;
  return(<div style={S.sugPanel}>
    <div style={S.sh}>Resources {ytResults.length>0&&<span style={{fontSize:9,color:T.a2}}>(live)</span>}</div>
    {loadingYT&&<div style={{fontSize:11,color:T.a2,marginBottom:6}}>Searching YouTube...</div>}
    {all.length===0&&!loadingYT&&<p style={{fontSize:11,color:T.txt2}}>Type to get suggestions.</p>}
    {all.map((v,i)=>(<div key={i} draggable onDragStart={e=>{e.dataTransfer.setData("application/json",JSON.stringify({type:"youtube-video",t:v.t,ch:v.ch,v:v.v||"",url:v.url,thumb:v.thumb||""}));e.dataTransfer.effectAllowed="copy";}} style={{marginBottom:5}}><a href={v.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}><div style={{display:"flex",gap:7,alignItems:"center",padding:"5px 7px",borderRadius:8,border:`1px solid ${T.border}`,background:T.glass,cursor:"grab"}}>
      {v.thumb?<img src={v.thumb} alt="" style={{width:64,height:44,borderRadius:5,objectFit:"cover",flexShrink:0}}/>:<div style={{width:44,height:32,borderRadius:5,background:"linear-gradient(135deg,rgba(37,99,235,.2),rgba(122,191,234,.2))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:T.a2,fontWeight:700}}>{(v.ty||"VID").toUpperCase()}</span></div>}
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:600,color:T.txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.t}</div><div style={{fontSize:9,color:T.txt2}}>{v.ch}{v.v?` \u00b7 ${v.v}`:""}</div></div>
    </div></a><div style={{fontSize:9,color:T.txt2,textAlign:"center",opacity:.45,paddingBottom:2}}>drag to pin</div></div>))}
    {aiInsight&&<div style={{marginTop:12}}><div style={S.sh2}>AI Insight</div><div style={{...S.glassAccent,padding:10,fontSize:12,color:T.txt3,lineHeight:1.5}}>{aiInsight}</div></div>}
    {cat==="study"&&knowledge&&<div style={{marginTop:12}}><div style={S.sh2}>Knowledge</div>{Object.values(knowledge).map((info,i)=>(<div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{fontWeight:600}}>{info.name}</span><span style={{color:T.a1}}>{info.pct}%</span></div><div style={S.pBar}><div style={S.pFill(info.pct,info.pct>60?T.a1:info.pct>30?T.amber:T.blue)}/></div></div>))}</div>}
    {prefs&&(prefs.likes?.length>0||prefs.dislikes?.length>0)&&<div style={{marginTop:12}}><div style={S.sh3}>Preferences</div><div style={{display:"flex",flexWrap:"wrap",gap:2}}>{(prefs.likes||[]).map((l,i)=><span key={`l${i}`} style={{padding:"2px 6px",borderRadius:20,fontSize:10,background:"rgba(232,121,168,.1)",color:T.a1}}>{l}</span>)}{(prefs.dislikes||[]).map((d,i)=><span key={`d${i}`} style={{padding:"2px 6px",borderRadius:20,fontSize:10,background:"rgba(255,107,138,.1)",color:T.red}}>{d}</span>)}</div></div>}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 10: SUMMARY
// ══════════════════════════════════════════════════════════════
function SummaryPage({notes,knowledge,onAddTopic,geminiKey}){
  const[tab,setTab]=useState("study");const[aiSum,setAiSum]=useState(null);const[ld,setLd]=useState(false);
  const nxt=getNextTopics(knowledge);
  const healthN=Object.values(notes).filter(n=>n.cat==="health");
  const planN=Object.values(notes).filter(n=>n.cat==="plan");
  const ideaN=Object.values(notes).filter(n=>n.cat==="idea");
  const socialN=Object.values(notes).filter(n=>n.cat==="social");
  const dailyN=Object.values(notes).filter(n=>n.cat==="daily");
  const calD={};healthN.forEach(n=>Object.assign(calD,parseCals(n.content)));
  const gen=async()=>{if(!geminiKey)return;setLd(true);const all=Object.values(notes).filter(n=>n.cat===tab).map(n=>(n.content||"").replace(/<[^>]+>/g,"")).join("\n");const r=await geminiAnalyze(all,`Intelligence summary of these ${CM[tab]?.lb} notes. Key insights + 2-3 actionable recommendations.`,geminiKey);setAiSum(r);setLd(false);};
  // ── Daily analytics ──
  let dTotal=0,dDone=0;dailyN.forEach(n=>{dTotal+=(n.content.match(/<li>/g)||[]).length;dDone+=(n.content.match(/<s>/g)||[]).length;});
  const dRate=dTotal?Math.round(dDone/dTotal*100):0;
  const dScore=Math.min(100,Math.round(dRate*0.7+Math.min(30,dTotal*3)));
  // ── Study analytics ──
  const kVals=Object.values(knowledge);
  const avgMastery=kVals.length?Math.round(kVals.reduce((s,k)=>s+k.pct,0)/kVals.length):0;
  const atRisk=kVals.filter(k=>k.pct<50);
  const weakest=[...kVals].sort((a,b)=>a.pct-b.pct)[0];
  const totalGaps=kVals.reduce((s,k)=>s+(k.total-k.found),0);
  const estHours=Math.round(totalGaps*0.5);
  // ── Health analytics ──
  const TARGET_CAL=2000;
  const cals=Object.values(calD);
  const avgCal=cals.length?Math.round(cals.reduce((a,b)=>a+b,0)/cals.length):0;
  const energyIdx=cals.length?Math.max(0,Math.round(100-Math.abs(avgCal-TARGET_CAL)/TARGET_CAL*100)):50;
  const calStd=cals.length>1?Math.round(Math.sqrt(cals.reduce((s,c)=>s+Math.pow(c-avgCal,2),0)/cals.length)):0;
  const consistScore=Math.max(0,Math.min(100,100-Math.round(calStd/8)));
  const calEntries=Object.entries(calD);
  const bestDay=calEntries.length?calEntries.reduce((a,b)=>Math.abs(b[1]-TARGET_CAL)<Math.abs(a[1]-TARGET_CAL)?b:a,calEntries[0]):null;
  const worstDay=calEntries.length?calEntries.reduce((a,b)=>Math.abs(b[1]-TARGET_CAL)>Math.abs(a[1]-TARGET_CAL)?b:a,calEntries[0]):null;
  // ── Finance analytics ──
  let fIncome=0,fSpent=0,fExpenses={};
  planN.forEach(n=>{const bg=parseBudget(n.content);if(bg.income){fIncome+=bg.income;fSpent+=bg.total;Object.entries(bg.expenses).forEach(([k,v])=>{fExpenses[k]=(fExpenses[k]||0)+v;});}});
  const burnRate=fIncome?Math.round(fSpent/fIncome*100):0;
  const fSaved=fIncome-fSpent;
  const fHealthScore=Math.max(0,Math.min(100,100-burnRate+(fSaved>0?15:0)));
  const topExp=Object.entries(fExpenses).sort((a,b)=>b[1]-a[1])[0];
  // ── Ideas analytics ──
  const ideaScored=ideaN.map(n=>{const sc=scoreIdea(n.content);const wc=n.content.replace(/<[^>]+>/g,"").split(/\s+/).filter(Boolean).length;const mom=Math.min(100,Math.round(wc*3+parseFloat(sc.overall)*6));const opp=Math.round((parseInt(sc.market)+parseInt(sc.novelty))/2*10);return{...n,...sc,mom,opp};}).sort((a,b)=>b.mom-a.mom);
  // ── Social analytics ──
  const allMoods=[];socialN.forEach(n=>allMoods.push(...parseMoods(n.content)));
  const moodAvg=allMoods.length?allMoods.reduce((s,m)=>s+m.mood,0)/allMoods.length:0;
  const moodStd=allMoods.length>1?Math.sqrt(allMoods.reduce((s,m)=>s+Math.pow(m.mood-moodAvg,2),0)/allMoods.length):0;
  const moodVolatility=Math.round(moodStd*25);
  const moodTrend=allMoods.length>=2?allMoods[allMoods.length-1].mood-allMoods[0].mood:0;
  const moodTrendLbl=moodTrend>0.5?"Improving":moodTrend<-0.5?"Declining":"Stable";
  const MC2={1:T.red,2:T.amber,3:T.blue,4:T.a1,5:T.cyan};
  // ── Weekly overall ──
  const wkScores=[dScore,avgMastery,energyIdx,fHealthScore].filter(s=>s>0);
  const weekScore=wkScores.length?Math.round(wkScores.reduce((a,b)=>a+b,0)/wkScores.length):0;
  // ── Reusable mini-components ──
  const IBox=({icon,text})=>(<div style={{...S.glassAccent,padding:"8px 12px",display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}><span style={{fontSize:14,flexShrink:0}}>{icon}</span><div style={{fontSize:12,color:T.txt3,lineHeight:1.5}}>{text}</div></div>);
  const ABox=({text})=>(<div style={{...S.glass,padding:"8px 12px",borderLeft:`3px solid ${T.a2}`,marginBottom:6}}><div style={{fontSize:10,color:T.a2,fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",marginBottom:2}}>Recommended Action</div><div style={{fontSize:12,color:T.txt,lineHeight:1.5}}>{text}</div></div>);
  return(<div style={{padding:20,overflowY:"auto",flex:1}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h2 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,margin:0}}>Intelligence Summary</h2>
      {geminiKey&&<button onClick={gen} style={{padding:"5px 14px",borderRadius:6,border:"none",background:"var(--t-btn)",color:"var(--t-btn-txt)",fontSize:11,fontWeight:600,cursor:"pointer"}}>{ld?"...":"AI Deep Dive"}</button>}
    </div>
    {/* Weekly Intelligence Card */}
    <div style={{...S.glassAccent,padding:16,marginBottom:16,borderRadius:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div><div style={S.sh}>Weekly Intelligence</div><div style={{fontSize:11,color:T.txt2}}>Cross-domain performance synthesis</div></div>
        <div style={{textAlign:"right"}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,fontWeight:700,background:T.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{weekScore}</div><div style={{fontSize:9,color:T.txt2,textTransform:"uppercase"}}>Overall</div></div>
      </div>
      <div style={S.pBar}><div style={S.pFill(weekScore,T.grad)}/></div>
      <div style={{fontSize:11,color:T.txt2,margin:"6px 0 10px"}}>{weekScore>=75?"Strong week — all systems performing well":weekScore>=50?"Good progress — a few areas need attention":"Focus week — prioritise key gaps to unlock momentum"}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <div style={S.statCard}><div style={S.statN}>{dScore}</div><div style={S.statL}>Tasks</div></div>
        <div style={S.statCard}><div style={S.statN}>{avgMastery}%</div><div style={S.statL}>Mastery</div></div>
        <div style={S.statCard}><div style={S.statN}>{energyIdx}</div><div style={S.statL}>Energy</div></div>
        <div style={S.statCard}><div style={S.statN}>{fHealthScore}</div><div style={S.statL}>Finance</div></div>
        {allMoods.length>0&&<div style={S.statCard}><div style={S.statN}>{moodAvg.toFixed(1)}</div><div style={S.statL}>Mood</div></div>}
      </div>
    </div>
    {/* Tab nav */}
    <div style={{display:"flex",gap:3,marginBottom:14,flexWrap:"wrap"}}>{Object.keys(CM).map(c=><button key={c} onClick={()=>{setTab(c);setAiSum(null);}} style={S.tabBtn(tab===c)}>{CM[c].lb}</button>)}</div>
    {aiSum&&<div style={{...S.glassAccent,padding:14,marginBottom:14}}><div style={S.sh2}>AI Deep Dive</div><div style={{fontSize:13,color:T.txt3,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{aiSum}</div></div>}
    {/* ── DAILY TASKS ── */}
    {tab==="daily"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={S.statCard}><div style={S.statN}>{dScore}</div><div style={S.statL}>Productivity Score</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:dRate>=70?T.a1:dRate>=40?T.amber:T.red}}>{dRate}%</div><div style={S.statL}>Completion Rate</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.txt3}}>{dDone}/{dTotal}</div><div style={S.statL}>Done / Total</div></div>
      </div>
      <div style={S.pBar}><div style={S.pFill(dRate,dRate>=70?T.a1:dRate>=40?T.amber:T.red)}/></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.txt2,margin:"3px 0 12px"}}><span>0%</span><span>Target: 80%</span><span>100%</span></div>
      <IBox icon="↗" text={`${dDone} of ${dTotal} tasks completed this week. ${dTotal-dDone>0?`${dTotal-dDone} remaining.`:""} ${dRate>=80?"Excellent execution — top-quartile productivity.":dRate>=50?"Solid progress — push through the final stretch.":"Below target — try time-blocking remaining tasks into focused 25-min sessions."}`}/>
      <div style={{...S.glass,padding:"8px 12px",borderLeft:`3px solid ${dTotal-dDone>5?T.red:dTotal-dDone>2?T.amber:T.a1}`,marginBottom:6}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",color:dTotal-dDone>5?T.red:dTotal-dDone>2?T.amber:T.a1,marginBottom:2}}>Risk Alert</div>
        <div style={{fontSize:12,color:T.txt}}>{dTotal-dDone>5?"High — many tasks pending, ruthless prioritisation required":dTotal-dDone>2?"Medium — a few tasks still outstanding":dTotal-dDone>0?"Low — almost there!":"None — all clear!"}</div>
      </div>
      <ABox text={dTotal-dDone>0?`Complete the ${dTotal-dDone} outstanding task${dTotal-dDone>1?"s":""} — focus on the highest-impact items first, defer the rest.`:"All tasks done! Plan next week now to maintain momentum."}/>
    </div>}
    {/* ── WORK / STUDY ── */}
    {tab==="study"&&<div style={{display:"flex",gap:20}}><div style={{flex:2}}>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={S.statCard}><div style={S.statN}>{avgMastery}%</div><div style={S.statL}>Retention Score</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:atRisk.length>0?T.amber:T.a1}}>{atRisk.length}</div><div style={S.statL}>At-Risk Topics</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.txt3}}>{estHours}h</div><div style={S.statL}>To Mastery Est.</div></div>
      </div>
      <div style={S.sh}>Knowledge Radar</div>
      {Object.values(knowledge).map((info,i)=>(<div key={i} style={{...S.glass,padding:12,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600}}>{info.name}</span><span style={{fontSize:12,color:T.a1,fontFamily:"'JetBrains Mono',monospace"}}>{info.pct}%</span></div>
        <div style={S.pBar}><div style={S.pFill(info.pct,info.pct>70?T.a1:info.pct>40?T.amber:T.red)}/></div>
        <div style={{fontSize:11,color:T.txt2,marginTop:2}}>{info.found}/{info.total} concepts covered</div>
        {info.pct<50&&<div style={{fontSize:10,color:T.amber,marginTop:3}}>Forgetting risk — schedule a review session soon</div>}
        {info.missing.length>0&&<div style={{marginTop:4}}><span style={{fontSize:11,color:T.amber}}>Gaps: </span><span style={{fontSize:11,color:T.txt3}}>{info.missing.join(", ")}</span></div>}
      </div>))}
      <IBox icon="→" text={`Average mastery: ${avgMastery}%. ${atRisk.length>0?`${atRisk.length} topic${atRisk.length>1?"s":""} below 50% — high forgetting risk.`:"All topics above 50% — good retention baseline."} Estimated ${estHours}h to close remaining concept gaps.`}/>
      <ABox text={weakest?`Prioritise ${weakest.name} (${weakest.pct}%) — review "${weakest.missing?.[0]||"key concepts"}" first using spaced repetition (20 min sessions, every 2 days).`:"Maintain weekly reviews to prevent knowledge decay."}/>
    </div><div style={{flex:1}}>
      <div style={S.sh}>Next Topics</div>
      {nxt.map((nt,i)=>(<div key={i} style={{...S.glass,padding:10,marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:600}}>{nt.topic}</div>
        <div style={{fontSize:11,color:T.txt2,margin:"2px 0 6px"}}>{nt.subject} ({nt.curPct}%)</div>
        <div style={{display:"flex",gap:5}}><button onClick={()=>onAddTopic(nt)} style={{padding:"3px 9px",borderRadius:6,border:"none",background:"var(--t-btn)",color:"var(--t-btn-txt)",fontSize:11,cursor:"pointer"}}>Add</button><a href={nt.video} target="_blank" rel="noopener noreferrer" style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${T.border}`,color:T.a2,fontSize:11,textDecoration:"none"}}>Watch</a></div>
      </div>))}
    </div></div>}
    {/* ── HEALTH ── */}
    {tab==="health"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={S.statCard}><div style={S.statN}>{energyIdx}</div><div style={S.statL}>Energy Index</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:consistScore>=70?T.a1:consistScore>=40?T.amber:T.red}}>{consistScore}</div><div style={S.statL}>Consistency Score</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.txt3}}>{avgCal||"—"}</div><div style={S.statL}>Avg Cal / Day</div></div>
      </div>
      {Object.keys(calD).length>0&&<div style={{display:"flex",gap:6,alignItems:"flex-end",marginBottom:12,height:90,paddingTop:10}}>
        {Object.entries(calD).map(([d,c])=><div key={d} style={{flex:1,textAlign:"center"}}>
          <div style={{height:Math.max(8,Math.round(c/18)),background:Math.abs(c-TARGET_CAL)<200?T.a1:Math.abs(c-TARGET_CAL)<400?T.amber:T.red,borderRadius:"5px 5px 0 0"}}/>
          <div style={{fontSize:9,color:T.txt2,marginTop:2}}>{d.slice(0,3)}</div>
          <div style={{fontSize:9,color:T.txt3}}>{c}</div>
        </div>)}
      </div>}
      {bestDay&&<div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.a1}}>{bestDay[0]}</div><div style={S.statL}>Best Day</div></div>
        {worstDay&&worstDay[0]!==bestDay[0]&&<div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.red}}>{worstDay[0]}</div><div style={S.statL}>Needs Work</div></div>}
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.amber}}>{calStd>0?`±${calStd}`:"—"}</div><div style={S.statL}>Cal Variance</div></div>
      </div>}
      <IBox icon="↗" text={`Average ${avgCal||"—"} cal/day vs ${TARGET_CAL} target. ${energyIdx>=80?"Energy well-balanced — great nutritional discipline.":energyIdx>=60?"Moderate alignment — a few off days pulling the average.":"Significant deviation from target — review meal structure."} Consistency score: ${consistScore}/100 (variance ±${calStd} cal).`}/>
      <ABox text={consistScore<60?"Aim for consistent calorie intake — meal prepping 2-3 days ahead significantly reduces day-to-day variance.":energyIdx<65?`Adjust portions closer to ${TARGET_CAL} cal/day. ${avgCal>TARGET_CAL?"Consider reducing high-calorie meals on weekends.":"Ensure adequate fuelling, especially on training days."}`:"Great consistency! Focus on meal quality, macro split, and protein targets next."}/>
    </div>}
    {/* ── PLANNING / FINANCE ── */}
    {tab==="plan"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={S.statCard}><div style={S.statN}>{fHealthScore}</div><div style={S.statL}>Financial Health</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:burnRate>80?T.red:burnRate>60?T.amber:T.a1}}>{burnRate}%</div><div style={S.statL}>Burn Rate</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:fSaved>=0?T.a1:T.red}}>{fSaved>=0?"+":""}{fSaved}</div><div style={S.statL}>Net Saved</div></div>
      </div>
      {planN.map((n,i)=>{const bg=parseBudget(n.content);if(!bg.income)return null;const rem=bg.income-bg.total;const bRate=Math.round(bg.total/bg.income*100);return <div key={i} style={{marginBottom:16}}>
        <div style={S.sh}>{n.title}</div>
        <div style={S.pBar}><div style={S.pFill(bRate,bRate>80?T.red:bRate>60?T.amber:T.a1)}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.txt2,margin:"3px 0 8px"}}><span>{bRate}% of income spent</span><span style={{color:rem>=0?T.a1:T.red}}>{rem>=0?"Saved: "+rem:"Over by: "+Math.abs(rem)}</span></div>
        {Object.entries(bg.expenses).sort((a,b)=>b[1]-a[1]).map(([c,a])=><div key={c} style={{marginBottom:5}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span>{c}</span><span style={{color:T.amber}}>{a} <span style={{fontSize:9,color:T.txt2}}>({Math.round(a/bg.income*100)}%)</span></span></div>
          <div style={S.pBar}><div style={S.pFill(a/bg.income*100,T.amber)}/></div>
        </div>)}
      </div>;})}
      {topExp&&<IBox icon="→" text={`Top expense: ${topExp[0]} at ${topExp[1]}. Overall burn rate ${burnRate}% of income. ${burnRate>80?"Warning: high spend — review discretionary costs immediately.":burnRate>60?"Moderate spend — small cuts could significantly boost savings.":"Healthy financial discipline — well within budget."}`}/>}
      <ABox text={burnRate>80?`Reduce discretionary spend urgently. A ${Math.max(0,burnRate-70)}pp reduction brings burn rate to a sustainable 70%.`:burnRate>60?`Good control. Trim ${topExp?.[0]||"top expense"} by 10-15% to boost monthly savings.`:"Excellent! Deploy surplus savings into index funds or grow your emergency buffer."}/>
    </div>}
    {/* ── IDEAS ── */}
    {tab==="idea"&&<div>
      {ideaScored.length>0&&<div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={S.statCard}><div style={S.statN}>{ideaScored[0].mom}</div><div style={S.statL}>Top Momentum</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.blue}}>{ideaScored[0].opp}</div><div style={S.statL}>Opportunity Score</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:T.txt3}}>{ideaScored.length}</div><div style={S.statL}>Ideas Tracked</div></div>
      </div>}
      {ideaScored.map((n,i)=><div key={i} style={{...S.glass,padding:12,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div><div style={{fontSize:14,fontWeight:600}}>#{i+1} {n.title}</div><div style={{fontSize:10,color:T.txt2,marginTop:1}}>Created {n.created}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:"'JetBrains Mono',monospace",color:T.a1,fontWeight:700,fontSize:16}}>{n.overall}/10</div><div style={{fontSize:9,color:T.txt2}}>Overall</div></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <div style={{flex:1}}><div style={{fontSize:9,color:T.txt2,marginBottom:2}}>Momentum {n.mom}</div><div style={S.pBar}><div style={S.pFill(n.mom,T.a1)}/></div></div>
          <div style={{flex:1}}><div style={{fontSize:9,color:T.txt2,marginBottom:2}}>Opportunity {n.opp}</div><div style={S.pBar}><div style={S.pFill(n.opp,T.blue)}/></div></div>
          <div style={{flex:1}}><div style={{fontSize:9,color:T.txt2,marginBottom:2}}>Feasibility {parseInt(n.feasibility)*10}</div><div style={S.pBar}><div style={S.pFill(parseInt(n.feasibility)*10,T.cyan)}/></div></div>
        </div>
      </div>)}
      {ideaScored.length>0&&<>
        <IBox icon="↗" text={`${ideaScored.length} idea${ideaScored.length>1?"s":""} tracked. "${ideaScored[0].title}" leads with ${ideaScored[0].mom}/100 momentum. ${ideaScored[0].opp>60?"Strong market opportunity — time to validate with real users.":ideaScored[0].opp>30?"Moderate opportunity — sharpen the market thesis.":"Refocus on the problem statement and target user."}`}/>
        <ABox text={`Next step for "${ideaScored[0].title}": ${parseInt(ideaScored[0].feasibility)>=7?"Build a lightweight MVP to test your core hypothesis with real users.":parseInt(ideaScored[0].market)>=7?"Run 5 customer discovery interviews to validate the market need.":"Deepen problem analysis — map the pain points and who feels them most."}`}/>
      </>}
      {ideaScored.length===0&&<div style={{padding:20,textAlign:"center",color:T.txt2,fontSize:13}}>Add ideas notes to see momentum analytics.</div>}
    </div>}
    {/* ── SOCIAL ── */}
    {tab==="social"&&(allMoods.length>0?<div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={S.statCard}><div style={S.statN}>{moodAvg.toFixed(1)}/5</div><div style={S.statL}>Avg Mood</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:moodVolatility>50?T.amber:T.a1}}>{moodVolatility}</div><div style={S.statL}>Volatility</div></div>
        <div style={S.statCard}><div style={{...S.statN,WebkitTextFillColor:moodTrend>0?T.a1:moodTrend<0?T.red:T.txt3}}>{moodTrendLbl}</div><div style={S.statL}>Trend</div></div>
      </div>
      <div style={{display:"flex",gap:4,alignItems:"flex-end",marginBottom:12,height:80}}>
        {allMoods.map((m,i)=><div key={i} style={{flex:1,textAlign:"center"}}>
          <div style={{height:m.mood*14,background:MC2[m.mood],borderRadius:"5px 5px 0 0",minHeight:8,transition:"height .3s"}}/>
          <div style={{fontSize:9,color:T.txt2,marginTop:2}}>{m.day}</div>
        </div>)}
      </div>
      <IBox icon="→" text={`Mood averaged ${moodAvg.toFixed(1)}/5 across ${allMoods.length} data points. Trend: ${moodTrendLbl}. ${moodVolatility>50?"High emotional volatility — identify recurring stress triggers.":"Stable emotional baseline — good mental equilibrium."}`}/>
      <ABox text={moodTrend<-0.5?"Identify what shifted your mood downward. A quick end-of-day journal entry can surface patterns before they compound.":moodVolatility>50?"Anchor daily routines — consistent sleep, exercise, and one meaningful social interaction per day reduces volatility.":"Mood is in a great place! Capture what's working — these habits are worth protecting."}/>
      <div style={{...S.glass,padding:12,marginTop:10}}><div style={S.sh2}>Reflection Prompt</div><div style={{fontSize:13,color:T.txt3,lineHeight:1.6,fontStyle:"italic"}}>{moodAvg>=4?"What interactions or activities energised you most this week? How can you do more of them next week?":moodAvg>=3?"What was one moment this week that shifted your mood — positively or negatively? What triggered it?":"What's one small, concrete action you could take tomorrow to improve how you feel?"}</div></div>
    </div>:<div style={{padding:20,textAlign:"center",color:T.txt2,fontSize:13}}>Add social or journal notes with daily mood entries to see analytics.</div>)}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 11: REVIEWS (compact)
// ══════════════════════════════════════════════════════════════
function ReviewsPage({reviews,preferences,onSubmit}){
  const[item,setItem]=useState("");const[cat,setCat]=useState("health");const[rating,setRating]=useState(3);const[likes,setLikes]=useState("");const[dislikes,setDislikes]=useState("");
  const submit=()=>{if(!item.trim())return;onSubmit({cat,item:item.trim(),rating,likes:likes.split(",").map(s=>s.trim()).filter(Boolean),dislikes:dislikes.split(",").map(s=>s.trim()).filter(Boolean),date:new Date().toISOString().slice(0,10)});setItem("");setLikes("");setDislikes("");setRating(3);};
  const inp={padding:"6px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.glass,color:T.txt,fontSize:12,outline:"none",width:"100%",fontFamily:"'Inter',sans-serif"};
  return(<div style={{padding:20,overflowY:"auto",flex:1}}>
    <h2 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,margin:"0 0 12px"}}>Reviews</h2>
    <div style={{...S.glass,padding:14,marginBottom:12}}>
      <div style={{display:"flex",gap:6,marginBottom:6}}><select value={cat} onChange={e=>setCat(e.target.value)} style={{...inp,width:"auto",cursor:"pointer"}}>{Object.entries(CM).map(([k,v])=><option key={k} value={k}>{v.lb}</option>)}</select><input value={item} onChange={e=>setItem(e.target.value)} placeholder="What?" style={inp}/></div>
      <div style={{display:"flex",gap:3,marginBottom:6}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRating(n)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:700,background:n<=rating?"var(--t-btn)":T.glass,color:n<=rating?"#fff":T.txt2}}>{n}</button>)}</div>
      <div style={{display:"flex",gap:6,marginBottom:6}}><input value={likes} onChange={e=>setLikes(e.target.value)} placeholder="Liked?" style={inp}/><input value={dislikes} onChange={e=>setDislikes(e.target.value)} placeholder="Disliked?" style={inp}/></div>
      <button onClick={submit} style={{padding:"7px 18px",borderRadius:7,border:"none",background:"var(--t-btn)",color:"#fff",fontWeight:600,fontSize:12,cursor:"pointer",width:"100%"}}>Submit</button>
    </div>
    {[...reviews].reverse().map((r,i)=><div key={i} style={{...S.glass,padding:10}}><div style={{display:"flex",justifyContent:"space-between"}}><div><span style={S.tag(r.cat)}>{CM[r.cat]?.lb}</span><div style={{fontWeight:600,marginTop:2,fontSize:12}}>{r.item}</div></div><span style={{fontFamily:"'JetBrains Mono',monospace",color:T.a1}}>{r.rating}/5</span></div></div>)}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 12: MAIN APP
// ══════════════════════════════════════════════════════════════
export default function App(){
  const[folders,setFolders]=useState(INIT_FOLDERS);const[notes,setNotes]=useState(INIT_NOTES);
  const[activeNote,setActiveNote]=useState("s2");const[activeFolder,setActiveFolder]=useState("mban");
  const[viewMode,setViewMode]=useState(null); // null=note, "parent:id", "folder:id"
  const[page,setPage]=useState("notes");const[showAI,setShowAI]=useState(true);const[showFiles,setShowFiles]=useState(false);
  const[reviews,setReviews]=useState(INIT_REVIEWS);const[prefs,setPrefs]=useState({health:{likes:["quick","high protein"],dislikes:["too salty"]}});
  const[ghostData,setGhostData]=useState(null);const[ghostLoading,setGhostLoading]=useState(false);
  const[ytResults,setYtResults]=useState([]);const[ytLoading,setYtLoading]=useState(false);const[aiInsight,setAiInsight]=useState(null);
  const[uploadedFiles,setUploadedFiles]=useState([]);const[fileSearch,setFileSearch]=useState("");
  const[isDark,setIsDark]=useState(true);
  const timerRef=useRef(null);const ytRef=useRef(null);
  useEffect(()=>{
    let s=document.getElementById("nt-theme");
    if(!s){s=document.createElement("style");s.id="nt-theme";document.head.appendChild(s);}
    s.textContent=`:root{${isDark?DARK_CSS:LIGHT_CSS}}body,#root{background:var(--t-bg)}`;
  },[isDark]);

  const active=notes[activeNote];
  const knowledge=useMemo(()=>calcKnow(notes),[notes]);
  const videos=useMemo(()=>active?getVideos(active.content||""):[],[active?.content]);

  const handleChange=useCallback(html=>{
    setNotes(p=>({...p,[activeNote]:{...p[activeNote],content:html}}));
    if(timerRef.current)clearTimeout(timerRef.current);
    timerRef.current=setTimeout(async()=>{
      const plain=html.replace(/<[^>]+>/g,"");if(plain.length<15)return;
      const pLines=plain.split("\n").filter(l=>l.trim());const ctx=`Note: "${active?.title||""}"

${pLines.slice(-8).join("\n")}`;
      if(GEMINI_KEY){setGhostLoading(true);const r=await geminiComplete(ctx,GEMINI_KEY);setGhostData(r||getGhost(html));setGhostLoading(false);}
      else{setGhostData(getGhost(html));}
    },800);
    if(ytRef.current)clearTimeout(ytRef.current);
    ytRef.current=setTimeout(async()=>{
      if(!YOUTUBE_KEY)return;const plain=html.replace(/<[^>]+>/g,"");if(plain.length<20)return;
      const q=plain.split("\n").filter(l=>l.trim()).slice(-2).join(" ").slice(0,80);if(q.length<8)return;
      setYtLoading(true);const r=await ytSearch(q+" tutorial",YOUTUBE_KEY,3);setYtResults(r);setYtLoading(false);
    },1500);
    if(GEMINI_KEY&&html.replace(/<[^>]+>/g,"").length>100){setTimeout(async()=>{const r=await geminiAnalyze(html,"Most important takeaway? One sentence.",GEMINI_KEY);setAiInsight(r);},3000);}
  },[activeNote]);

  const acceptGhost=useCallback(()=>{setGhostData(null);},[]);

  const selectNote=id=>{setActiveNote(id);setViewMode(null);setGhostData(null);setYtResults([]);setAiInsight(null);setPage("notes");};
  const selectParent=id=>{setViewMode("parent:"+id);setActiveNote(id);setPage("notes");};
  const selectFolderView=fid=>{setViewMode("folder:"+fid);setPage("notes");};
  const createNote=(title,fid)=>{const id=`n_${Date.now()}`;setNotes(p=>({...p,[id]:{title,cat:"study",content:"",created:new Date().toISOString().slice(0,10)}}));setFolders(p=>p.map(f=>f.id===fid?{...f,notes:[...f.notes,id]}:f));selectNote(id);};
  const createFolder=name=>{setFolders(p=>[...p,{id:`f_${Date.now()}`,name,notes:[]}]);};
  const addLesson=(pid,title)=>{const id=`${pid}_l${Date.now()}`;setNotes(p=>{const pn=p[pid];return{...p,[pid]:{...pn,children:[...(pn.children||[]),id]},[id]:{title,cat:pn.cat,created:new Date().toISOString().slice(0,10),parent:pid,content:""}};});};
  const addTopic=nt=>{const tid=nt.tn;if(!notes[tid])return;setNotes(p=>({...p,[tid]:{...p[tid],content:(p[tid].content||"")+`<h3 style="color:var(--t-blue)">${nt.topic}</h3><p>${nt.desc}</p><p><a href="${nt.video}" target="_blank" style="color:var(--t-a2)">Watch \u2192</a></p>`}}));selectNote(tid);};
  const submitReview=r=>{setReviews(p=>[...p,r]);setPrefs(p=>{const cp={...p};if(!cp[r.cat])cp[r.cat]={likes:[],dislikes:[]};const c={...cp[r.cat],likes:[...cp[r.cat].likes],dislikes:[...cp[r.cat].dislikes]};r.likes.forEach(l=>{if(!c.likes.includes(l))c.likes.push(l);});r.dislikes.forEach(d=>{if(!c.dislikes.includes(d))c.dislikes.push(d);});return{...cp,[r.cat]:c};});};
  const handleShowFiles=()=>{const sel=window.getSelection()?.toString()||"";setFileSearch(sel);setShowFiles(true);setShowAI(false);};

  const folderName=folders.find(f=>f.notes.includes(activeNote)||f.notes.some(nid=>notes[nid]?.children?.includes(activeNote)))?.name||"";

  // Build combined view items
  let combinedTitle="",combinedItems=[],combinedParentId=null;
  if(viewMode?.startsWith("parent:")){
    const pid=viewMode.slice(7);const pn=notes[pid];
    if(pn?.children){combinedTitle=pn.title;combinedParentId=pid;combinedItems=(pn.children||[]).map(id=>({id,...notes[id]})).filter(Boolean).sort((a,b)=>(a.created||"").localeCompare(b.created||""));}
  }else if(viewMode?.startsWith("folder:")){
    const fid=viewMode.slice(7);const folder=folders.find(f=>f.id===fid);
    if(folder){combinedTitle=folder.name;
      folder.notes.forEach(nid=>{const n=notes[nid];if(!n)return;
        if(n.children){n.children.forEach(cid=>{if(notes[cid])combinedItems.push({id:cid,...notes[cid]});});}
        else if(!n.parent){combinedItems.push({id:nid,...n});}
      });combinedItems.sort((a,b)=>(a.created||"").localeCompare(b.created||""));}
  }

  return(<div style={S.app}>
    <Sidebar folders={folders} notes={notes} activeNote={activeNote} activeFolder={activeFolder}
      onSelect={selectNote} onSelectFolder={setActiveFolder} onCreate={createNote} onCreateFolder={createFolder} onSelectParent={selectParent} onSelectFolderView={selectFolderView}/>
    <div style={S.main}>
      <div style={S.topBar}>
        <button style={S.tabBtn(page==="notes")} onClick={()=>setPage("notes")}>Notes</button>
        <button style={S.tabBtn(page==="summary")} onClick={()=>setPage("summary")}>Summary</button>
        <button style={S.tabBtn(page==="reviews")} onClick={()=>setPage("reviews")}>Reviews</button>
        <div style={{flex:1}}/>
        <button onClick={()=>setIsDark(d=>!d)} style={{padding:"4px 12px",borderRadius:7,border:`1px solid ${T.border}`,background:T.glass,color:T.txt,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginRight:4}}>{isDark?"Dark":"Light"}</button>
        <div style={{display:"flex",gap:6,alignItems:"center",marginRight:8}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:GEMINI_KEY?T.a1:"var(--t-dot-off)"}}/>
          <span style={{fontSize:10,color:T.txt2}}>Gemini</span>
          <span style={{width:6,height:6,borderRadius:"50%",background:YOUTUBE_KEY?T.a1:"var(--t-dot-off)"}}/>
          <span style={{fontSize:10,color:T.txt2}}>YT</span>
        </div>
        {page==="notes"&&!viewMode&&<>
          <button style={{...S.tabBtn(false),fontSize:11,color:showFiles?T.a2:T.txt2}} onClick={()=>{setShowFiles(!showFiles);if(!showFiles)setShowAI(false);else setShowAI(true);}}>{showFiles?"Hide Files":"Files"}</button>
          <button style={{...S.tabBtn(false),fontSize:11,color:T.txt2}} onClick={()=>{setShowAI(!showAI);if(showAI)setShowFiles(false);}}>{showAI?"Hide AI":"Show AI"}</button>
        </>}
      </div>
      {page==="notes"&&viewMode&&<CombinedView title={combinedTitle} items={combinedItems} onSelect={selectNote} onAddLesson={t=>combinedParentId&&addLesson(combinedParentId,t)} parentId={combinedParentId} onChangeNote={(id,html)=>setNotes(p=>({...p,[id]:{...p[id],content:html}}))}/>}
      {page==="notes"&&!viewMode&&active&&(
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"10px 14px"}}>
            <div style={{marginBottom:6}}>
              <span style={{fontSize:10,color:T.txt2}}>{folderName} / {active.created}</span>
              {active.parent&&<span style={{fontSize:10,color:T.a2,marginLeft:6,cursor:"pointer"}} onClick={()=>selectParent(active.parent)}>{"\u2190"} {notes[active.parent]?.title}</span>}
              <h2 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:19,margin:"2px 0 3px",color:T.txt}}>{active.title}</h2>
              <span style={S.tag(active.cat)}>{CM[active.cat]?.lb}</span>
            </div>
            <RichEditor key={activeNote} content={active.content} onChange={handleChange} ghostData={ghostData} onAcceptGhost={acceptGhost} noteId={activeNote} loading={ghostLoading} onShowFiles={handleShowFiles}/>
          </div>
          {showFiles&&<FilePanel files={uploadedFiles} onUpload={f=>setUploadedFiles(p=>[...p,f])} onClose={()=>{setShowFiles(false);setShowAI(true);}} searchText={fileSearch}/>}
          {showAI&&!showFiles&&<SugPanel videos={videos} ytResults={ytResults} knowledge={active.cat==="study"?knowledge:null} cat={active.cat} prefs={prefs[active.cat]} aiInsight={aiInsight} loadingYT={ytLoading}/>}
        </div>
      )}
      {page==="notes"&&!viewMode&&!active&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><h1 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28}}>Notiq</h1><p style={{color:T.txt2}}>Select or create a note.</p></div></div>}
      {page==="summary"&&<SummaryPage notes={notes} knowledge={knowledge} onAddTopic={addTopic} geminiKey={GEMINI_KEY}/>}
      {page==="reviews"&&<ReviewsPage reviews={reviews} preferences={prefs} onSubmit={submitReview}/>}
    </div>
  </div>);
}
