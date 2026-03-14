// ══════════════════════════════════════════════════════════════
// NOTIQ v4 — AI Notes · Claude / Gemini · YouTube · Files · Sub-notes
// ══════════════════════════════════════════════════════════════
//
// ┌───────────────────────────────────────────────────────────┐
// │  PASTE YOUR API KEYS HERE (line 10-11)                   │
// └───────────────────────────────────────────────────────────┘
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";    // ← set in .env as VITE_GEMINI_KEY
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY || ""; // ← set in .env as VITE_ANTHROPIC_KEY
const AI_KEY = ANTHROPIC_KEY || GEMINI_KEY; // prefer Anthropic, fallback to Gemini
const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_KEY || "";   // ← set in .env as VITE_YOUTUBE_KEY
//
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";

// ══════════════════════════════════════════════════════════════
// SECTION 1: THEME
// ══════════════════════════════════════════════════════════════
// Dark: lifted navy bg, better contrast, softer borders
const DARK_CSS=`
  --t-bg:#0f1117;--t-bg2:#151720;--t-bg3:#1a1d28;
  --t-glass:rgba(255,255,255,.04);--t-glassH:rgba(255,255,255,.08);--t-border:rgba(255,255,255,.08);
  --t-a1:#7b93f5;--t-a2:#b0bec5;--t-a3:#8492a6;
  --t-txt:#f1f5f9;--t-txt2:#8492a6;--t-txt3:#b0bec5;
  --t-red:#ff6b6b;--t-amber:#fbbf24;--t-blue:#7b93f5;--t-purple:#9571cd;--t-cyan:#22d3ee;--t-pink:#f0abfc;
  --t-grad:linear-gradient(135deg,#7b93f5,#9571cd);
  --t-btn:linear-gradient(135deg,#7b93f5,#9571cd);
  --t-btn-txt:#ffffff;
  --t-sidebar:linear-gradient(180deg,#0c0e15,#0f1117,#0e1018);
  --t-tab-active:rgba(123,147,245,.14);
  --t-note-active:rgba(123,147,245,.12);
  --t-glass-accent:rgba(123,147,245,.08);
  --t-panel:rgba(255,255,255,.03);
  --t-pbar:rgba(255,255,255,.08);
  --t-dot-off:rgba(255,255,255,.2);
  --t-topbar:rgba(255,255,255,.03);
`;
// Light: soft white bg, dark slate text, blue-purple accents
const LIGHT_CSS=`
  --t-bg:#fafbfe;--t-bg2:#f3f4f8;--t-bg3:#eceef4;
  --t-glass:rgba(0,0,0,.03);--t-glassH:rgba(0,0,0,.06);--t-border:rgba(0,0,0,.1);
  --t-a1:#5b6fd6;--t-a2:#475569;--t-a3:#64748b;
  --t-txt:#1e293b;--t-txt2:#475569;--t-txt3:#334155;
  --t-red:#dc2626;--t-amber:#d97706;--t-blue:#5b6fd6;--t-purple:#6b4f9e;--t-cyan:#0891b2;--t-pink:#7c3aed;
  --t-grad:linear-gradient(135deg,#5b6fd6,#6b4f9e);
  --t-btn:linear-gradient(135deg,#5b6fd6,#6b4f9e);
  --t-btn-txt:#ffffff;
  --t-sidebar:linear-gradient(180deg,#f3f4f8,#eceef4,#e8eaf2);
  --t-tab-active:rgba(91,111,214,.12);
  --t-note-active:rgba(91,111,214,.1);
  --t-glass-accent:rgba(91,111,214,.06);
  --t-panel:rgba(0,0,0,.02);
  --t-pbar:rgba(0,0,0,.08);
  --t-dot-off:rgba(0,0,0,.2);
  --t-topbar:#ffffff;
`;
const T={bg:"var(--t-bg)",bg2:"var(--t-bg2)",bg3:"var(--t-bg3)",glass:"var(--t-glass)",glassH:"var(--t-glassH)",border:"var(--t-border)",a1:"var(--t-a1)",a2:"var(--t-a2)",a3:"var(--t-a3)",txt:"var(--t-txt)",txt2:"var(--t-txt2)",txt3:"var(--t-txt3)",red:"var(--t-red)",amber:"var(--t-amber)",blue:"var(--t-blue)",purple:"var(--t-purple)",cyan:"var(--t-cyan)",pink:"var(--t-pink)",grad:"var(--t-grad)"};
const CM = {
  daily:{lb:"Daily Tasks",color:T.a1,bg:"rgba(232,121,168,.1)"},study:{lb:"Work / Study",color:T.blue,bg:"rgba(139,233,253,.1)"},
  health:{lb:"Health & Fitness",color:T.pink,bg:"rgba(255,121,198,.1)"},plan:{lb:"Planning & Finance",color:T.amber,bg:"rgba(255,184,108,.1)"},
  idea:{lb:"Ideas & Creativity",color:T.blue,bg:"rgba(122,191,234,.1)"},social:{lb:"Social & Memories",color:T.cyan,bg:"rgba(103,232,249,.1)"},
};

// ══════════════════════════════════════════════════════════════
// SECTION 2: DATA — with sub-notes (children/parent) + subfolders
// ══════════════════════════════════════════════════════════════
const INIT_FOLDERS = [
  {id:"academics",name:"Academics",children:[
    {id:"twd_2026",name:"Thinking With Data",notes:["twd1"]},
  ]},
  {id:"career",name:"Career & Projects",children:[
    {id:"startup",name:"RestaurantIQ Startup",notes:["n7","n8"]},
    {id:"career_dev",name:"Career Development",notes:["n9","n10"]},
  ]},
  {id:"health",name:"Health & Fitness",children:[
    {id:"training",name:"Training Program",notes:["n11","n13"]},
    {id:"nutrition_rec",name:"Nutrition & Recovery",notes:["n12","n14"]},
  ]},
  {id:"life",name:"Life & Planning",children:[
    {id:"barcelona",name:"Barcelona Living",notes:["n16","n18"]},
    {id:"productivity",name:"Productivity & Growth",notes:["n15","n17","n19","n20"]},
  ]},
];
// Folder helpers
const getAllFolderNoteIds=(f)=>{const ids=[];if(f.notes)ids.push(...f.notes);if(f.children)f.children.forEach(c=>{if(c.notes)ids.push(...c.notes);});return ids;};
const findNoteLocation=(folders,noteId)=>{for(const f of folders){if(f.children){for(const sub of f.children){if(sub.notes?.includes(noteId))return{root:f,sub};}}if(f.notes?.includes(noteId))return{root:f,sub:null};}return null;};
const findSubfolder=(folders,subId)=>{for(const f of folders){if(f.children){const sub=f.children.find(c=>c.id===subId);if(sub)return{root:f,sub};}if(f.id===subId)return{root:f,sub:null};}return null;};
// Section colors for topic detection — 2 alternating colors
const SECTION_COLORS=[
  {bg:'rgba(102,126,234,0.10)',border:'#667eea'},
  {bg:'rgba(118,75,162,0.10)',border:'#764ba2'},
];
const INIT_NOTES = {

// ── ACADEMICS ──────────────────────────────────────────────


twd1:{title:"Class 1 — Statistics: How Wrong Can We Be?",cat:"study",created:"2026-03-10",content:`<h2>Course Overview</h2>
<p><strong>Professor:</strong> Uri Simonsohn — Thinking with Data (TWD), MiBA 2025/2026</p>
<h3>Three Bins of Content</h3>
<p><strong>Bin 1</strong> — Intuitive understanding of data analytical concepts (e.g., What IS p-hacking?)<br/>
<strong>Bin 2</strong> — Statistical procedures (e.g., What is the false-positive rate?)<br/>
<strong>Bin 3</strong> — Doing things in R (e.g., Monte Carlo simulations)</p>
<h3>Full Topic List</h3>
<p>1. Statistics is about how wrong we may be (this class)<br/>2. Multiple comparisons and p-hacking<br/>3. Statistical challenges with A/B Testing<br/>4. Evaluating interventions & regression to the mean<br/>5. Getting from correlation to causation<br/>6. Regression pitfalls and alternatives (GAM)<br/>7. Thinking without data</p>
<h3>Grading</h3>
<p>Quiz 1: 35% (days 1–4), Quiz 2: 35% (days 5–8), Participation + TWARKing can modify grades.</p>

<h2>A/B Testing Introduction</h2>
<p>A/B tests are corporate experiments. You randomly <strong>assign</strong> customers to treatment arms (A vs B), then measure outcomes.</p>
<h3>Random Sample vs Random Assignment</h3>
<p><strong>Random Sample:</strong> Choose observations at random from a population → gives representative sample → useful for description (polling).<br/>
<strong>Random Assignment:</strong> Assign observations at random to conditions A or B → gives causal inference → tells you what CAUSED the difference. This is what A/B testing does.</p>
<h3>When Do Companies Run A/B Tests?</h3>
<p><strong>Mostly:</strong> Fine-tuning small decisions before rollout (€5 off vs €4.99 off, subject line A vs B).<br/>
<strong>Seldom (but more valuable):</strong> Testing big strategic decisions (buy Google ads vs don't, fixed pricing vs pay-what-you-want, WFH vs office only).</p>
<p>Professor's opinion: There are big returns to A/B testing CLOSER to what academics want — testing bigger, strategic decisions rather than just button colours.</p>

<h3>Real A/B Test Examples</h3>
<p><strong>Example 1 — Uber Apologies:</strong> After top-5% delay rides, riders randomly got: (A) nothing, (B) apology, (C) $5 promo, (D) both. Measured revenue per customer over next month.</p>
<p><strong>Example 2 — Chilean Supermarket:</strong> Does offering 30% discount now make future 10% discounts less effective? Treatment period (5 weeks) with 30% vs 10%, then testing period with 10% on other products.</p>
<p><strong>Example 3 — US Mobile Operator:</strong> Can proactive calls prevent churn? Control (N=10,058) vs Treatment call (N=54,089). Result: calling customers reminded them to think about their plan — some switched to competitors. The call caused MORE churn. Lesson: A/B tests can reveal your "solution" makes things worse.</p>

<h2>The T-Test</h2>
<p>Step 1: Compute mean of A → M(A)<br/>Step 2: Compute mean of B → M(B)<br/>Step 3: Difference = M(B) − M(A)<br/>Step 4: How likely could random noise produce this difference if no real effect?<br/>Step 5: T-test gives you that probability → the <strong>p-value</strong>.</p>
<h3>Common (Wrong) Usage</h3>
<p>If p < .05 → "It worked, implement B." If p > .05 → "It failed, A = B." Both conclusions are often incorrect.</p>
<h3>Netflix Example</h3>
<p>Netflix tested showing % thumbs-up ratings on thumbnails. Result: <strong>p = .011, CI = [1.1, 8.2]</strong>. Even academic papers misuse p-values — some journals have banned them entirely.</p>

<h2>Track Record Analogy — Intuition for P and CI</h2>
<p>The fundamental equation of statistics: <strong>Estimate = Truth + Error</strong></p>
<p>We observe the estimate, want to know the truth, need to guess the error. Statistics quantifies how wrong an estimate could be.</p>
<h3>The Larry Analogy</h3>
<p>Larry (senior marketing guy) predicts +9 minutes increase. How wrong could he be? Look at his track record.</p>
<p><strong>Version 1 (small errors):</strong> Errors of +3, -1, -2, +4, -3. His prediction is credible — act on it.</p>
<p><strong>Version 2 (large errors):</strong> Errors of -8, +28, -25, -41, +23. His prediction could easily be completely wrong — don't act confidently.</p>
<h3>How This Maps to P and CI</h3>
<p><strong>P-value:</strong> Take the estimate. Ask: what if the error is so large the true effect is zero? How likely is that scenario? If p < .05 → that scenario is unlikely.</p>
<p><strong>Confidence Interval:</strong> Take the estimate. Add/subtract the biggest plausible error (top 5%). CI = Estimate ± top-5%-error. Tells you the range of values you cannot rule out.</p>
<p>Netflix: p = .011 means 1.1% chance of an error this large if true effect were zero. CI = [1.1, 8.2] means you can't rule out effects between 1.1 and 8.2 minutes.</p>

<h2>Linking P and CI</h2>
<p>P and CI are two sides of the same coin.</p>
<p>If 0 is INSIDE the CI → cannot rule out zero effect → p > .05<br/>
If 0 is OUTSIDE the CI → can rule out zero → p < .05</p>
<p>Examples: CI = [−3, +21] → p > .05 | CI = [0, +18] → p ≈ .05 | CI = [4, 14] → p < .05</p>
<p><strong>Key insight:</strong> The more precise your data, the narrower the CI, and the more likely you are to rule out 0 if there's truly an effect.</p>

<h2>From P and CI to Decisions</h2>
<p>After an A/B test, three possible conclusions: (1) A is better, (2) B is better, (3) Still don't know — get more data.</p>
<p><strong>CIs make it easy to determine which case you're in. P-values alone do NOT.</strong></p>
<h3>Decision Logic Using CIs</h3>
<p><strong>Case 1:</strong> Worst case still pretty good (CI = [4, 14]) → implement B.<br/>
<strong>Case 2:</strong> Best case not good enough (CI = [−14, −4]) → stick with A.<br/>
<strong>Case 3:</strong> Best case great, worst case bad (CI = [−6, +20]) → get more data or weigh risks.</p>
<p>Five different A/B tests with p > .05 can have wildly different CIs — without the CI, you can't distinguish them. P > .05 alone is NOT a decision.</p>

<h2>Four Common Errors with P-Values</h2>
<h3>Error 1: p > .05 means the effect IS zero</h3>
<p>Most common and dangerous mistake. p > .05 means "we lack evidence" — NOT "we've proven no effect." Example: urology paper with CI [0.93, 1.59] includes 60%+ higher mortality at upper bound. Correct conclusion: need more data, not "no association."</p>
<h3>Error 2: Using p < .05 as the cutoff for every decision</h3>
<p>5% threshold is arbitrary (Fisher, 1926). Set your threshold based on: "How bad is it if I'm wrong?" Avis example: doubling fleet (high cost) needs very high confidence, but sending an email link (low cost) only needs moderate confidence.</p>
<h3>Error 3: p < .05 means the effect is worth pursuing</h3>
<p>Statistical significance ≠ practical significance. Standing desks: p < .0001 but effect = 0.16 cal/min = less than half an apple per school day. Practically meaningless. With big data, trivially small effects are often statistically significant.</p>
<h3>Error 4: Paying attention to imprecise estimates</h3>
<p>When CI is very wide (e.g., [−50, +70]), even the SIGN of the estimate tells you nothing. Don't get excited about the direction of a noisy estimate.</p>

<h2>Final Summary</h2>
<p>Always compute, report, and request <strong>confidence intervals</strong>. P-values are seldom useful on their own for decisions.</p>
<p><strong>Act on p > .05:</strong> When worst case (lower CI bound) is not bad, but best case is good.<br/>
<strong>Pass on p < .05:</strong> When even best case isn't appealing enough to justify cost.<br/>
<strong>Get more data:</strong> When CI spans both actionably good and actionably bad territory.</p>`},

// ── CAREER & PROJECTS ──────────────────────────────────────

n7:{title:"Startup Idea — Restaurant Analytics Platform",created:"2026-02-08",content:`<h2>RestaurantIQ — Analytics for Independent Restaurants</h2>
<p>The idea: a SaaS analytics dashboard that connects to existing POS (point-of-sale) systems and gives small/medium restaurants the same data intelligence that large chains have. Independent restaurants make up 70% of the EU market but less than 15% use any analytics tool beyond basic spreadsheets.</p>

<h3>Problem Statement</h3>
<p>Independent restaurant owners operate on thin margins (typically 3-9% net profit) and make critical decisions — menu pricing, staffing, inventory — based on gut feeling rather than data. They don't have the technical expertise or budget for enterprise analytics tools like Tableau or custom BI solutions. Most POS systems (Square, Lightspeed, SumUp) collect rich transaction data but present it in basic reports.</p>

<h3>Proposed Solution</h3>
<p>A lightweight dashboard that ingests POS data via API integrations and provides:</p>
<ul>
<li><strong>Revenue forecasting</strong>: Predict daily/weekly revenue using time-series models (ARIMA, Prophet) trained on the restaurant's own historical data plus external features (weather, local events, holidays)</li>
<li><strong>Menu optimisation</strong>: Identify high-margin items, underperformers, and optimal pricing using demand elasticity analysis. Use machine learning to suggest menu changes that maximise profit per cover</li>
<li><strong>Peak hour prediction</strong>: Forecast staffing needs by hour to reduce labour costs without hurting service quality</li>
<li><strong>Waste reduction</strong>: Track inventory vs sales to predict spoilage and optimise ordering</li>
</ul>

<h3>Market Analysis</h3>
<p>TAM: ~500K independent restaurants in the EU. If we capture 2% at €49/month, that's ~€5.9M ARR. The restaurant tech market is growing at 15% CAGR. Competitors: MarketMan (inventory focused, $239/mo — too expensive), Lightspeed Analytics (tied to their POS), Toast Analytics (US-only). Our differentiator: POS-agnostic, AI-powered predictions, affordable pricing tier for small operators.</p>

<h3>Technical Architecture</h3>
<p>Data pipeline: POS APIs → ETL (Python/Airflow) → Data warehouse (BigQuery) → ML models (scikit-learn, Prophet) → Dashboard (React + D3.js). We can leverage our <strong>machine learning</strong> coursework directly — the forecasting models use the same regression and time-series techniques. The NLP module could power menu description optimisation and review sentiment analysis.</p>

<h3>Go-to-Market</h3>
<p>Start in Barcelona — strong restaurant scene, ESADE network gives us warm introductions. Pilot with 10 restaurants for free (3 months), then convert to paid. Use case studies from pilots for content marketing. Partner with POS resellers for distribution. Consider applying to <strong>ESADE BAN</strong> (Business Angels Network) for seed funding of €150K.</p>

<p><strong>Next steps:</strong> Build MVP focusing on revenue forecasting only. Conduct 5 customer discovery interviews with restaurant owners in Eixample/Gracia. Calculate unit economics — CAC vs LTV at different price points. Review GDPR requirements for processing transaction data.</p>`},

n8:{title:"Building a SaaS MVP — Technical Decisions",created:"2026-02-11",content:`<h2>MVP Technical Stack & Architecture</h2>
<p>The goal is to build the RestaurantIQ minimum viable product in 8 weeks while keeping costs near zero. The MVP should demonstrate the core value proposition — revenue forecasting from POS data — without overengineering. Every technical decision should optimise for speed of iteration and ease of change.</p>

<h3>Frontend</h3>
<p><strong>React</strong> with Vite for the dashboard. We already know React from this project (Notiq). Use a component library like <strong>shadcn/ui</strong> to avoid building UI from scratch. For charts and data visualisation, D3.js is powerful but complex — start with <strong>Recharts</strong> (React wrapper for D3) for standard charts, only drop to raw D3 for custom visualisations. Mobile-responsive from day one — restaurant owners check dashboards on phones.</p>

<h3>Backend</h3>
<p>Python <strong>FastAPI</strong> for the REST API. Reasons: async support (important for POS API calls), automatic OpenAPI docs, type hints with Pydantic. We could use Node/Express (since we know JavaScript) but Python is better for the ML pipeline — no language switching between API and models. Authentication: <strong>Auth0</strong> free tier (7K active users). Database: <strong>PostgreSQL</strong> on Supabase free tier, which also gives us a REST API and real-time subscriptions.</p>

<h3>ML Pipeline</h3>
<p>Revenue forecasting model:</p>
<ul>
<li><strong>Data</strong>: Daily revenue, covers, average ticket, day of week, month, weather (OpenWeather API), local events (manual tagging initially)</li>
<li><strong>Model</strong>: Start with <strong>Facebook Prophet</strong> — designed for business time-series, handles seasonality, holidays, and missing data well. Baseline comparison with ARIMA and simple exponential smoothing</li>
<li><strong>Training</strong>: Per-restaurant model, retrained weekly. Minimum data requirement: 90 days of history</li>
<li><strong>Serving</strong>: Pre-compute forecasts nightly, store in PostgreSQL. No real-time inference needed for MVP</li>
</ul>

<h3>Infrastructure</h3>
<p>Deploy on <strong>Railway</strong> or <strong>Render</strong> — both have free/cheap tiers for hobby projects. Alternatively, a €5/month Hetzner VPS gives us more control. CI/CD with GitHub Actions. Monitoring: Sentry (error tracking) + basic custom metrics. Cost target: under €20/month total for the first 10 pilot restaurants.</p>

<h3>POS Integration</h3>
<p>Start with <strong>Square</strong> — best documented API, large market share in EU SMBs. Their API provides transaction-level data with timestamps, items, modifiers, and payment methods. OAuth2 flow for secure restaurant connection. Second integration: <strong>SumUp</strong> (huge in Europe). Each integration is roughly 2 weeks of development for the data sync pipeline.</p>

<h3>Budget & Timeline</h3>
<p>Week 1-2: Auth, database schema, Square API integration. Week 3-4: Data pipeline, basic dashboard with historical charts. Week 5-6: Forecasting model training and serving. Week 7-8: Polish, onboard first pilot restaurant. Total cash cost: ~€40 (domains + one month of hosting). Time cost: ~20 hours/week alongside coursework.</p>

<p><em>This connects directly to our finance coursework (NPV analysis for startup viability) and our machine learning modules (the forecasting model). The ESADE entrepreneurship network could provide mentorship.</em></p>`},

n9:{title:"Interview Prep — Data Science Roles",created:"2026-02-22",content:`<h2>Data Science Interview Preparation</h2>
<p>Summer internship applications are open. Target companies: McKinsey (QuantumBlack), BCG (Gamma), Google, Spotify (Barcelona office), and Glovo. The interview process typically has 3-4 rounds: screening, technical assessment (take-home or live coding), case study, and behavioural/fit. Preparation should cover statistics, ML theory, coding, and business case frameworks.</p>

<h3>Statistics & Probability</h3>
<p>Most frequently asked topics:</p>
<ul>
<li><strong>Hypothesis testing</strong>: Null vs alternative hypothesis, p-values, Type I/II errors, confidence intervals. "If p < 0.05, we reject the null" — but also understand what p-values actually mean (probability of observing data this extreme given H0 is true, NOT the probability that H0 is true)</li>
<li><strong>A/B testing</strong>: Sample size calculation, power analysis, multiple comparison correction (Bonferroni). Know how to design an A/B test for a product feature — this comes up at every tech company</li>
<li><strong>Bayesian thinking</strong>: Bayes' theorem, prior/posterior/likelihood. "A disease affects 1% of the population, a test is 95% accurate — what's the probability you have the disease given a positive test?" (Answer: ~16%, not 95%)</li>
<li><strong>Distributions</strong>: Normal, binomial, Poisson, exponential. When to use each. Central Limit Theorem and its practical importance</li>
</ul>

<h3>Machine Learning Theory</h3>
<p>Be ready to explain without slides:</p>
<ul>
<li>Bias-variance tradeoff — with a whiteboard drawing showing how training/test error change with model complexity</li>
<li>How <strong>random forests</strong> work (bootstrapping, feature randomisation, aggregation) and why they reduce variance</li>
<li>Gradient descent variants (batch, mini-batch, stochastic) and how <strong>Adam</strong> optimiser works</li>
<li>Regularisation: L1 vs L2, dropout, early stopping — when to use which</li>
<li>How to handle <strong>imbalanced datasets</strong>: SMOTE, undersampling, class weights, choosing the right metric</li>
<li><strong>Feature engineering</strong>: encoding categorical variables (one-hot, target encoding), handling missing data, feature scaling</li>
</ul>

<h3>Coding (Python)</h3>
<p>Practice on LeetCode (easy/medium) and StrataScratch (SQL). Key patterns: pandas data manipulation, SQL window functions, basic algorithms. A typical question: "Given a table of user sessions, calculate the 7-day rolling average of daily active users." Know the pandas and SQL approaches to this.</p>

<h3>Case Studies</h3>
<p>McKinsey/BCG-style: "A retailer wants to predict which customers will churn. How would you approach this?" Structure: define the problem → identify data sources → choose features → select model → evaluate → deploy → monitor. Always start with business impact — what action will be taken on the prediction? Frame ML solutions in terms of business value, not just accuracy.</p>

<h3>Behavioural</h3>
<p>Use the STAR method: Situation, Task, Action, Result. Prepare stories for: a project that failed and what you learned, a time you led a team, a technical disagreement you resolved. The startup project (RestaurantIQ) is great material — it shows initiative, technical breadth, and business thinking.</p>

<p><strong>Study schedule:</strong> 1 hour/day — Mon/Wed: coding, Tue/Thu: theory review, Fri: mock case study. Use our ML and finance course material as revision doubles.</p>`},

n10:{title:"Portfolio Website & Personal Brand",created:"2026-02-25",content:`<h2>Building a Portfolio — Stand Out in Applications</h2>
<p>The goal is a clean personal website that showcases projects, skills, and writing. This serves double duty: it's a portfolio for job applications and a platform for content that demonstrates expertise. Recruiters at top firms spend an average of 6 seconds on a resume — a well-crafted portfolio page linked from LinkedIn can make the difference.</p>

<h3>Site Structure</h3>
<ul>
<li><strong>Hero section</strong>: Name, one-line positioning ("MBAn candidate at ESADE | Data Science & Product"), professional photo, links to LinkedIn/GitHub</li>
<li><strong>Projects page</strong>: 3-4 featured projects with clear problem → approach → result structure. Each should have a live demo or screenshots. Priority projects: RestaurantIQ MVP, this note-taking app (Notiq — demonstrates React + LLM integration), ML coursework (CNN image classifier), and the finance valuation model</li>
<li><strong>Blog/Writing</strong>: 2-3 articles demonstrating analytical thinking. Ideas: "What I Learned Building an AI-Powered Note App", "Applying ML to Restaurant Revenue Forecasting", "A Finance Student's Guide to DCF Modelling"</li>
<li><strong>About</strong>: Brief bio, skills, education, interests</li>
</ul>

<h3>Tech Stack for the Site</h3>
<p>Keep it simple — the portfolio itself should demonstrate good engineering taste, not over-engineering:</p>
<ul>
<li><strong>Next.js</strong> with static site generation — fast, SEO-friendly, deployed free on Vercel</li>
<li><strong>Tailwind CSS</strong> for styling — consistent, responsive, fast to build</li>
<li><strong>MDX</strong> for blog posts — write in Markdown with React components embedded</li>
<li>Analytics: Vercel Analytics (free, privacy-respecting) or Plausible</li>
</ul>
<p>Alternatively, just use a <strong>Notion page</strong> with Super.so for a custom domain — zero maintenance, looks professional. The tradeoff: less impressive technically but much faster to set up. For an MBAn student (not a pure SWE role), this might be the pragmatic choice.</p>

<h3>Content Strategy</h3>
<p>Post one article per month on the blog, cross-post to LinkedIn and Medium. Topics should sit at the intersection of business and technology — that's the MBAn differentiator. Share the RestaurantIQ journey: market research, customer interviews, technical decisions, pivots. This builds credibility for both data science and product management roles.</p>

<h3>LinkedIn Optimisation</h3>
<p>Update headline to include target keywords: "MBAn @ ESADE | Data Science | Machine Learning | Analytics". Featured section: pin the portfolio link + 1-2 posts. Skills section: Python, SQL, Machine Learning, Data Visualisation, Financial Modelling. Get endorsements from classmates and professors. Post weekly — even simple things like course takeaways or project updates get engagement.</p>

<p><em>The portfolio ties everything together — coursework (ML, finance, NLP), side projects (RestaurantIQ, Notiq), and career goals. It's the single most high-ROI thing I can do for the job search beyond raw skill-building.</em></p>`},

// ── HEALTH & FITNESS ────────────────────────────────────────

n11:{title:"Push Pull Legs — Training Program",created:"2026-02-12",content:`<h2>Push/Pull/Legs Training Split</h2>
<p>The PPL split divides training by movement pattern rather than individual muscles. This allows each muscle group to be trained twice per week (6 sessions) while getting adequate recovery. It's the most popular split among intermediate lifters for good reason — it balances volume, frequency, and recovery.</p>

<h3>Push Day (Chest, Shoulders, Triceps)</h3>
<ul>
<li><strong>Bench Press</strong>: 4×6-8 — the primary horizontal push. Use a full range of motion (bar to chest). Progressively overload by 2.5kg when you can complete all reps with good form. Alternate between flat and incline week to week for balanced chest development</li>
<li><strong>Overhead Press (OHP)</strong>: 3×8-10 — standing barbell or seated dumbbell. Strict form — no leg drive. This builds anterior and medial deltoids plus core stability</li>
<li><strong>Incline Dumbbell Press</strong>: 3×10-12 — targets upper chest, which is often underdeveloped. 30-degree incline, controlled eccentric</li>
<li><strong>Lateral Raises</strong>: 4×12-15 — light weight, controlled tempo. The medial deltoid responds best to higher reps. Lean slightly forward to take the front delt out of the movement</li>
<li><strong>Tricep Pushdowns</strong>: 3×12-15 — rope or straight bar. Full lockout at the bottom</li>
<li><strong>Overhead Tricep Extension</strong>: 3×10-12 — stretches the long head of the triceps, which has the most growth potential</li>
</ul>

<h3>Pull Day (Back, Biceps, Rear Delts)</h3>
<ul>
<li><strong>Deadlift</strong>: 3×5 (one pull day) or <strong>Barbell Rows</strong>: 4×8-10 (other pull day) — alternate heavy compound movements between the two weekly pull sessions</li>
<li><strong>Pull-ups/Lat Pulldowns</strong>: 4×8-12 — wide grip for lat width, close grip for lat thickness. If you can do 12 bodyweight pull-ups, add weight with a belt</li>
<li><strong>Seated Cable Rows</strong>: 3×10-12 — squeeze the shoulder blades at the contraction. Different handles target different back areas</li>
<li><strong>Face Pulls</strong>: 4×15-20 — essential for shoulder health and rear delts. External rotation at the top. This counteracts all the internal rotation from bench pressing and desk work</li>
<li><strong>Barbell or Dumbbell Curls</strong>: 3×10-12 — full range of motion, no swinging</li>
<li><strong>Hammer Curls</strong>: 3×10-12 — targets the brachialis and forearms alongside the biceps</li>
</ul>

<h3>Leg Day (Quads, Hamstrings, Glutes, Calves)</h3>
<ul>
<li><strong>Squats</strong>: 4×6-8 — the king of lower body exercises. High bar (more quads) or low bar (more posterior chain). Depth: crease of hip below top of knee. Progressively overload — aim for a 1.5× bodyweight squat within 12 months</li>
<li><strong>Romanian Deadlifts</strong>: 3×10-12 — hip hinge movement targeting hamstrings and glutes. Keep the bar close to the body, slight knee bend, feel the stretch in the hamstrings</li>
<li><strong>Leg Press</strong>: 3×12-15 — higher foot placement for more glute/hamstring, lower for more quads</li>
<li><strong>Walking Lunges</strong>: 3×12 each leg — functional strength plus balance</li>
<li><strong>Leg Curl</strong>: 3×12-15 — isolates hamstrings</li>
<li><strong>Calf Raises</strong>: 4×15-20 — standing (gastrocnemius) and seated (soleus). Full stretch at bottom, pause at top</li>
</ul>

<h3>Progressive Overload Protocol</h3>
<p>The fundamental principle of muscle growth: systematically increase training stimulus over time. Methods: add weight (primary), add reps, add sets, decrease rest time. Log every workout — without tracking, you can't ensure progressive overload. Use a simple spreadsheet or app like Strong.</p>

<p><strong>Schedule:</strong> Mon Push, Tue Pull, Wed Legs, Thu Rest, Fri Push, Sat Pull, Sun Legs. Adjust based on recovery — if sleep is poor or stress is high (exam week), drop to 4 sessions.</p>`},

n12:{title:"Nutrition Plan — Lean Bulk Protocol",created:"2026-02-14",content:`<h2>Lean Bulk — Nutrition Strategy</h2>
<p>The goal: gain muscle while minimising fat gain. This requires a moderate caloric surplus with adequate <strong>protein</strong> to fuel muscle protein synthesis, combined with consistent resistance training. A lean bulk targets 0.25-0.5kg of weight gain per week — anything faster means excessive fat accumulation.</p>

<h3>Calorie Targets</h3>
<p>Maintenance calories (TDEE) estimated at 2400 kcal based on: 75kg bodyweight, 178cm, age 25, training 5-6×/week. Lean bulk surplus: +300-400 kcal = <strong>2700-2800 kcal/day</strong>. Track daily for the first month to build intuition, then transition to more flexible eating while weighing weekly.</p>

<h3>Macronutrient Split</h3>
<ul>
<li><strong>Protein</strong>: 2.0g/kg = 150g/day (600 kcal). This is the most critical macro for muscle growth. Research consistently shows 1.6-2.2g/kg is optimal — we target the higher end during a bulk since extra protein has minimal downside and a high thermic effect (25-30% of protein calories are burned during digestion)</li>
<li><strong>Fat</strong>: 0.8g/kg = 60g/day (540 kcal). Minimum for hormone production (testosterone, which is critical for muscle growth). Prioritise unsaturated fats: olive oil, avocado, nuts, fatty fish</li>
<li><strong>Carbs</strong>: Remaining calories = ~400g/day (1600 kcal). Carbs fuel training performance and replenish muscle glycogen. Prioritise complex carbs (oats, rice, sweet potato) but simple carbs around training are fine</li>
</ul>

<h3>Meal Plan</h3>
<p><strong>Meal 1 (8am) — Breakfast:</strong> Oatmeal (80g oats, 1 banana, 1 tbsp peanut butter, honey) + 2 whole eggs. ~550 kcal, 28g protein</p>
<p><strong>Meal 2 (12pm) — Lunch:</strong> Chicken breast (200g) + rice (150g dry) + roasted vegetables (broccoli, peppers) + olive oil drizzle. ~700 kcal, 52g protein</p>
<p><strong>Meal 3 (3pm) — Pre-workout snack:</strong> Greek yogurt (200g) + granola (40g) + berries. ~350 kcal, 24g protein</p>
<p><strong>Meal 4 (6pm) — Post-workout:</strong> Whey protein shake (1.5 scoops) + banana + milk. ~350 kcal, 38g protein</p>
<p><strong>Meal 5 (8pm) — Dinner:</strong> Salmon (180g) or lean beef + sweet potato (200g) + salad with feta. ~650 kcal, 42g protein</p>
<p><strong>Total:</strong> ~2600 kcal, ~184g protein. Adjust dinner portion up if training was especially intense.</p>

<h3>Supplements</h3>
<ul>
<li><strong>Creatine monohydrate</strong>: 5g/day, every day. The most researched and effective supplement for strength and muscle gain. No loading phase needed — just consistent daily intake</li>
<li><strong>Whey protein</strong>: Only to hit protein targets when whole food isn't convenient. 1-2 scoops/day max</li>
<li><strong>Vitamin D</strong>: 2000-4000 IU/day, especially in winter (Barcelona gets decent sun but supplement anyway)</li>
<li><strong>Omega-3</strong>: 1-2g EPA+DHA daily if not eating fatty fish 2-3x/week</li>
</ul>

<h3>Tracking & Adjustments</h3>
<p>Weigh daily in the morning (after bathroom, before food), use a 7-day rolling average to smooth out water fluctuations. If average weight isn't increasing after 2 weeks, add 200 kcal (from carbs). If gaining faster than 0.5kg/week, reduce by 200 kcal. Take progress photos monthly — the mirror and measurements matter more than the scale.</p>

<p><em>This directly supports the training program (progressive overload requires adequate nutrition) and connects to the overall goal of sustainable health alongside the intensive MBAn program.</em></p>`},

n13:{title:"Sleep Optimisation & Recovery",created:"2026-02-19",content:`<h2>Sleep — The Most Underrated Performance Lever</h2>
<p>Sleep is the single most important factor for cognitive performance, physical recovery, and emotional regulation. Studies show that reducing sleep from 8 to 6 hours decreases cognitive performance by 25-30% — equivalent to being legally drunk. For an MBA student balancing academics, a startup, and fitness, optimising sleep isn't optional; it's the foundation everything else rests on.</p>

<h3>Sleep Architecture</h3>
<p>A full night's sleep cycles through 4-5 cycles of approximately 90 minutes each:</p>
<ul>
<li><strong>Stage 1 (N1)</strong>: Light sleep, 5-10 minutes. Easy to wake from. The transition from wakefulness</li>
<li><strong>Stage 2 (N2)</strong>: True sleep onset, 10-25 minutes. Heart rate slows, body temperature drops. <strong>Sleep spindles</strong> — bursts of neural activity that consolidate motor skills and procedural memory</li>
<li><strong>Stage 3 (N3 / Deep Sleep)</strong>: The most restorative stage. <strong>Growth hormone</strong> is released (critical for muscle recovery from training), immune system is strengthened, cellular repair occurs. Getting enough deep sleep is what makes your training program effective — without it, you're breaking down muscle without building it back</li>
<li><strong>REM (Rapid Eye Movement)</strong>: The dreaming stage. Essential for <strong>memory consolidation</strong>, emotional processing, and creative problem-solving. This is when your brain processes and organises what you learned during the day — studying machine learning or finance before sleep, then getting good REM, dramatically improves retention</li>
</ul>

<h3>Optimising Sleep Quality</h3>
<p><strong>Temperature:</strong> The body needs to drop ~1°C core temperature to initiate sleep. Keep the bedroom at 18-19°C. A hot shower 90 minutes before bed paradoxically helps — the subsequent cooling of the body triggers sleepiness. This is the single biggest quick win for most people.</p>
<p><strong>Light:</strong> Blue light from screens suppresses melatonin production. Use Night Shift / f.lux after 9pm. Dim overhead lights in the evening — switch to warm, low lamps. Get bright light exposure within 30 minutes of waking to set the circadian clock. This regulates the sleep-wake cycle and improves alertness during the day.</p>
<p><strong>Timing consistency:</strong> Go to bed and wake up within a 30-minute window every day, including weekends. Social jet lag (staying up late Friday-Saturday, sleeping in) disrupts your circadian rhythm for 2-3 days. Consistent timing improves both sleep quality and daytime energy more than any supplement.</p>
<p><strong>Caffeine:</strong> Half-life is 5-6 hours. A coffee at 3pm means half the caffeine is still circulating at 9pm. Cut caffeine by 1pm — yes, even during exam revision. The afternoon slump is better addressed with a 20-minute nap or a walk.</p>
<p><strong>Alcohol:</strong> Even small amounts fragment sleep architecture and suppress REM. That glass of wine helps you fall asleep but wrecks the quality of sleep you get. REM suppression means impaired memory consolidation — terrible the night before an exam.</p>

<h3>Recovery Beyond Sleep</h3>
<ul>
<li><strong>Active recovery</strong>: 20-30 minutes of walking or light cycling on rest days increases blood flow to muscles without adding training stress</li>
<li><strong>Stress management</strong>: Cortisol (stress hormone) directly opposes recovery. 10 minutes of box breathing (4-4-4-4) or meditation before bed lowers cortisol and improves sleep onset</li>
<li><strong>Deload weeks</strong>: Every 4-6 weeks, reduce training volume by 40-50%. This allows accumulated fatigue to dissipate and primes the body for the next training block</li>
</ul>

<p><strong>Target:</strong> 7.5-8 hours of actual sleep (in bed 8-8.5 hours to account for sleep latency). Track with a simple sleep diary or wearable. Correlate sleep quality with gym performance and study focus — the data is usually eye-opening.</p>`},

n14:{title:"Weekly Meal Prep Sunday",created:"2026-02-23",content:`<h2>Sunday Meal Prep — Week of Feb 24</h2>
<p>The key to hitting nutrition targets consistently is preparing most meals in advance. Sunday meal prep takes 2-3 hours but saves 5-6 hours during the week and eliminates the decision fatigue of "what should I eat?" when you're tired after classes. It also saves money — eating out in Barcelona averages €12-15 per meal vs €3-4 when cooking.</p>

<h3>Shopping List</h3>
<p><strong>Proteins:</strong></p>
<ul>
<li>Chicken breast: 1.5kg (Mercadona, ~€7.50) — the staple. Season differently each batch to avoid flavour fatigue</li>
<li>Salmon fillets: 4 pieces (~€8) — omega-3s, vitamin D, high-quality protein</li>
<li>Eggs: 18 pack (~€3) — versatile, cheap, complete amino acid profile</li>
<li>Greek yogurt: 1kg tub (~€2.50) — 10g protein per 100g, great for snacks and breakfast</li>
<li>Whey protein: 1 bag (~€25/month) — convenience, not a replacement for real food</li>
</ul>
<p><strong>Carbs:</strong></p>
<ul>
<li>Brown rice: 1kg (~€1.50) — cook a big batch, portions into 5 containers</li>
<li>Sweet potatoes: 1kg (~€1.80) — complex carbs, fibre, micronutrients</li>
<li>Oats: 500g (~€1) — breakfast staple</li>
<li>Whole wheat pasta: 500g (~€1) — quick backup meal option</li>
<li>Bread: Whole grain loaf (~€1.50)</li>
</ul>
<p><strong>Vegetables & Fruit:</strong></p>
<ul>
<li>Broccoli: 2 heads (~€2) — micronutrient powerhouse, roasts beautifully</li>
<li>Bell peppers: 4 mixed (~€2) — high vitamin C, adds colour to meals</li>
<li>Spinach: 2 bags (~€2) — iron, folate, versatile (salads, smoothies, omelettes)</li>
<li>Bananas: bunch of 6 (~€1) — pre/post workout carbs, potassium</li>
<li>Berries: 2 punnets (~€4) — antioxidants, low sugar fruit option</li>
<li>Avocados: 3 (~€2.50) — healthy fats, absolutely essential</li>
</ul>
<p><strong>Pantry:</strong> Olive oil, garlic, onions, soy sauce, spice rack (paprika, cumin, oregano, chilli flakes)</p>

<h3>Prep Plan (2.5 hours)</h3>
<ol>
<li><strong>Rice cooker on</strong> (1kg brown rice) — set and forget, ~40 min</li>
<li><strong>Oven on at 200°C</strong>: Sheet pan 1: chicken breast (750g, seasoned with paprika + garlic). Sheet pan 2: sweet potatoes (cubed) + broccoli + bell peppers with olive oil. 25-30 min</li>
<li><strong>While oven runs:</strong> Season and prep second batch of chicken (different flavour — soy + ginger). Hard boil 8 eggs. Wash and portion spinach into containers</li>
<li><strong>Second oven round:</strong> Salmon fillets (15 min at 180°C, lemon + dill). Second chicken batch (25 min)</li>
<li><strong>Assembly:</strong> Portion into 10 containers: 5× chicken + rice + vegetables, 3× salmon + sweet potato + spinach, 2× chicken soy-ginger + rice + broccoli</li>
</ol>

<h3>Daily Schedule</h3>
<p><strong>Monday:</strong> Oats + eggs (fresh) | Chicken paprika + rice + veg (prepped) | Salmon + sweet potato (prepped)</p>
<p><strong>Tuesday:</strong> Oats + yogurt + berries (fresh) | Chicken soy-ginger + rice (prepped) | Pasta + remaining chicken (quick cook)</p>
<p><strong>Wednesday:</strong> Eggs + toast + avocado (fresh) | Salmon + spinach (prepped) | Chicken + sweet potato (prepped)</p>
<p><strong>Thursday:</strong> Oats + banana + PB (fresh) | Chicken + rice + veg (prepped) | Dinner out with friends (budget: €15)</p>
<p><strong>Friday:</strong> Yogurt + granola (fresh) | Last prepped container | Dinner out or quick pasta</p>

<p><strong>Total weekly grocery cost:</strong> ~€45-50. That's roughly €6-7/day for 2700 kcal and 150g+ protein. Compare to eating out: €35-45/day. Meal prep saves €200+/month — significant for a student budget.</p>`},

// ── LIFE & PLANNING ─────────────────────────────────────────

n15:{title:"February Budget & Financial Plan",created:"2026-02-01",content:`<h2>February 2026 — Monthly Budget</h2>
<p>Monthly income: €2,500 (combination of savings drawdown from pre-MBA job and a small family contribution). The MBAn is a 12-month program, so every euro needs to be managed carefully. Total available savings at program start: €18,000. Monthly burn rate target: under €2,000 to maintain a 9+ month runway.</p>

<h3>Fixed Expenses</h3>
<table>
<tr><th>Category</th><th>Amount</th><th>Notes</th></tr>
<tr><td>Rent</td><td>€750</td><td>Room in Eixample shared flat. Includes utilities. Below Barcelona average for the area — good deal, locked in until July</td></tr>
<tr><td>ESADE fees (monthly portion)</td><td>€0</td><td>Paid upfront from savings before program start</td></tr>
<tr><td>Phone plan</td><td>€15</td><td>Pepephone 20GB — cheapest reliable option in Spain</td></tr>
<tr><td>Gym</td><td>€30</td><td>DIR membership (student rate). Essential for physical and mental health — non-negotiable expense</td></tr>
<tr><td>Transport</td><td>€40</td><td>T-Casual metro pass. Bike for good weather days saves money</td></tr>
<tr><td>Subscriptions</td><td>€25</td><td>Spotify (€6, student), Netflix (€8, shared), GitHub Pro (€4, student), iCloud (€3), ChatGPT Plus (€20... considering cancelling — Gemini API for coursework is cheaper)</td></tr>
</table>
<p><strong>Fixed total: €860</strong></p>

<h3>Variable Expenses</h3>
<table>
<tr><th>Category</th><th>Budget</th><th>Strategy</th></tr>
<tr><td>Groceries</td><td>€200</td><td>Meal prep strategy: €45-50/week at Mercadona. Bulk protein + carbs, seasonal vegetables. Avoid Carrefour Express (30% markup on basics)</td></tr>
<tr><td>Dining out</td><td>€120</td><td>Budget for 2 dinners out/week (€15 avg) + occasional menú del día (€12). Social meals are networking — don't cut to zero</td></tr>
<tr><td>Coffee/snacks</td><td>€40</td><td>One coffee out per day max (€1.50-2 at local cafés, avoid Starbucks). Make coffee at home otherwise</td></tr>
<tr><td>Entertainment</td><td>€60</td><td>Drinks with classmates, occasional event. Barcelona nightlife is expensive — pregame at home</td></tr>
<tr><td>Personal care</td><td>€30</td><td>Haircut, toiletries, pharmacy</td></tr>
<tr><td>Clothing</td><td>€30</td><td>Minimal — only replace essentials. Zara sales</td></tr>
<tr><td>Books/courses</td><td>€20</td><td>Mostly free via ESADE library + online resources. Occasional O'Reilly book</td></tr>
<tr><td>Miscellaneous</td><td>€50</td><td>Buffer for unexpected expenses</td></tr>
</table>
<p><strong>Variable total: €550</strong></p>

<h3>Monthly Summary</h3>
<p>Total expenses: €1,410. Savings: €1,090/month. At this rate, savings last 16+ months — comfortable buffer beyond the program end. <strong>Financial health score: strong.</strong> The 50/30/20 rule applied to €2,500: needs should be ≤€1,250, wants ≤€750, savings ≥€500. Current split: needs €1,060 (42%), wants €300 (12%), savings €1,090 (44%) — well within guidelines.</p>

<h3>Investment Note</h3>
<p>Monthly savings are currently in a high-yield savings account (3.2% APY). Consider moving €500/month into a low-cost index fund (Vanguard FTSE All-World via DEGIRO) for long-term growth. The WACC and DCF concepts from finance class are relevant here — the opportunity cost of cash is the expected market return (~7-8% nominal, historically).</p>

<p><em>Review this budget at month end. Track actual vs planned in a spreadsheet. The biggest risk is lifestyle creep from social pressure at business school.</em></p>`},

n16:{title:"Barcelona — Best Spots & Hidden Gems",created:"2026-02-05",content:`<h2>Barcelona Living Guide — A Local's Notes</h2>
<p>After 5 months in Barcelona, these are my curated spots across the city. A mix of tourist highlights (because they genuinely are worth it) and local favourites that make daily life here special. Barcelona rewards exploration — every barrio has its own personality.</p>

<h3>Coffee & Study Spots</h3>
<ul>
<li><strong>Satan's Coffee Corner</strong> (El Born): Possibly the best specialty coffee in Barcelona. Industrial interior, good Wi-Fi, not too crowded on weekday mornings. Flat white is excellent. They also do great cakes. Only downside: no power outlets at every table</li>
<li><strong>Nomad Coffee</strong> (Eixample): Bright, spacious, laptop-friendly. Good for a 2-3 hour study session. Their cold brew is dangerously good. Near Passeig de Gràcia, so combine with a walk past Casa Batlló</li>
<li><strong>ESADE Library</strong> (Sant Cugat campus): Obviously the best place for deep focus work. Quiet floors, fast Wi-Fi, free printing. The commute from Eixample is 40 min by FGC train — worth it for exam prep days</li>
<li><strong>Biblioteca Gabriel García Márquez</strong> (Sant Martí): A stunning public library. Modern architecture, free, quiet, and less crowded than central spots. Good alternative when you need a change of scenery</li>
<li><strong>Federal Café</strong> (Gòtic): Brunch spot that's also good for working. The courtyard in spring is unbeatable. Australian-style coffee, good avocado toast</li>
</ul>

<h3>Food — Budget Eats</h3>
<ul>
<li><strong>Menú del día</strong>: The single best food hack in Spain. Three-course lunch with drink for €10-14 at countless local restaurants. Try different ones near campus — Bar Velódromo, La Pepita, Can Culleretes (one of Barcelona's oldest restaurants, menú at €13)</li>
<li><strong>La Boqueria</strong> (Las Ramblas): Touristy but genuinely great for fresh fruit, seafood, and snacking. Go early (before 11am) to avoid crowds. The juice stands are overpriced — buy whole fruit and make smoothies at home</li>
<li><strong>Mercadona</strong>: The GOAT for groceries. Consistently cheapest for staples. Their Hacendado brand protein yogurt is €0.80 and has 10g protein — meal prep essential</li>
<li><strong>Bo de B</strong> (Gòtic): The best sandwich in Barcelona for €5. Massive, fresh, customisable. Perfect cheap lunch between classes</li>
<li><strong>Flax & Kale</strong>: Healthy bowls, a bit pricey (€12-15) but great for when you want something nutritious that isn't chicken and rice. Their flexitarian menu is creative</li>
</ul>

<h3>Weekend Activities</h3>
<ul>
<li><strong>Bunkers del Carmel</strong>: The best view of Barcelona, free, and much less crowded than Park Güell (which now charges €10). Bring wine at sunset — a Barcelona ritual</li>
<li><strong>Barceloneta Beach</strong>: Swimming is actually good from June-October. Off-season, the boardwalk is great for running. Morning runs along the coast are peak Barcelona living</li>
<li><strong>Montjuïc</strong>: Hike up through the gardens, visit Fundació Miró (€14, student discount), catch the Magic Fountain show (free, weekends). The Olympic facilities are also here — you can use the public pool</li>
<li><strong>Park Güell</strong>: Book the €10 ticket online in advance for the monumental zone. Go at 8am opening — it's magical with no crowds. The free areas around the park are equally beautiful for a walk</li>
<li><strong>Camp Nou</strong>: Even if you're not a football fan, the stadium tour (€26) is an experience. Try to get matchday tickets — the atmosphere for a Champions League night is electric. Sign up for the newsletter for ticket sale alerts</li>
</ul>

<h3>Day Trips</h3>
<p><strong>Montserrat</strong> (1hr by train): Jaw-dropping mountain monastery. Hike the Sant Joan trail for panoramic views. Go on a weekday. <strong>Costa Brava</strong> (Tossa de Mar, 1.5hr by bus): Medieval walled town + beautiful coves. Best in late May before summer crowds. <strong>Girona</strong> (40min by AVE): Colourful houses along the Onyar river, Jewish quarter, incredible food scene (some say better than Barcelona).</p>

<p><em>Living in Barcelona is genuinely one of the best parts of the MBAn experience. The quality of life for the cost is hard to beat anywhere in Europe. Make the most of it — it's only 12 months.</em></p>`},

n17:{title:"Productivity System & Study Method",created:"2026-02-09",content:`<h2>How I Stay Organised — Productivity Stack</h2>
<p>Managing an MBAn program, a startup project, fitness goals, and a social life requires a system, not just willpower. After experimenting for a few months, here's what's working. The key insight: <strong>the system must be simpler than the work itself</strong>. If maintaining your productivity system takes significant time, it's counterproductive.</p>

<h3>Weekly Planning (Sunday, 30 min)</h3>
<p>Every Sunday evening, review the week ahead:</p>
<ol>
<li><strong>Calendar block</strong>: Classes, gym sessions, and social commitments are fixed. Block these first. Then block 2-3 deep work sessions (2-3 hours each) for the week's most important tasks</li>
<li><strong>Top 3 priorities</strong>: Identify the three most impactful things to accomplish this week. These should align with long-term goals (coursework, startup, health). Everything else is secondary</li>
<li><strong>Meal prep plan</strong>: Decide what to cook (see meal prep note), create shopping list. Removes daily decision fatigue around food</li>
<li><strong>Review previous week</strong>: What went well? What didn't? One small adjustment for next week. Don't overthink — iterative improvement beats big overhauls</li>
</ol>

<h3>Daily Routine</h3>
<p><strong>Morning (7:00-8:30):</strong> Wake at 7:00 (no snooze — phone across the room). 10 min morning light exposure (balcony or short walk). Breakfast while reviewing today's calendar. No social media until after the first deep work block.</p>
<p><strong>Deep work block 1 (9:00-12:00):</strong> Most cognitively demanding task. Usually coursework, studying, or startup development. Phone on airplane mode or in another room. Use the Pomodoro technique: 50 min focused work, 10 min break. Three pomodoros = one deep block.</p>
<p><strong>Lunch (12:00-13:00):</strong> Eat prepped meal. Walk outside for 15 min — movement and sunlight reset focus for the afternoon.</p>
<p><strong>Afternoon (13:00-17:00):</strong> Classes, meetings, collaborative work, emails. This is naturally lower-energy time — schedule administrative tasks here. One additional deep work pomodoro if possible.</p>
<p><strong>Gym (17:30-19:00):</strong> Training is non-negotiable. It improves sleep, energy, focus, and mood. Think of it as an investment in productivity, not time away from work.</p>
<p><strong>Evening (19:30-22:00):</strong> Dinner, socialising, light reading, or a second study session if needed. Review tomorrow's calendar. Screens off by 22:00, wind-down routine (reading, stretching). Sleep by 22:30-23:00.</p>

<h3>Study Method — Active Recall & Spaced Repetition</h3>
<p>Passive re-reading is the least effective study method despite being the most common. Instead:</p>
<ul>
<li><strong>Active recall</strong>: After reading a chapter or attending a lecture, close the material and write down everything you remember. Then check what you missed. The struggle of retrieval is what builds memory. This is why the Notiq Transform feature (quiz generation) is useful — it forces recall</li>
<li><strong>Spaced repetition</strong>: Review material at increasing intervals: 1 day → 3 days → 7 days → 14 days → 30 days. Use Anki flashcards for facts (finance formulas, ML algorithm properties). The forgetting curve is exponential — one well-timed review is worth five last-minute cramming sessions</li>
<li><strong>Feynman technique</strong>: Explain concepts in simple language, as if teaching a child. If you can't explain it simply, you don't understand it deeply enough. This is particularly effective for complex topics like transformers or WACC calculations</li>
<li><strong>Interleaving</strong>: Mix different topics in a single study session (30 min ML, 30 min finance, 30 min quantum). Feels harder than blocking, but research shows it improves long-term retention and transfer</li>
</ul>

<p><strong>Tools:</strong> Notiq for course notes and AI-powered review. Anki for flashcards. Google Calendar for time blocking. Strong app for gym tracking. A simple spreadsheet for budget tracking. That's it — resist the urge to add more tools.</p>`},

n18:{title:"Barcelona Trip Plan — Mom's Visit",created:"2026-02-27",content:`<h2>Mom's Barcelona Visit — March 12-16</h2>
<p>Mom is visiting for 4 days. She's never been to Spain, loves architecture and history, walks a lot but has a bad knee (avoid steep hills where possible). She's also a foodie who will appreciate good restaurants more than tourist traps. Plan a mix of must-see landmarks and relaxed local experiences. Budget: she's covering her hotel and flights; I'll cover activities and most meals (~€200 for the week from entertainment/dining budget).</p>

<h3>Logistics</h3>
<ul>
<li><strong>Arrival:</strong> Thursday March 12, 14:00 at El Prat T1. Take Aerobús to Plaça Catalunya (€7.75), then walk to hotel. She's staying at Hotel Jazz (Carrer de Pelai) — great location, 5 min from Las Ramblas, 15 min walk from my flat</li>
<li><strong>T-Casual card</strong>: Buy a 10-trip metro card (€11.35) for her at the airport. Covers all trips within Zone 1</li>
<li><strong>Weather mid-March</strong>: 12-18°C, occasionally rainy. Bring a light jacket and umbrella. Comfortable walking shoes essential — Barcelona is best explored on foot</li>
</ul>

<h3>Day 1 — Thursday: Arrival + Gothic Quarter</h3>
<p><strong>14:00</strong>: Pick up at Plaça Catalunya. Drop bags at hotel.</p>
<p><strong>15:30</strong>: Walk through the <strong>Gothic Quarter</strong> (Barri Gòtic). Show her the Cathedral (free entry to the cloister with geese), Plaça del Rei (medieval royal palace), and the hidden Plaça de Sant Felip Neri (the bullet-scarred church wall from the Civil War — she'll find the history moving). This neighbourhood is flat and pedestrian-only, easy on her knee.</p>
<p><strong>18:00</strong>: Coffee at <strong>Satan's Coffee Corner</strong> in El Born. Then a slow walk through El Born — the Basilica of Santa Maria del Mar is free to enter and stunningly beautiful. Tell her about the novel "Cathedral of the Sea" — she'd love it.</p>
<p><strong>20:30</strong>: Dinner at <strong>Cal Pep</strong> (book in advance!) — legendary tapas bar. Or fallback: La Cova Fumada in Barceloneta for the original bomba (potato croquette). Budget: ~€40 for two.</p>

<h3>Day 2 — Friday: Gaudí Day</h3>
<p><strong>9:00</strong>: <strong>Sagrada Familia</strong> (tickets pre-booked, €26 each with tower access). Book the Nativity façade tower — better views and an easier descent. Allow 2 hours. She will be blown away by the interior light through the stained glass.</p>
<p><strong>12:00</strong>: <strong>Passeig de Gràcia</strong>: Walk past Casa Batlló and Casa Milà (La Pedrera). We can go inside one — I'd recommend Casa Batlló (€35) for the immersive experience, but La Pedrera rooftop (€25) is also stunning. Let her choose.</p>
<p><strong>14:00</strong>: Lunch at the Eixample flat — I'll cook something nice. Show her where I live, the neighbourhood.</p>
<p><strong>16:00</strong>: <strong>Park Güell</strong> (€10, pre-booked). Take a taxi up to save her knee from the hill. The monumental zone is manageable once you're there. Mosaic bench with the city view is the photo spot.</p>
<p><strong>20:00</strong>: Dinner in Gràcia neighbourhood — <strong>La Pepita</strong> for creative tapas or <strong>Can Culleretes</strong> (est. 1786) for traditional Catalan food. Budget: ~€35.</p>

<h3>Day 3 — Saturday: Culture + Beach</h3>
<p><strong>10:00</strong>: <strong>Picasso Museum</strong> (€12, free first Sunday but she leaves before then). The collection traces his artistic evolution — the early realistic works vs the later abstract period is fascinating even for non-art people.</p>
<p><strong>12:30</strong>: Walk down to <strong>Barceloneta</strong>. Seafood lunch at <strong>La Mar Salada</strong> — excellent paella, less touristy than the beachfront places.</p>
<p><strong>15:00</strong>: Walk along the beach promenade. If she's tired, sit at a chiringuito (beach bar) with a drink. If energetic, take the cable car up to <strong>Montjuïc</strong> (spectacular views).</p>
<p><strong>17:00</strong>: <strong>Fundació Miró</strong> (€14) if time permits — world-class modern art in a beautiful building.</p>
<p><strong>20:30</strong>: Special dinner: <strong>Cervecería Catalana</strong> — arguably the best tapas in Barcelona. Go at 20:00 to beat the queue. Order: patatas bravas, gambas al ajillo, pan con tomate, jamón ibérico. Budget: ~€50.</p>

<h3>Day 4 — Sunday: Relaxed Day + Departure</h3>
<p><strong>10:00</strong>: <strong>La Boqueria</strong> market: Browse, sample fresh fruit and juices. Buy jamón and cheese for her to take home.</p>
<p><strong>11:30</strong>: Walk down <strong>Las Ramblas</strong> to the harbour. See the Columbus monument. Coffee at the Port Vell area.</p>
<p><strong>13:00</strong>: Final lunch together somewhere nice. Maybe back to her favourite spot from the trip.</p>
<p><strong>15:00</strong>: Back to hotel for bags. Aerobús to airport.</p>

<p><strong>Total estimated cost:</strong> Activities ~€100 (Sagrada + Gaudí house + Park Güell + Picasso + Miró). Meals/coffee ~€150. Transport ~€20. Total: ~€270. Slightly over budget but worth it — she hasn't visited me since I moved here.</p>`},

n19:{title:"Reflections — First Semester Lessons",created:"2026-02-28",content:`<h2>What I've Learned — 5 Months into the MBAn</h2>
<p>Halfway through the program feels like a good moment to step back and reflect on what's actually been valuable, what I'd do differently, and where I want to focus for the remaining months. These notes are for future me — a record of the thinking at this point.</p>

<h3>Academic Takeaways</h3>
<p>The most valuable course has been <strong>machine learning</strong>, hands down. Not because the theory was new (I'd done online courses before), but because the assignments forced me to actually implement things end-to-end: data cleaning, feature engineering, model selection, evaluation, interpretation. The gap between "I understand random forests conceptually" and "I can build one that works on messy real data" is enormous. The neural network and deep learning modules pushed me further — understanding backpropagation and gradient descent at a mathematical level changed how I think about optimisation problems in general.</p>

<p><strong>Corporate finance</strong> surprised me. I came in thinking finance was boring number-crunching, but valuation is genuinely fascinating — it's applied storytelling with numbers. The DCF model forces you to make explicit assumptions about a company's future, and defending those assumptions requires deep business understanding. The WACC and CAPM frameworks connect directly to startup thinking — what's the cost of capital for a new venture? What's the risk-adjusted return an investor should expect?</p>

<p><strong>NLP and transformers</strong>: Understanding the attention mechanism and how LLMs actually work was a game-changer. Building this note app (Notiq) with Gemini API integration gave me practical experience with prompt engineering, structured output, and the limitations of current models. The key insight: LLMs are most useful when you give them clear structure and constraints, not open-ended prompts.</p>

<p><strong>Data ethics</strong> was the course I expected to be a checkbox but turned out to be genuinely challenging. The impossibility theorem (you can't satisfy all fairness metrics simultaneously) forced real moral reasoning — not just technical optimisation. Any AI product we build must grapple with these questions from day one.</p>

<h3>Personal Growth</h3>
<p>The biggest non-academic lesson: <strong>saying no is a skill</strong>. Business school culture pushes you to attend every networking event, join every club, go to every party. I burned out in November trying to do everything. Since then, I've been more intentional: 2-3 social events per week max, focused on deeper relationships rather than broad networking. Quality over quantity applies to people too.</p>

<p><strong>Physical health as a performance tool</strong>: I almost dropped gym time in October to "study more." Terrible idea — the weeks I skipped training, my focus, sleep, and mood all degraded. Now I treat the gym and nutrition plan as non-negotiable infrastructure, like sleep. The PPL program and meal prep system have been game-changers for consistency.</p>

<p><strong>Barcelona living</strong>: Moving to a new city alone, in a language I'm still learning, was harder than I expected. The first two months were lonely. What helped: saying yes to every invitation initially (before learning to say no), finding regular spots (Satan's Coffee, the gym, the library), and the MBAn cohort itself — 40 people going through the same experience creates fast bonds.</p>

<h3>What I'd Do Differently</h3>
<ul>
<li>Start the startup project earlier — we wasted weeks debating ideas when we should have been talking to customers. Customer discovery interviews should come before any code</li>
<li>Take data ethics more seriously from the start — it's not a soft elective, it's foundational for anyone building AI products</li>
<li>Set up a productivity system in week 1, not month 3. The weekly planning + Pomodoro + meal prep stack took time to develop — having it earlier would have prevented the November burnout</li>
<li>Learn more Spanish. My Spanish is functional but not fluent, and it limits deeper connections with local people and the Barcelona experience. Should have done intensive classes in September</li>
</ul>

<h3>Focus for Semester 2</h3>
<ol>
<li><strong>Ship the MVP</strong>: RestaurantIQ needs to be in front of real users by April. No more building features — find 3 restaurants willing to pilot</li>
<li><strong>Nail the internship</strong>: Interview prep is on track. Target: data science internship at a top-tier company for the summer</li>
<li><strong>Deepen ML knowledge</strong>: Go beyond course material into reinforcement learning and MLOps — these are differentiators in interviews</li>
<li><strong>Enjoy Barcelona</strong>: Mom's visiting in March, friends in April. Montserrat and Costa Brava day trips before summer crowds</li>
</ol>

<p><em>The MBAn has been the best decision I've made. It's not just the education — it's the combination of world-class academics, an incredible city, and a cohort of ambitious, interesting people. The hard parts (loneliness, burnout, imposter syndrome) are part of the growth. Document it all.</em></p>`},

n20:{title:"AI Tools & Workflow — What I Actually Use",created:"2026-03-03",content:`<h2>AI Tools in My Daily Workflow</h2>
<p>The landscape of AI tools has exploded in the past year, and as someone studying machine learning while also using these tools daily, I have a particular perspective on what's genuinely useful vs what's hype. These notes are a living document of my actual AI stack — what I use, how I use it, and what I've dropped.</p>

<h3>Code & Development</h3>
<p><strong>GitHub Copilot</strong> (in VS Code): The single most impactful AI tool I use. It's essentially a very good autocomplete engine trained on vast amounts of code. Best for: boilerplate code, repetitive patterns, API usage you don't remember exactly. It's like having a junior developer who knows every library's syntax. Limitation: it can confidently write plausible-but-wrong code, especially for complex logic. Always review what it generates. I've caught subtle bugs in Copilot suggestions that would have been painful to debug later. The key is using it to speed up the obvious parts so you can spend mental energy on the hard parts.</p>

<p><strong>Claude</strong>: My primary AI for complex reasoning tasks. Better than GPT-4 for long-context analysis, code review, and nuanced explanations. I use it for: understanding complex papers (paste the PDF and ask questions), debugging tricky issues (it's better at explaining why something doesn't work), and brainstorming architecture decisions. The way Notiq uses Gemini for autocomplete and analysis is inspired by how I use Claude — contextual, specific, structured prompts get dramatically better results than vague questions.</p>

<p><strong>Gemini</strong>: Powers the AI features in Notiq. Good for: fast, lightweight tasks (autocomplete, entity extraction, short analysis). The API is well-priced and the structured output mode (JSON) is reliable. For our coursework and startup, Gemini 2.0 Flash hits the sweet spot of speed, cost, and quality. The free tier is generous enough for development.</p>

<h3>Writing & Research</h3>
<p><strong>For academic writing</strong>: I draft outlines and first passes myself, then use AI for: checking logical flow, finding gaps in arguments, suggesting counterpoints I haven't considered, and polishing language (English is my second language). Never use AI to write the actual paper — apart from the integrity issues, your own voice and thinking is what professors are evaluating. The AI is most useful as a critic, not a creator.</p>

<p><strong>For research</strong>: Perplexity for quick factual lookups with citations. Google Scholar + Semantic Scholar for actual paper discovery. The combination is powerful: find relevant papers with traditional search, then use Claude to help parse dense sections or compare methodologies across papers. For the NLP course, I used Claude to help me understand the original "Attention Is All You Need" paper — it explained the multi-head attention equations step by step in a way that finally clicked.</p>

<h3>Productivity</h3>
<p><strong>Notiq</strong> (this app!): The AI autocomplete genuinely helps when I'm brain-dumping notes — it predicts what I'm about to write and saves keystrokes. The knowledge tracker surfaces gaps in my study notes that I'd otherwise miss. The transform feature (quiz generation) is useful for exam prep — it converts my messy notes into structured review material. The knowledge graph shows connections between notes I wouldn't have noticed manually.</p>

<p><strong>What I've stopped using</strong>: Notion AI (redundant with Claude), Jasper (marketing-focused, not useful for academic/technical work), ChatGPT Plus (Claude is better for my use cases, and I have Gemini API access for programmatic use). Otter.ai for lecture transcription was useful but I found I learn better taking manual notes — the act of writing forces engagement with the material.</p>

<h3>The Meta-Lesson</h3>
<p>The biggest insight from studying ML while using AI tools: <strong>understanding how these models work makes you a dramatically better user of them</strong>. Knowing that transformers process tokens with attention weights helps me write better prompts (front-load important context). Understanding temperature and sampling helps me tune outputs. Knowing about RLHF helps me understand why Claude refuses certain requests and how to rephrase. The NLP and deep learning courses aren't just academic — they're practical skills for leveraging AI tools effectively.</p>

<p>The second insight: <strong>AI amplifies your existing capabilities rather than replacing them</strong>. A strong data scientist using Copilot and Claude is 3-5x more productive. A non-technical person using the same tools produces plausible-looking but fundamentally flawed analysis. The tools lower the floor but raise the ceiling. Invest in fundamentals first.</p>

<p><em>Update this note monthly as the tool landscape evolves. Current date: March 2026. Next review: April 2026.</em></p>`},

};


// ══════════════════════════════════════════════════════════════
// SECTION 3: AI ENGINES (Gemini + YouTube + fallbacks)
// ══════════════════════════════════════════════════════════════
const GEMINI_URL=k=>`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${k}`;
const geminiCall=async(prompt,key,opts={},signal)=>{
  if(!key)return null;
  try{
    const r=await fetch(GEMINI_URL(key),{method:"POST",signal,headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:300,temperature:0.3,...opts}})});
    if(signal?.aborted)return null;const d=await r.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text||null;
  }catch(e){return null;}
};
const claudeCall=async(prompt,opts={},signal)=>{
  if(!ANTHROPIC_KEY)return null;
  try{
    const r=await fetch("/api/claude",{method:"POST",signal,headers:{"Content-Type":"application/json"},
      body:JSON.stringify({prompt,maxTokens:opts.maxOutputTokens||300,temperature:opts.temperature??0.3})});
    if(signal?.aborted)return null;const d=await r.json();
    return d?.text||null;
  }catch(e){return null;}
};
const aiCall=async(prompt,key,opts={},signal)=>{
  if(ANTHROPIC_KEY)return claudeCall(prompt,opts,signal);
  return geminiCall(prompt,key,opts,signal);
};

// ── Copilot-style autocomplete ──
async function geminiComplete(ctx,meta,key,signal){
  const contextBlock=meta.context?`\nReference context provided by the user:\n${meta.context.slice(0,1500)}\n\nUse the above reference material to make your suggestions more accurate and specific to this subject.\n`:"";
  return aiCall(
    `You are an intelligent autocomplete engine for a note-taking app, similar to GitHub Copilot. Predict what the user will type next.\n\n`+
    `Note title: "${meta.title}"\n`+contextBlock+
    `\nCurrent content (end of note):\n${ctx}\n\n`+
    `Rules:\n`+
    `- Output ONLY the continuation text — no explanations, no quotes, no prefixes like "Here's..."\n`+
    `- Continue from EXACTLY where the text ends, do not repeat any existing text\n`+
    `- Match the writing style, formatting, and structure already used\n`+
    `- If using bullet points (- or *), continue the list naturally\n`+
    `- If using numbered items, continue the numbering\n`+
    `- Be specific and knowledgeable about the subject matter\n`+
    `- Suggest 1-4 lines maximum\n`+
    `- If the last line is incomplete, complete it first then optionally add more`,
    key,{maxOutputTokens:120,temperature:0.15,stopSequences:["\n\n\n"]},signal
  );
}

// ── Note analysis ──
async function geminiAnalyze(content,q,key,signal){
  return aiCall("Notes:\n"+content.replace(/<[^>]+>/g,"")+"\n\n"+q+"\nBe concise (3-5 sentences).",key,{maxOutputTokens:200,temperature:0.5},signal);
}

// ── YouTube search ──
async function ytSearch(query,key,max=3){if(!key)return[];try{const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${max}&key=${key}`);const d=await r.json();if(!d.items)return[];return d.items.map(i=>({t:i.snippet.title,ch:i.snippet.channelTitle,thumb:i.snippet.thumbnails?.medium?.url||"",url:`https://www.youtube.com/watch?v=${i.id.videoId}`,ty:"youtube"}));}catch(e){return[];}}

// ── LLM-powered YouTube query extraction (LLM → API pipeline) ──
async function geminiExtractTopic(content,key,signal){
  const plain=content.replace(/<[^>]+>/g,"").slice(-800);
  if(plain.length<30)return null;
  return aiCall(
    `Given these notes, extract the single most specific learning topic the user is currently writing about. Output ONLY a short YouTube search query (3-6 words), nothing else. No quotes.\n\n${plain}`,
    key,{maxOutputTokens:25,temperature:0.1},signal
  );
}

// ── Entity extraction for knowledge graph (multi-call LLM) ──
async function geminiExtractEntities(noteTitle,noteContent,key){
  if(!key||!noteContent.trim())return null;
  const plain=noteContent.replace(/<[^>]+>/g,"").slice(0,1500);
  const raw=await aiCall(
    `Analyze this note and extract key concepts.\n\nNote: "${noteTitle}"\n${plain}\n\n`+
    `Return ONLY valid JSON: {"concepts":["concept1","concept2"],"summary":"one sentence summary"}\n`+
    `Rules: 3-8 lowercase concepts (specific topics/techniques/entities). One-sentence summary. JSON only, no markdown.`,
    key,{maxOutputTokens:200,temperature:0.1}
  );
  if(!raw)return null;
  try{const m=raw.match(/\{[\s\S]*\}/);return m?JSON.parse(m[0]):null;}catch{return null;}
}

// ── Note transformer (structured JSON output → multi-format rendering) ──
async function geminiTransformNote(noteTitle,noteContent,format,key){
  if(!key)return null;
  const plain=noteContent.replace(/<[^>]+>/g,"").slice(0,2000);
  const prompts={
    quiz:`Create a quiz. Return ONLY valid JSON:\n{"questions":[{"q":"question","options":["A","B","C","D"],"answer":0,"explanation":"why"}]}\nGenerate 4-6 questions. "answer" is 0-based index of correct option.`,
    summary:`Create a structured summary. Return ONLY valid JSON:\n{"title":"title","keyPoints":["point1","point2"],"details":"2-3 sentence elaboration","connections":["related topic 1","related topic 2"]}`,
    flashcards:`Create flashcards for studying. Return ONLY valid JSON:\n{"cards":[{"front":"question or term","back":"answer or definition"}]}\nGenerate 5-8 flashcards covering key concepts.`,
    mindmap:`Create a mind map. Return ONLY valid JSON:\n{"root":"central topic","branches":[{"label":"branch","children":["sub1","sub2"]}]}\n3-5 branches with 2-4 children each.`
  };
  const raw=await aiCall(`Note: "${noteTitle}"\n\n${plain}\n\n${prompts[format]}`,key,{maxOutputTokens:800,temperature:0.3});
  if(!raw)return null;
  try{const m=raw.match(/\{[\s\S]*\}/);return m?JSON.parse(m[0]):null;}catch{return null;}
}

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
function calcKnow(notes){const t=Object.values(notes).map(n=>(n.content||"").replace(/<[^>]+>/g,"").toLowerCase()).join(" ");const r={};for(const[k,v]of Object.entries(KT)){const f=v.kw.filter(w=>t.includes(w)).length;const p=Math.min(100,Math.round(f/v.tot*100));r[k]={name:v.name,pct:p,found:f,total:v.tot,missing:v.kw.filter(w=>!t.includes(w)).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).slice(0,5)};}return r;}

// --- 3D: Next topics ---
const NXT={quantum_computing:[{topic:"Quantum Error Correction",desc:"Essential for practical quantum computers",video:"https://www.youtube.com/results?search_query=quantum+error+correction",tn:"s1"},{topic:"Quantum Machine Learning",desc:"Intersection of QC and ML",video:"https://www.youtube.com/results?search_query=quantum+machine+learning",tn:"s1"}],machine_learning:[{topic:"Transformers & Attention",desc:"Foundation of modern NLP / LLMs",video:"https://www.youtube.com/results?search_query=transformer+attention",tn:"s2"},{topic:"Reinforcement Learning",desc:"Agents, rewards, and policies",video:"https://www.youtube.com/results?search_query=reinforcement+learning",tn:"s2"},{topic:"MLOps & Deployment",desc:"Taking models to production",video:"https://www.youtube.com/results?search_query=mlops+deployment",tn:"s2"}],finance:[{topic:"Monte Carlo Simulation",desc:"Risk analysis and option pricing",video:"https://www.youtube.com/results?search_query=monte+carlo+finance",tn:"s3"},{topic:"LBO Modeling",desc:"Leveraged buyout valuation",video:"https://www.youtube.com/results?search_query=lbo+model",tn:"s3"}]};
function getNextTopics(k){const r=[];for(const[key,info]of Object.entries(k)){if(info.pct<85&&NXT[key])for(const nt of NXT[key])r.push({...nt,subject:info.name,curPct:info.pct});}return r.slice(0,5);}




// ══════════════════════════════════════════════════════════════
// SECTION 4: STYLES
// ══════════════════════════════════════════════════════════════
const S={
  app:{display:"flex",height:"100vh",width:"100%",background:"var(--t-bg)",color:"var(--t-txt)",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden",position:"relative"},
  sidebar:{width:310,minWidth:310,background:"var(--t-sidebar)",backdropFilter:"blur(24px)",borderRight:"1px solid var(--t-border)",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:2,boxShadow:"4px 0 20px rgba(0,0,0,0.08)"},
  sideScroll:{flex:1,overflowY:"auto",padding:"0 14px 14px"},
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1},
  topBar:{display:"flex",gap:6,padding:"12px 24px",borderBottom:"1px solid var(--t-border)",background:"var(--t-topbar)",backdropFilter:"blur(16px)",alignItems:"center"},
  tabBtn:a=>({padding:"8px 20px",borderRadius:10,border:`1px solid ${a?"var(--t-tab-active)":"transparent"}`,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",background:a?"var(--t-tab-active)":"transparent",color:a?"var(--t-a1)":"var(--t-txt2)",transition:"all 0.2s ease"}),
  noteBtn:(a,indent=0)=>({display:"block",width:"100%",textAlign:"left",padding:`9px 12px 9px ${14+indent*14}px`,border:"none",borderRadius:8,cursor:"pointer",fontSize:indent?12:13,fontWeight:a?600:400,background:a?"var(--t-note-active)":"transparent",color:a?"var(--t-txt)":"var(--t-txt3)",fontFamily:"'Inter',sans-serif",marginBottom:2,transition:"all 0.15s ease",lineHeight:1.4}),
  glass:{background:"var(--t-glass)",backdropFilter:"blur(12px)",border:"1px solid var(--t-border)",borderRadius:16,padding:18,marginBottom:10},
  glassAccent:{background:"var(--t-glass-accent)",backdropFilter:"blur(12px)",border:"1px solid var(--t-border)",borderRadius:16,padding:18,marginBottom:10},
  tag:c=>({display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,textTransform:"uppercase",background:CM[c]?.bg||"var(--t-glass)",color:CM[c]?.color||"var(--t-txt2)"}),
  sh:{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--t-a1)",letterSpacing:".5px",textTransform:"uppercase",marginBottom:8,fontWeight:600},
  sh2:{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--t-txt3)",letterSpacing:".5px",textTransform:"uppercase",marginBottom:8,fontWeight:600},
  sh3:{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--t-purple)",letterSpacing:".5px",textTransform:"uppercase",marginBottom:8,fontWeight:600},
  editor:{minHeight:350,outline:"none",padding:"24px 32px",fontFamily:"'Inter',sans-serif",fontSize:16,lineHeight:1.85,color:"var(--t-txt)",background:"transparent"},
  toolbar:{display:"flex",flexWrap:"wrap",gap:3,padding:"8px 16px",borderBottom:"1px solid var(--t-border)",background:"var(--t-topbar)",backdropFilter:"blur(12px)",alignItems:"center"},
  toolBtn:{padding:"6px 9px",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,background:"transparent",color:"var(--t-txt3)",fontFamily:"'Inter',sans-serif",transition:"all 0.15s ease",display:"inline-flex",alignItems:"center",justifyContent:"center"},
  sugPanel:{width:320,minWidth:320,borderLeft:"1px solid var(--t-border)",background:"var(--t-bg2)",backdropFilter:"blur(16px)",overflowY:"auto",padding:20},
  statCard:{background:"var(--t-glass)",backdropFilter:"blur(12px)",border:"1px solid var(--t-border)",borderRadius:16,padding:"16px 20px",textAlign:"center",flex:1},
  statN:{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,background:"var(--t-grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  statL:{fontSize:10,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:".7px",marginTop:4},
  pBar:{height:6,borderRadius:6,background:"var(--t-pbar)",overflow:"hidden",margin:"4px 0"},
  pFill:(p,c)=>({height:"100%",borderRadius:6,width:`${p}%`,background:c||"var(--t-grad)",transition:"width .5s"}),
};

// ══════════════════════════════════════════════════════════════
// SECTION 5: RICH EDITOR
// ══════════════════════════════════════════════════════════════
function RichEditor({content,onChange,ghostData,onAcceptGhost,noteId,loading,onShowFiles,sectionColors,confidence,onSetConfidence}){
  const ref=useRef(null);const[init,setInit]=useState(false);const prev=useRef(noteId);const[dropOver,setDropOver]=useState(false);
  const[fontSize,setFontSize]=useState("16");
  const[showColorPicker,setShowColorPicker]=useState(false);const[showHighlightPicker,setShowHighlightPicker]=useState(false);
  const colorRef=useRef(null);const highlightRef=useRef(null);
  const FONT_COLORS=["#f1f5f9","#7b93f5","#f0abfc","#f59e0b","#06b6d4","#ff5c5c","#22c55e","#b0bec5"];
  const HIGHLIGHT_COLORS=["transparent","rgba(102,126,234,.25)","rgba(240,147,251,.2)","rgba(245,158,11,.25)","rgba(6,182,212,.2)","rgba(255,92,92,.2)","rgba(34,197,94,.2)","rgba(148,163,184,.15)"];
  // Close color pickers on outside click
  useEffect(()=>{
    const h=e=>{if(colorRef.current&&!colorRef.current.contains(e.target))setShowColorPicker(false);
      if(highlightRef.current&&!highlightRef.current.contains(e.target))setShowHighlightPicker(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  useEffect(()=>{if(noteId!==prev.current){setInit(false);prev.current=noteId;}},[noteId]);
  useEffect(()=>{if(ref.current&&!init){ref.current.innerHTML=content||"";setInit(true);}},[content,init]);
  // Section coloring: apply alternating bg colors to headings only + inject confidence dropdowns
  const applySectionColors=useCallback(()=>{
    if(!ref.current||!sectionColors)return;
    // Reset previous section coloring
    ref.current.querySelectorAll('[data-ntsc]').forEach(el=>{el.style.borderLeft='';el.style.paddingLeft='';el.style.paddingRight='';el.style.background='';el.style.borderRadius='';el.style.marginBottom='';el.style.display='';el.style.alignItems='';el.style.justifyContent='';el.style.position='';el.removeAttribute('data-ntsc');});
    // Remove old confidence dropdowns
    ref.current.querySelectorAll('.nt-conf-wrap').forEach(el=>el.remove());
    const headings=[...ref.current.querySelectorAll('h2,h3')];
    if(!headings.length)return;
    headings.forEach((h,i)=>{
      const c=sectionColors[i%sectionColors.length];
      h.style.background=c.bg;
      h.style.borderLeft=`3px solid ${c.border}`;
      h.style.paddingLeft='10px';
      h.style.paddingRight='60px';
      h.style.borderRadius='6px';
      h.style.marginBottom='4px';
      h.style.position='relative';
      h.setAttribute('data-ntsc','1');
      // Inject confidence dropdown next to heading
      const wrap=document.createElement('span');
      wrap.className='nt-conf-wrap';if(i===0)wrap.setAttribute('data-tut','confidence');
      wrap.setAttribute('contenteditable','false');
      wrap.style.cssText='position:absolute;right:8px;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;gap:4px;z-index:5;';
      const score=(confidence||{})[`${noteId}:${i}`]||0;
      const sel=document.createElement('select');
      sel.style.cssText=`background:${score>0?(score>=7?'rgba(34,197,94,0.15)':score>=4?'rgba(245,158,11,0.15)':'rgba(255,92,92,0.15)'):'var(--t-glass)'};border:1px solid ${score>0?(score>=7?'#22c55e44':score>=4?'#f59e0b44':'#ff5c5c44'):'var(--t-border)'};color:${score>0?(score>=7?'#22c55e':score>=4?'#f59e0b':'#ff5c5c'):'var(--t-txt2)'};border-radius:6px;padding:2px 4px;font-size:11px;font-weight:700;cursor:pointer;font-family:'JetBrains Mono',monospace;outline:none;-webkit-appearance:none;appearance:none;min-width:42px;text-align:center;`;
      const defOpt=document.createElement('option');defOpt.value='0';defOpt.textContent='—';defOpt.style.background='var(--t-bg2)';sel.appendChild(defOpt);
      for(let n=1;n<=10;n++){const o=document.createElement('option');o.value=String(n);o.textContent=String(n);o.style.background='var(--t-bg2)';if(n===score)o.selected=true;sel.appendChild(o);}
      if(score>0)defOpt.selected=false;
      const idx=i;
      sel.addEventListener('change',e=>{const v=parseInt(e.target.value);if(onSetConfidence)onSetConfidence(noteId,idx,v);});
      wrap.appendChild(sel);
      h.appendChild(wrap);
    });
  },[sectionColors,noteId,confidence,onSetConfidence]);
  useEffect(()=>{if(init)requestAnimationFrame(applySectionColors);},[init,applySectionColors]);
  // Ghost: inject inline span at cursor, accept with TAB
  useEffect(()=>{
    const old=ref.current?.querySelector("#nt-ghost");if(old)old.remove();
    if(!ghostData||!ref.current)return;
    const text=(typeof ghostData==="string"?ghostData:ghostData.ghost).split("\n").filter(l=>l.trim()).slice(0,4).join("\n");
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount||!ref.current.contains(sel.anchorNode))return;
    const ghost=document.createElement("span");ghost.id="nt-ghost";ghost.setAttribute("contenteditable","false");
    ghost.textContent=text;ghost.style.cssText="color:rgba(102,126,234,.5);pointer-events:none;user-select:none;white-space:pre-wrap;font-style:italic;animation:ghostIn .25s ease;";
    if(!document.getElementById("nt-ghost-anim")){const st=document.createElement("style");st.id="nt-ghost-anim";st.textContent="@keyframes ghostIn{from{opacity:0}to{opacity:1}}";document.head.appendChild(st);}
    const r=sel.getRangeAt(0).cloneRange();r.collapse(false);r.insertNode(ghost);
    const nr=document.createRange();nr.setStartBefore(ghost);nr.collapse(true);
    sel.removeAllRanges();sel.addRange(nr);
  },[ghostData]);
  const onInput=useCallback(()=>{
    const g=ref.current?.querySelector("#nt-ghost");if(g)g.remove();
    if(ref.current)onChange(ref.current.innerHTML);
    requestAnimationFrame(applySectionColors);
  },[onChange,applySectionColors]);
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
    if(e.key==="Escape"){const g=ref.current?.querySelector("#nt-ghost");if(g){g.remove();onAcceptGhost();}}
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
      if(document.caretRangeFromPoint){const rng=document.caretRangeFromPoint(e.clientX,e.clientY);if(rng){const s=window.getSelection();s.removeAllRanges();s.addRange(rng);}}
      else if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(e.clientX,e.clientY);if(p){const rng=document.createRange();rng.setStart(p.offsetNode,p.offset);rng.collapse(true);const s=window.getSelection();s.removeAllRanges();s.addRange(rng);}}
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
  const sep=<span style={{width:1,height:22,background:"var(--t-border)",margin:"0 3px",flexShrink:0}}/>;
  // ── Ribbon tab state ──
  const[ribbonTab,setRibbonTab]=useState("home");
  // ── Drawing state ──
  const canvasRef=useRef(null);const[drawing,setDrawing]=useState(false);const[drawTool,setDrawTool]=useState("pen");
  const[drawColor,setDrawColor]=useState("#7b93f5");const[drawSize,setDrawSize]=useState(3);const drawCtx=useRef(null);
  const[showCanvas,setShowCanvas]=useState(false);
  const startDraw=useCallback(e=>{if(!canvasRef.current)return;const c=drawCtx.current;if(!c)return;setDrawing(true);const r=canvasRef.current.getBoundingClientRect();c.beginPath();c.moveTo(e.clientX-r.left,e.clientY-r.top);},[]);
  const moveDraw=useCallback(e=>{if(!drawing||!drawCtx.current||!canvasRef.current)return;const r=canvasRef.current.getBoundingClientRect();const c=drawCtx.current;
    if(drawTool==="eraser"){c.globalCompositeOperation="destination-out";c.lineWidth=drawSize*4;}
    else{c.globalCompositeOperation="source-over";c.strokeStyle=drawColor;c.lineWidth=drawSize;}
    c.lineCap="round";c.lineJoin="round";c.lineTo(e.clientX-r.left,e.clientY-r.top);c.stroke();},[drawing,drawTool,drawColor,drawSize]);
  const endDraw=useCallback(()=>setDrawing(false),[]);
  useEffect(()=>{if(showCanvas&&canvasRef.current){const c=canvasRef.current.getContext("2d");drawCtx.current=c;}},[showCanvas]);
  // ── Comments state ──
  const[comments,setComments]=useState([]);const[showComments,setShowComments]=useState(false);const[newComment,setNewComment]=useState("");
  const addComment=()=>{if(!newComment.trim())return;const sel=window.getSelection()?.toString()||"";setComments(p=>[...p,{id:Date.now(),text:newComment.trim(),selection:sel,author:"You",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),resolved:false}]);setNewComment("");};
  // ── Share state ──
  const[showShare,setShowShare]=useState(false);const[shareEmail,setShareEmail]=useState("");const[collaborators,setCollaborators]=useState([{name:"You",email:"owner",color:"#7b93f5",online:true}]);
  const[shareLink]=useState(()=>`notiq.app/share/${Math.random().toString(36).slice(2,10)}`);
  const[copied,setCopied]=useState(false);
  const addCollab=()=>{if(!shareEmail.trim()||!shareEmail.includes("@"))return;const colors=["#f0abfc","#06b6d4","#f59e0b","#22c55e","#ff5c5c"];
    setCollaborators(p=>[...p,{name:shareEmail.split("@")[0],email:shareEmail,color:colors[p.length%colors.length],online:false}]);setShareEmail("");};
  const copyLink=()=>{navigator.clipboard?.writeText("https://"+shareLink);setCopied(true);setTimeout(()=>setCopied(false),2000);};

  const DRAW_COLORS=["#000000","#ff0000","#7b93f5","#f59e0b","#22c55e","#f0abfc","#06b6d4","#f1f5f9"];
  const tabStyle=t=>({padding:"6px 16px",fontSize:12,fontWeight:ribbonTab===t?700:500,color:ribbonTab===t?"#7b93f5":"#b0bec5",background:"transparent",border:"none",borderBottom:ribbonTab===t?"2px solid #7b93f5":"2px solid transparent",cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.15s"});

  // ── Ribbon content per tab ──
  const HomeRibbon=()=>(<>
    <button className="tool-btn" onClick={()=>exec("undo")} style={S.toolBtn} title="Undo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-11.36L1 10"/></svg></button>
    <button className="tool-btn" onClick={()=>exec("redo")} style={S.toolBtn} title="Redo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-5.64-11.36L23 10"/></svg></button>
    {sep}
    <select className="tool-btn" onChange={e=>{if(e.target.value){document.execCommand("fontName",false,e.target.value);ref.current?.focus();onInput();}}} style={{...S.toolBtn,cursor:"pointer",background:"transparent",minWidth:100}} title="Font">
      <option value="Inter">Inter</option><option value="JetBrains Mono">JetBrains Mono</option><option value="Georgia">Georgia</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Courier New">Courier New</option>
    </select>
    <select className="tool-btn" value={fontSize} onChange={e=>{setFontSize(e.target.value);document.execCommand("fontSize",false,"7");const fonts=ref.current?.querySelectorAll('font[size="7"]');if(fonts)fonts.forEach(f=>{f.removeAttribute("size");f.style.fontSize=e.target.value+"px";});ref.current?.focus();onInput();}} style={{...S.toolBtn,cursor:"pointer",background:"transparent",width:50}} title="Size">
      {[10,11,12,14,16,18,20,24,28,32,36,48].map(s=><option key={s} value={s}>{s}</option>)}
    </select>
    <select className="tool-btn" onChange={e=>{if(e.target.value)exec("formatBlock",e.target.value);e.target.value="";}} style={{...S.toolBtn,cursor:"pointer",background:"transparent",minWidth:72}} title="Styles"><option value="">Styles</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="p">Normal</option></select>
    {sep}
    <button className="tool-btn" onClick={()=>exec("bold")} style={S.toolBtn} title="Bold"><b>B</b></button>
    <button className="tool-btn" onClick={()=>exec("italic")} style={S.toolBtn} title="Italic"><i>I</i></button>
    <button className="tool-btn" onClick={()=>exec("underline")} style={S.toolBtn} title="Underline"><u>U</u></button>
    <button className="tool-btn" onClick={()=>exec("strikeThrough")} style={S.toolBtn} title="Strike"><s>ab</s></button>
    <button className="tool-btn" onClick={()=>exec("subscript")} style={S.toolBtn} title="Sub">x<sub style={{fontSize:8}}>2</sub></button>
    <button className="tool-btn" onClick={()=>exec("superscript")} style={S.toolBtn} title="Super">x<sup style={{fontSize:8}}>2</sup></button>
    {sep}
    <div ref={colorRef} style={{position:"relative"}}><button className="tool-btn" onClick={()=>{setShowColorPicker(!showColorPicker);setShowHighlightPicker(false);}} style={{...S.toolBtn,display:"flex",alignItems:"center",gap:2}} title="Font Color"><span style={{fontWeight:700}}>A</span><span style={{width:14,height:3,background:"linear-gradient(90deg,#7b93f5,#f0abfc)",borderRadius:1,display:"block"}}/></button>
      {showColorPicker&&<div style={{position:"absolute",top:"100%",left:0,zIndex:99,background:"rgba(13,14,20,0.95)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:8,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>{FONT_COLORS.map(c=><button key={c} onClick={()=>{exec("foreColor",c);setShowColorPicker(false);}} style={{width:22,height:22,borderRadius:4,border:"1px solid rgba(255,255,255,0.1)",background:c,cursor:"pointer"}}/>)}</div>}</div>
    <div ref={highlightRef} style={{position:"relative"}}><button className="tool-btn" onClick={()=>{setShowHighlightPicker(!showHighlightPicker);setShowColorPicker(false);}} style={{...S.toolBtn,display:"flex",alignItems:"center",gap:2}} title="Highlight"><span style={{background:"rgba(245,158,11,.3)",padding:"0 3px",borderRadius:2,fontWeight:700}}>ab</span></button>
      {showHighlightPicker&&<div style={{position:"absolute",top:"100%",left:0,zIndex:99,background:"rgba(13,14,20,0.95)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:8,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>{HIGHLIGHT_COLORS.map((c,i)=><button key={i} onClick={()=>{exec("hiliteColor",c);setShowHighlightPicker(false);}} style={{width:22,height:22,borderRadius:4,border:"1px solid rgba(255,255,255,0.1)",background:c||"repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px",cursor:"pointer"}}/>)}</div>}</div>
    {sep}
    <button className="tool-btn" onClick={()=>exec("justifyLeft")} style={S.toolBtn} title="Left"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg></button>
    <button className="tool-btn" onClick={()=>exec("justifyCenter")} style={S.toolBtn} title="Center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="14" x2="6" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg></button>
    <button className="tool-btn" onClick={()=>exec("justifyRight")} style={S.toolBtn} title="Right"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="7" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg></button>
    {sep}
    <button className="tool-btn" onClick={()=>exec("insertUnorderedList")} style={S.toolBtn} title="Bullets"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg></button>
    <button className="tool-btn" onClick={()=>exec("insertOrderedList")} style={S.toolBtn} title="Numbered"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fill="currentColor" fontSize="7" fontFamily="sans-serif">1</text><text x="2" y="14" fill="currentColor" fontSize="7" fontFamily="sans-serif">2</text><text x="2" y="20" fill="currentColor" fontSize="7" fontFamily="sans-serif">3</text></svg></button>
    <button className="tool-btn" onClick={()=>exec("indent")} style={S.toolBtn} title="Indent"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/><polyline points="3 8 7 12 3 16"/></svg></button>
    <button className="tool-btn" onClick={()=>exec("outdent")} style={S.toolBtn} title="Outdent"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/><polyline points="7 8 3 12 7 16"/></svg></button>
    {sep}
    <button className="tool-btn" onClick={()=>exec("removeFormat")} style={S.toolBtn} title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="3" y1="21" x2="21" y2="3" strokeOpacity="0.5"/></svg></button>
  </>);

  const InsertRibbon=()=>(<>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<table style="width:100%;border-collapse:collapse;margin:8px 0"><tr><th style="border:1px solid rgba(255,255,255,.08);padding:6px 10px;background:rgba(255,255,255,.03)">Col 1</th><th style="border:1px solid rgba(255,255,255,.08);padding:6px 10px;background:rgba(255,255,255,.03)">Col 2</th><th style="border:1px solid rgba(255,255,255,.08);padding:6px 10px;background:rgba(255,255,255,.03)">Col 3</th></tr><tr><td style="border:1px solid rgba(255,255,255,.08);padding:6px 10px">&mdash;</td><td style="border:1px solid rgba(255,255,255,.08);padding:6px 10px">&mdash;</td><td style="border:1px solid rgba(255,255,255,.08);padding:6px 10px">&mdash;</td></tr></table>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Table">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg><span style={{fontSize:9}}>Table</span>
    </button>
    <button className="tool-btn" onClick={()=>{const input=document.createElement("input");input.type="file";input.accept="image/*";input.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{document.execCommand("insertHTML",false,`<img src="${ev.target.result}" style="max-width:100%;border-radius:8px;margin:8px 0" />`);ref.current?.focus();onInput();};r.readAsDataURL(f);};input.click();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Pictures">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style={{fontSize:9}}>Pictures</span>
    </button>
    <button className="tool-btn" onClick={()=>{const u=prompt("URL:");if(u)exec("createLink",u);}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Links">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg><span style={{fontSize:9}}>Links</span>
    </button>
    {sep}
    <button className="tool-btn" onClick={()=>{setShowComments(true);setNewComment("");}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Comment">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span style={{fontSize:9}}>Comment</span>
    </button>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0">');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Horizontal Rule">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="12" x2="22" y2="12"/></svg><span style={{fontSize:9}}>Line</span>
    </button>
    <button className="tool-btn" onClick={()=>exec("formatBlock","blockquote")} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Block Quote">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg><span style={{fontSize:9}}>Quote</span>
    </button>
    <button className="tool-btn" onClick={()=>exec("formatBlock","pre")} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Code Block">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg><span style={{fontSize:9}}>Code</span>
    </button>
    {sep}
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<div style="text-align:center;padding:16px 0;font-size:11px;color:#8492a6;border-top:1px solid rgba(255,255,255,0.06)">Header — '+new Date().toLocaleDateString()+'</div>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Header">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7V5h18v2"/><path d="M3 19v-2h18v2" strokeOpacity="0.3"/><line x1="12" y1="5" x2="12" y2="10"/></svg><span style={{fontSize:9}}>Header</span>
    </button>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<div style="text-align:center;padding:16px 0;font-size:11px;color:#8492a6;border-bottom:1px solid rgba(255,255,255,0.06)">Footer — Page 1</div>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Footer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 17v2h18v-2"/><path d="M3 5v2h18V5" strokeOpacity="0.3"/><line x1="12" y1="14" x2="12" y2="19"/></svg><span style={{fontSize:9}}>Footer</span>
    </button>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<span style="font-family:JetBrains Mono,monospace;font-size:13px;background:rgba(255,255,255,.04);padding:2px 6px;border-radius:4px;color:#7b93f5">E = mc²</span>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Equation">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><text x="4" y="16" fill="currentColor" fontSize="14" fontFamily="serif" fontStyle="italic">fx</text></svg><span style={{fontSize:9}}>Equation</span>
    </button>
    <button className="tool-btn" onClick={()=>{const sym=prompt("Enter symbol (e.g. ©, ™, §, →, ±, ≈, ∞, Σ, Δ):");if(sym)document.execCommand("insertText",false,sym);ref.current?.focus();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Symbol">
      <span style={{fontSize:18,lineHeight:1}}>Ω</span><span style={{fontSize:9}}>Symbol</span>
    </button>
    {sep}
    <button className="tool-btn" onClick={onShowFiles} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2,color:"#7b93f5"}} title="Files">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span style={{fontSize:9}}>Files</span>
    </button>
  </>);

  const DrawRibbon=()=>(<>
    <button className="tool-btn" onClick={()=>{setDrawTool("pen");if(!showCanvas)setShowCanvas(true);}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2,background:drawTool==="pen"&&showCanvas?"rgba(123,147,245,0.15)":"transparent",color:drawTool==="pen"&&showCanvas?"#7b93f5":"#b0bec5"}} title="Draw">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg><span style={{fontSize:9}}>Draw</span>
    </button>
    <button className="tool-btn" onClick={()=>{setDrawTool("eraser");if(!showCanvas)setShowCanvas(true);}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2,background:drawTool==="eraser"&&showCanvas?"rgba(123,147,245,0.15)":"transparent",color:drawTool==="eraser"&&showCanvas?"#7b93f5":"#b0bec5"}} title="Eraser">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 20H7L3 16l8-8 9 9-4 4"/><path d="M6 11l4 4"/></svg><span style={{fontSize:9}}>Eraser</span>
    </button>
    {sep}
    {DRAW_COLORS.map(c=><button key={c} onClick={()=>{setDrawColor(c);setDrawTool("pen");if(!showCanvas)setShowCanvas(true);}} style={{width:24,height:24,borderRadius:6,border:drawColor===c&&showCanvas?"2px solid #7b93f5":"2px solid transparent",background:c,cursor:"pointer",flexShrink:0,transition:"border-color 0.15s"}}/>)}
    {sep}
    <span style={{fontSize:10,color:"#8492a6",marginRight:4}}>Size</span>
    <input type="range" min="1" max="12" value={drawSize} onChange={e=>setDrawSize(+e.target.value)} style={{width:80,accentColor:"#7b93f5"}}/>
    <span style={{fontSize:10,color:"#b0bec5",marginLeft:4,fontFamily:"'JetBrains Mono',monospace"}}>{drawSize}px</span>
    {sep}
    <button className="tool-btn" onClick={()=>setShowCanvas(!showCanvas)} style={{...S.toolBtn,color:showCanvas?"#7b93f5":"#8492a6",fontWeight:600}}>{showCanvas?"Canvas ON":"Canvas OFF"}</button>
    {showCanvas&&<button className="tool-btn" onClick={()=>{if(canvasRef.current){const c=canvasRef.current.getContext("2d");c.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);}}} style={{...S.toolBtn,color:"#ff5c5c"}}>Clear Canvas</button>}
  </>);

  const ReviewRibbon=()=>(<>
    <button className="tool-btn" onClick={()=>setShowComments(!showComments)} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2,color:showComments?"#7b93f5":"#b0bec5"}} title="Comments">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span style={{fontSize:9}}>Comments{comments.length>0?` (${comments.length})`:""}</span>
    </button>
    <button className="tool-btn" onClick={()=>{const sel=window.getSelection()?.toString();if(sel){const hl=`<mark style="background:rgba(102,126,234,0.25);padding:1px 3px;border-radius:3px">${sel}</mark>`;document.execCommand("insertHTML",false,hl);ref.current?.focus();onInput();}}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Track Changes">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg><span style={{fontSize:9}}>Track</span>
    </button>
    <button className="tool-btn" onClick={()=>{const count=(ref.current?.innerText||"").split(/\s+/).filter(Boolean).length;const chars=(ref.current?.innerText||"").length;alert(`Word count: ${count}\nCharacters: ${chars}\nParagraphs: ${(ref.current?.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li")||[]).length}`);}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Word Count">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg><span style={{fontSize:9}}>Count</span>
    </button>
    {sep}
    <button className="tool-btn" onClick={()=>{if(ref.current){const text=ref.current.innerText;const utterance=new SpeechSynthesisUtterance(text.slice(0,500));speechSynthesis.speak(utterance);}}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Read Aloud">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg><span style={{fontSize:9}}>Read Aloud</span>
    </button>
  </>);

  const ReferencesRibbon=()=>(<>
    <button className="tool-btn" onClick={()=>{const toc=[];ref.current?.querySelectorAll("h1,h2,h3").forEach((h,i)=>{toc.push(`<div style="padding:3px 0;padding-left:${(parseInt(h.tagName[1])-1)*16}px;font-size:${h.tagName==="H1"?14:h.tagName==="H2"?13:12}px;color:#b0bec5;cursor:pointer">${h.textContent}</div>`);});if(toc.length){document.execCommand("insertHTML",false,`<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 16px;margin:8px 0"><div style="font-size:11px;font-weight:700;color:#7b93f5;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Table of Contents</div>${toc.join("")}</div>`);ref.current?.focus();onInput();}else alert("Add headings (H1, H2, H3) to generate a table of contents.");}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Table of Contents">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3"/><line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3"/><line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3"/></svg><span style={{fontSize:9}}>TOC</span>
    </button>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<sup style="color:#7b93f5;font-size:10px;cursor:pointer">[1]</sup>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Insert Footnote">
      <span style={{fontSize:16,fontFamily:"serif"}}>ab<sup style={{fontSize:10,color:"#7b93f5"}}>1</sup></span><span style={{fontSize:9}}>Footnote</span>
    </button>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<div style="background:rgba(255,255,255,.03);border-left:3px solid #7b93f5;padding:8px 12px;margin:8px 0;border-radius:0 8px 8px 0;font-size:12px;color:#b0bec5">[Citation: Author, Year. Title. Source.]</div>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Insert Citation">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg><span style={{fontSize:9}}>Citation</span>
    </button>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 16px;margin:8px 0"><div style="font-size:11px;font-weight:700;color:#7b93f5;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Bibliography</div><div style="font-size:12px;color:#b0bec5;line-height:1.8">[1] Author, A. (Year). <em>Title</em>. Publisher.<br/>[2] Author, B. (Year). <em>Title</em>. Journal, Vol(Issue).</div></div>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Bibliography">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg><span style={{fontSize:9}}>Biblio</span>
    </button>
    <button className="tool-btn" onClick={()=>{document.execCommand("insertHTML",false,'<div style="text-align:center;padding:6px;font-size:11px;color:#8492a6;margin:8px 0"><em>Figure 1: [Caption text]</em></div>');ref.current?.focus();onInput();}} style={{...S.toolBtn,flexDirection:"column",padding:"6px 12px",gap:2}} title="Insert Caption">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="14" rx="2"/><line x1="3" y1="21" x2="21" y2="21"/></svg><span style={{fontSize:9}}>Caption</span>
    </button>
  </>);

  return(
    <div data-tut="editor" style={{border:`1px solid ${dropOver?"rgba(102,126,234,0.4)":"var(--t-border)"}`,borderRadius:20,overflow:"hidden",background:dropOver?"rgba(102,126,234,.04)":"var(--t-glass)",backdropFilter:"blur(12px)",flex:1,display:"flex",flexDirection:"column",transition:"border-color .2s",boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}} onDragStart={handleBlockDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* ── Ribbon Tab Bar ── */}
      <div style={{display:"flex",alignItems:"center",padding:"0 10px",borderBottom:"1px solid var(--t-border)",background:"var(--t-topbar)",gap:0}}>
        {[["home","Home"],["insert","Insert"],["draw","Draw"],["references","References"],["review","Review"]].map(([k,lb])=>(<button key={k} onClick={()=>setRibbonTab(k)} style={tabStyle(k)}>{lb}</button>))}
        <div style={{flex:1}}/>
        {/* Share button in ribbon bar */}
        <button className="tool-btn" onClick={()=>setShowShare(true)} style={{...S.toolBtn,background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",borderRadius:8,padding:"5px 14px",fontWeight:600,fontSize:11,marginRight:4}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share
        </button>
        {/* Collaborator avatars */}
        <div style={{display:"flex",marginLeft:4}}>
          {collaborators.map((c,i)=>(<div key={i} style={{width:24,height:24,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",marginLeft:i>0?-6:0,border:"2px solid rgba(8,9,13,0.8)",position:"relative",zIndex:collaborators.length-i}} title={c.name}>
            {c.name[0].toUpperCase()}
            {c.online&&<span style={{position:"absolute",bottom:-1,right:-1,width:7,height:7,borderRadius:"50%",background:"#22c55e",border:"1.5px solid rgba(8,9,13,0.8)"}}/>}
          </div>))}
        </div>
      </div>
      {/* ── Ribbon Content ── */}
      <div style={{...S.toolbar,padding:"4px 10px",minHeight:38}}>
        {ribbonTab==="home"&&<HomeRibbon/>}
        {ribbonTab==="insert"&&<InsertRibbon/>}
        {ribbonTab==="draw"&&<DrawRibbon/>}
        {ribbonTab==="references"&&<ReferencesRibbon/>}
        {ribbonTab==="review"&&<ReviewRibbon/>}
      </div>
      {/* ── Editor + Canvas + Comments ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",position:"relative"}}>
          <div ref={ref} contentEditable suppressContentEditableWarning onInput={onInput} onKeyDown={onKey} style={{...S.editor,display:showCanvas?"block":"block"}}/>
          {showCanvas&&<canvas ref={canvasRef} width={800} height={600} onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
            style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",cursor:drawTool==="eraser"?"cell":"crosshair",pointerEvents:"auto",zIndex:2}}/>}
          {loading&&<div style={{position:"absolute",bottom:8,right:14,fontSize:11,color:T.a2,fontFamily:"'JetBrains Mono',monospace",opacity:.7,pointerEvents:"none",background:"rgba(0,0,0,.4)",padding:"4px 10px",borderRadius:8,backdropFilter:"blur(8px)",zIndex:5}}>AI thinking...</div>}
          {ghostData&&!loading&&!showCanvas&&<div style={{position:"absolute",bottom:8,left:20,fontSize:11,color:T.txt2,fontFamily:"'JetBrains Mono',monospace",opacity:.6,pointerEvents:"none",background:"rgba(0,0,0,.3)",padding:"3px 10px",borderRadius:8,zIndex:5}}>TAB to accept  ·  ESC to dismiss</div>}
        </div>
        {/* ── Comments Panel ── */}
        {showComments&&<div style={{width:260,minWidth:260,borderLeft:"1px solid var(--t-border)",background:"var(--t-glass)",overflowY:"auto",padding:14,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:"#7b93f5",textTransform:"uppercase",letterSpacing:"0.5px"}}>Comments</span>
            <button onClick={()=>setShowComments(false)} style={{border:"none",background:"transparent",color:"#8492a6",cursor:"pointer",fontSize:16}}>{"\u00d7"}</button>
          </div>
          <div style={{display:"flex",gap:4,marginBottom:12}}>
            <input className="nq-input" value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Add a comment..." style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt)",fontSize:12,outline:"none",transition:"border-color 0.2s"}} onKeyDown={e=>{if(e.key==="Enter")addComment();}}/>
            <button className="grad-btn" onClick={addComment} style={{padding:"8px 12px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>+</button>
          </div>
          {comments.length===0&&<div style={{fontSize:12,color:"#8492a6",textAlign:"center",padding:20}}>No comments yet. Select text and add a comment.</div>}
          {comments.map(c=>(<div key={c.id} style={{padding:10,borderRadius:10,background:c.resolved?"rgba(34,197,94,0.05)":"var(--t-glass)",border:`1px solid ${c.resolved?"rgba(34,197,94,0.15)":"var(--t-border)"}`,marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:11,fontWeight:600,color:"#f1f5f9"}}>{c.author}</span>
              <span style={{fontSize:9,color:"#8492a6"}}>{c.time}</span>
            </div>
            {c.selection&&<div style={{fontSize:10,color:"#7b93f5",background:"rgba(123,147,245,0.08)",padding:"3px 6px",borderRadius:4,marginBottom:4,fontStyle:"italic"}}>"{c.selection.slice(0,60)}{c.selection.length>60?"...":""}"</div>}
            <div style={{fontSize:12,color:"#b0bec5",lineHeight:1.5}}>{c.text}</div>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <button onClick={()=>setComments(p=>p.map(x=>x.id===c.id?{...x,resolved:!x.resolved}:x))} style={{fontSize:10,color:c.resolved?"#22c55e":"#8492a6",background:"transparent",border:"none",cursor:"pointer"}}>{c.resolved?"Resolved":"Resolve"}</button>
              <button onClick={()=>setComments(p=>p.filter(x=>x.id!==c.id))} style={{fontSize:10,color:"#ff5c5c",background:"transparent",border:"none",cursor:"pointer"}}>Delete</button>
            </div>
          </div>))}
        </div>}
      </div>
      {/* ── Share Modal ── */}
      {showShare&&<div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)setShowShare(false);}}>
        <div style={{width:440,background:"var(--t-bg2)",border:"1px solid var(--t-border)",borderRadius:24,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h3 style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:800,color:"var(--t-txt)",margin:0}}>Share Note</h3>
            <button onClick={()=>setShowShare(false)} style={{border:"none",background:"transparent",color:"var(--t-txt2)",cursor:"pointer",fontSize:20}}>{"\u00d7"}</button>
          </div>
          {/* Invite */}
          <label style={{fontSize:11,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6,display:"block"}}>Invite People</label>
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            <input className="nq-input" value={shareEmail} onChange={e=>setShareEmail(e.target.value)} placeholder="Email address..." style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt)",fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif"}} onKeyDown={e=>{if(e.key==="Enter")addCollab();}}/>
            <button className="grad-btn" onClick={addCollab} style={{padding:"10px 20px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Invite</button>
          </div>
          {/* Share link */}
          <label style={{fontSize:11,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6,display:"block"}}>Share Link</label>
          <div style={{display:"flex",gap:6,marginBottom:20}}>
            <div style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt2)",fontSize:12,fontFamily:"'JetBrains Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shareLink}</div>
            <button onClick={copyLink} style={{padding:"10px 16px",borderRadius:10,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:copied?"#22c55e":"var(--t-txt2)",fontSize:12,fontWeight:600,cursor:"pointer",transition:"color 0.2s"}}>{copied?"Copied!":"Copy"}</button>
          </div>
          {/* Collaborators */}
          <label style={{fontSize:11,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8,display:"block"}}>People with Access</label>
          {collaborators.map((c,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<collaborators.length-1?"1px solid var(--t-border)":"none"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",position:"relative"}}>
              {c.name[0].toUpperCase()}
              {c.online&&<span style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:"#22c55e",border:"2px solid var(--t-bg2)"}}/>}
            </div>
            <div style={{flex:1}}><div style={{fontSize:13,color:"var(--t-txt)",fontWeight:500}}>{c.name}</div><div style={{fontSize:11,color:"var(--t-txt2)"}}>{c.email==="owner"?"Owner":c.email}</div></div>
            <span style={{fontSize:11,color:c.online?"#22c55e":"var(--t-txt2)"}}>{c.online?"Online":"Invited"}</span>
            {c.email!=="owner"&&<button onClick={()=>setCollaborators(p=>p.filter((_,j)=>j!==i))} style={{border:"none",background:"transparent",color:"var(--t-txt2)",cursor:"pointer",fontSize:14}}>{"\u00d7"}</button>}
          </div>))}
        </div>
      </div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTIQ LOGO — custom SVG wordmark
// ══════════════════════════════════════════════════════════════
function NotiqLogo({size=24,animated=false,style={}}){
  const id=animated?"_nqA":"_nqS";
  return(<>
    {animated&&<style>{`@keyframes nqGrad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>}
    <span style={{fontSize:size,fontWeight:800,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:"-1px",background:animated?"linear-gradient(270deg,#7b93f5,#9571cd,#f0abfc,#7b93f5)":"linear-gradient(135deg,#7b93f5,#9571cd,#f0abfc)",backgroundSize:animated?"300% 300%":"100% 100%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:animated?"nqGrad 4s ease infinite":"none",display:"inline-block",...style}}>NOTIQ</span>
  </>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 5B: NEW NOTE MODAL (with context + file upload for RAG)
// ══════════════════════════════════════════════════════════════
function NewNoteModal({folders,activeFolder,activeSubfolder,onClose,onCreate}){
  const[name,setName]=useState("");const[context,setContext]=useState("");
  const[subfolder,setSubfolder]=useState(activeSubfolder||"");const[files,setFiles]=useState([]);
  const[parsing,setParsing]=useState(false);
  const handleFiles=async(fileList)=>{
    setParsing(true);
    const parsed=[];
    for(const f of [...fileList]){
      const text=await new Promise(res=>{
        const r=new FileReader();
        r.onload=e=>{
          if(f.type.startsWith("text/")||f.name.endsWith(".md")||f.name.endsWith(".csv")||f.name.endsWith(".txt")){
            res(e.target.result);
          }else if(f.type==="application/pdf"){
            // For PDFs, store the data URL and extract what we can
            res("[PDF file: "+f.name+"] — Content will be used as context for AI features.");
          }else{
            res(e.target.result);
          }
        };
        if(f.type.startsWith("text/")||f.name.endsWith(".md")||f.name.endsWith(".csv")||f.name.endsWith(".txt")){
          r.readAsText(f);
        }else{
          r.readAsDataURL(f);
        }
      });
      parsed.push({name:f.name,type:f.type,size:f.size,text:typeof text==="string"&&!text.startsWith("data:")?text:"",dataUrl:typeof text==="string"&&text.startsWith("data:")?text:null});
    }
    setFiles(p=>[...p,...parsed]);
    setParsing(false);
  };
  const submit=()=>{
    if(!name.trim())return;
    // Combine all file text into RAG context
    const ragText=files.filter(f=>f.text).map(f=>`--- ${f.name} ---\n${f.text}`).join("\n\n");
    const fullContext=(context.trim()+(ragText?"\n\n[Uploaded Reference Materials]\n"+ragText:"")).trim();
    const filesMeta=files.map(f=>({name:f.name,type:f.type,size:f.size,text:f.text,dataUrl:f.dataUrl}));
    onCreate(name.trim(),subfolder,fullContext,filesMeta);
    onClose();
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:520,maxHeight:"85vh",overflowY:"auto",background:"var(--t-bg2)",border:"1px solid var(--t-border)",borderRadius:24,padding:32,boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:800,color:"var(--t-txt)",margin:0,letterSpacing:"-0.5px"}}>Create New Note</h2>
          <button onClick={onClose} style={{border:"none",background:"transparent",color:"var(--t-txt2)",cursor:"pointer",fontSize:20,padding:4}}>{"\u00d7"}</button>
        </div>

        {/* Note Name */}
        <label style={{fontSize:12,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6,display:"block"}}>Note Title</label>
        <input className="nq-input" autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Prototyping Class Notes" style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt)",fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif",marginBottom:18,transition:"border-color 0.2s, box-shadow 0.2s",boxSizing:"border-box"}}
          onKeyDown={e=>{if(e.key==="Enter")submit();}}/>

        {/* Folder */}
        <label style={{fontSize:12,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6,display:"block"}}>Subfolder</label>
        <select value={subfolder} onChange={e=>setSubfolder(e.target.value)} style={{width:"100%",padding:"10px 14px",borderRadius:12,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt)",fontSize:14,outline:"none",fontFamily:"'Inter',sans-serif",marginBottom:18,cursor:"pointer",boxSizing:"border-box"}}>
          <option value="">Select a subfolder...</option>
          {folders.map(f=>(f.children||[]).map(sub=><option key={sub.id} value={sub.id}>{f.name} / {sub.name}</option>))}
        </select>

        {/* Context */}
        <label style={{fontSize:12,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6,display:"block"}}>Context / Description</label>
        <textarea className="nq-input" value={context} onChange={e=>setContext(e.target.value)} placeholder="Describe what this note is about — e.g. 'Notes for my prototyping class. We cover wireframing, user testing, and Figma. The final project is designing a mobile app prototype.'" rows={4} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt)",fontSize:14,outline:"none",fontFamily:"'Inter',sans-serif",lineHeight:1.6,resize:"vertical",marginBottom:18,transition:"border-color 0.2s, box-shadow 0.2s",boxSizing:"border-box"}}/>

        {/* File Upload */}
        <label style={{fontSize:12,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6,display:"block"}}>Reference Files (slides, PDFs, documents)</label>
        <div onClick={()=>document.getElementById("newNoteFileInput")?.click()}
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="rgba(123,147,245,0.5)";}}
          onDragLeave={e=>{e.currentTarget.style.borderColor="var(--t-border)";}}
          onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="var(--t-border)";handleFiles(e.dataTransfer.files);}}
          style={{border:"2px dashed var(--t-border)",borderRadius:14,padding:20,textAlign:"center",cursor:"pointer",marginBottom:12,transition:"border-color 0.2s",background:"var(--t-glass)"}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t-a1)" strokeWidth="1.5" style={{marginBottom:6}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div style={{fontSize:13,color:"var(--t-txt2)"}}>Drop files here or click to browse</div>
          <div style={{fontSize:11,color:"var(--t-txt2)",marginTop:4,opacity:0.7}}>PDF, text, markdown, CSV — content used as AI context</div>
          <input id="newNoteFileInput" type="file" multiple accept=".pdf,.txt,.md,.csv,.doc,.docx,.pptx" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
        </div>
        {parsing&&<div style={{fontSize:12,color:"var(--t-a1)",marginBottom:8}}>Parsing files...</div>}
        {files.length>0&&<div style={{marginBottom:18}}>
          {files.map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"var(--t-glass)",border:"1px solid var(--t-border)",marginBottom:4}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t-a1)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span style={{flex:1,fontSize:12,color:"var(--t-txt)"}}>{f.name}</span>
            <span style={{fontSize:10,color:"var(--t-txt2)"}}>{(f.size/1024).toFixed(0)}KB</span>
            {f.text&&<span style={{fontSize:9,color:"var(--t-a1)",padding:"1px 6px",borderRadius:4,background:"rgba(123,147,245,0.1)"}}>parsed</span>}
            <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{border:"none",background:"transparent",color:"var(--t-txt2)",cursor:"pointer",fontSize:14,padding:2}}>{"\u00d7"}</button>
          </div>))}
        </div>}

        {/* Actions */}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"10px 20px",borderRadius:12,border:"1px solid var(--t-border)",background:"transparent",color:"var(--t-txt2)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Cancel</button>
          <button className="grad-btn" onClick={submit} disabled={!name.trim()} style={{padding:"10px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",opacity:name.trim()?1:0.5}}>Create Note</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION 6: SIDEBAR (hierarchical)
// ══════════════════════════════════════════════════════════════
function Sidebar({folders,notes,activeNote,activeFolder,activeSubfolder,onSelect,onSelectFolder,onSelectSubfolder,onCreateFolder,onCreateSubfolder,onSelectParent,onSelectFolderView,onSelectSubfolderView,onOpenNewNote}){
  const[nf,setNf]=useState(false);const[fn,setFn]=useState("");
  const[nsf,setNsf]=useState(null);const[sfn,setSfn]=useState("");
  const[expanded,setExpanded]=useState(()=>{const m={};folders.forEach(f=>m[f.id]=true);return m;});
  const toggleExpand=id=>setExpanded(p=>({...p,[id]:!p[id]}));
  return(
    <div data-tut="sidebar" style={S.sidebar}>
      <div style={{padding:"20px 18px 0"}}><NotiqLogo size={24}/><div style={{fontSize:11,color:"#8492a6",marginBottom:16,marginTop:4}}>AI-powered notes</div></div>
      <div style={{padding:"0 14px 12px",borderBottom:"1px solid var(--t-border)"}}>
        <button data-tut="new-note" className="grad-btn" onClick={onOpenNewNote} style={{width:"100%",padding:"11px 16px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Note
        </button>
      </div>
      <div style={S.sideScroll}>
        {folders.map(f=>(<div key={f.id}>
          {/* Root folder */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"14px 0 5px",cursor:"pointer"}} onClick={()=>{toggleExpand(f.id);onSelectFolder(f.id);onSelectFolderView(f.id);}}>
            <span style={{fontSize:9,color:"#8492a6",transition:"transform 0.2s",transform:expanded[f.id]?"rotate(90deg)":"rotate(0)",display:"inline-block"}}>{"\u25b6"}</span>
            <span className="folder-title" style={{fontSize:11,fontWeight:700,color:f.id===activeFolder&&!activeSubfolder?"#7b93f5":"#8492a6",letterSpacing:"0.5px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{f.name}</span>
            <span style={{fontSize:9,color:"#8492a6",marginLeft:"auto",fontFamily:"'JetBrains Mono',monospace"}}>{getAllFolderNoteIds(f).length}</span>
          </div>
          {/* Subfolders */}
          {expanded[f.id]&&f.children?.map(sub=>(<div key={sub.id} style={{paddingLeft:8}}>
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"6px 0 4px",cursor:"pointer"}} onClick={()=>{onSelectFolder(f.id);onSelectSubfolder(sub.id);onSelectSubfolderView(sub.id);}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={activeSubfolder===sub.id?"#7b93f5":"#8492a6"} strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              <span style={{fontSize:12,fontWeight:activeSubfolder===sub.id?600:400,color:activeSubfolder===sub.id?"#7b93f5":"#b0bec5",flex:1}}>{sub.name}</span>
              <span style={{fontSize:9,color:"#8492a6",fontFamily:"'JetBrains Mono',monospace"}}>{(sub.notes||[]).length}</span>
            </div>
            {/* Notes in subfolder */}
            {(sub.notes||[]).map(nid=>{const n=notes[nid];if(!n||n.parent)return null;const ch=n.children?.length>0;return(<div key={nid}>
              <button className="note-btn" style={S.noteBtn(nid===activeNote,1)} onClick={()=>{ch?onSelectParent(nid):onSelect(nid);onSelectFolder(f.id);onSelectSubfolder(sub.id);}}>{ch?"\u25b8 ":""}{n.title.length>28?n.title.slice(0,28)+"\u2026":n.title}</button>
              {ch&&n.children.map(cid=>{const cn=notes[cid];if(!cn)return null;return <button key={cid} className="note-btn" style={S.noteBtn(cid===activeNote,2)} onClick={()=>{onSelect(cid);onSelectFolder(f.id);onSelectSubfolder(sub.id);}}>{cn.title}</button>;})}
            </div>);})}
            {/* Add subfolder note button */}
          </div>))}
          {/* Add subfolder */}
          {expanded[f.id]&&<div style={{paddingLeft:8,marginTop:2}}>
            {nsf===f.id?(<div style={{display:"flex",gap:3,padding:"2px 0"}}><input className="nq-input" value={sfn} onChange={e=>setSfn(e.target.value)} placeholder="Subfolder..." autoFocus style={{flex:1,padding:"5px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#f1f5f9",fontSize:10,outline:"none"}} onKeyDown={e=>{if(e.key==="Enter"&&sfn.trim()){onCreateSubfolder(f.id,sfn.trim());setSfn("");setNsf(null);}if(e.key==="Escape")setNsf(null);}}/><button className="grad-btn" onClick={()=>{if(sfn.trim()){onCreateSubfolder(f.id,sfn.trim());setSfn("");setNsf(null);}}} style={{padding:"5px 8px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:9,fontWeight:600,cursor:"pointer"}}>+</button></div>):(<button onClick={()=>setNsf(f.id)} style={{...S.noteBtn(false,1),color:"#8492a6",fontSize:10}}>+ Subfolder</button>)}
          </div>}
        </div>))}
        <div style={{marginTop:10}}>
          {nf?(<div style={{display:"flex",gap:4}}><input className="nq-input" value={fn} onChange={e=>setFn(e.target.value)} placeholder="Root folder..." autoFocus style={{flex:1,padding:"7px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#f1f5f9",fontSize:11,outline:"none"}} onKeyDown={e=>{if(e.key==="Enter"&&fn.trim()){onCreateFolder(fn.trim());setFn("");setNf(false);}if(e.key==="Escape")setNf(false);}}/><button className="grad-btn" onClick={()=>{if(fn.trim()){onCreateFolder(fn.trim());setFn("");setNf(false);}}} style={{padding:"7px 12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer"}}>+</button></div>):(<button onClick={()=>setNf(true)} style={{...S.noteBtn(false,0),color:"#8492a6",fontSize:11}}>+ Root Folder</button>)}
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={S.sh}>Files & Resources</div><button onClick={onClose} style={{border:"none",background:"transparent",color:"#8492a6",cursor:"pointer",fontSize:16,transition:"color 0.15s"}}>\u00d7</button></div>
      <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handle(e.dataTransfer.files);}}
        style={{border:`2px dashed ${dragOver?"#7b93f5":"rgba(255,255,255,.06)"}`,borderRadius:12,padding:18,textAlign:"center",marginBottom:12,background:dragOver?"rgba(123,147,245,.06)":"transparent",cursor:"pointer",transition:"all 0.2s"}}
        onClick={()=>document.getElementById("fInput")?.click()}>
        <div style={{fontSize:12,color:dragOver?"#7b93f5":"#8492a6"}}>Drop files here</div>
        <div style={{fontSize:10,color:"#8492a6"}}>PDF, images, text</div>
        <input id="fInput" type="file" multiple accept="image/*,.pdf,.txt,.md,.csv" style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      </div>
      {files.length>0&&<div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:8}}>
        {files.map((f,i)=><button key={i} onClick={()=>setActive(i)} style={{padding:"3px 8px",borderRadius:8,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:i===active?"rgba(37,99,235,.15)":T.glass,color:i===active?T.a2:T.txt2,transition:"all 0.15s ease"}}>{f.name.length>18?f.name.slice(0,18)+"...":f.name}</button>)}
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
    style={{...S.glass,padding:18,fontSize:16,lineHeight:1.8,outline:"none",minHeight:40,cursor:"text",borderRadius:14,color:"#f1f5f9"}}
  />);
}

// ══════════════════════════════════════════════════════════════
// SECTION 8: COMBINED VIEW (folder or parent note)
// ══════════════════════════════════════════════════════════════
function CombinedView({title,items,onSelect,onAddLesson,parentId,onChangeNote,hideTitle=false}){
  const[nt,setNt]=useState("");
  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 32px"}}>
      {!hideTitle&&<h2 style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:28,margin:"0 0 6px",color:"var(--t-txt)",fontWeight:800,letterSpacing:"-0.5px"}}>{title}</h2>}
      <span style={{fontSize:13,color:"#8492a6"}}>{items.length} note{items.length!==1?"s":""}</span>
      {parentId&&<div style={{display:"flex",gap:6,margin:"12px 0"}}><input className="nq-input" value={nt} onChange={e=>setNt(e.target.value)} placeholder="Add new lesson..." style={{flex:1,padding:"8px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#f1f5f9",fontSize:13,outline:"none",transition:"border-color 0.2s, box-shadow 0.2s"}} onKeyDown={e=>{if(e.key==="Enter"&&nt.trim()){onAddLesson(nt.trim());setNt("");}}}/><button className="grad-btn" onClick={()=>{if(nt.trim()){onAddLesson(nt.trim());setNt("");}}} style={{padding:"8px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Lesson</button></div>}
      <div style={{...S.glass,padding:16,marginBottom:16}}><div style={S.sh}>Table of Contents</div>
        {items.map((c,i)=><div key={c.id} onClick={()=>onSelect(c.id)} style={{padding:"8px 10px",cursor:"pointer",fontSize:13,color:"#b0bec5",borderBottom:"1px solid rgba(255,255,255,.06)",transition:"color 0.15s"}}><span style={{color:"#7b93f5",fontWeight:600,marginRight:8}}>{i+1}.</span>{c.title}<span style={{fontSize:10,color:"#8492a6",marginLeft:8}}>{c.created}</span></div>)}
      </div>
      {items.map(c=>(<div key={c.id} style={{marginBottom:20}}>
        <h3 style={{fontSize:15,color:"#7b93f5",margin:"0 0 8px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}} onClick={()=>onSelect(c.id)}>{c.title}</h3>
        <EditableNote id={c.id} content={c.content||""} onChange={onChangeNote}/>
      </div>))}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// SECTION 9: AI SUGGESTION PANEL
// ══════════════════════════════════════════════════════════════
function SugPanel({videos,ytResults,knowledge,aiInsight,loadingYT}){
  const all=ytResults.length>0?ytResults:videos;
  return(<div data-tut="ai-panel" style={S.sugPanel}>
    <div style={S.sh}>Resources {ytResults.length>0&&<span style={{fontSize:9,color:"#7b93f5"}}>(live)</span>}</div>
    {loadingYT&&<div style={{fontSize:12,color:"#7b93f5",marginBottom:8}}>Searching YouTube...</div>}
    {all.length===0&&!loadingYT&&<p style={{fontSize:12,color:"#8492a6"}}>Type to get suggestions.</p>}
    {all.map((v,i)=>(<div key={i} draggable onDragStart={e=>{e.dataTransfer.setData("application/json",JSON.stringify({type:"youtube-video",t:v.t,ch:v.ch,v:v.v||"",url:v.url,thumb:v.thumb||""}));e.dataTransfer.effectAllowed="copy";}} style={{marginBottom:6}}><a href={v.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}><div className="res-card" style={{display:"flex",gap:8,alignItems:"center",padding:"7px 8px",borderRadius:10,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",cursor:"grab"}}>
      {v.thumb?<img src={v.thumb} alt="" style={{width:64,height:44,borderRadius:6,objectFit:"cover",flexShrink:0}}/>:<div style={{width:64,height:44,borderRadius:6,background:"linear-gradient(135deg,rgba(123,147,245,.2),rgba(149,113,205,.2))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:18,opacity:.7}}>&#9654;</span></div>}
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:"#f1f5f9",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.t}</div><div style={{fontSize:10,color:"#8492a6"}}>{v.ch}{v.v?` \u00b7 ${v.v}`:""}</div></div>
    </div></a><div style={{fontSize:9,color:"#8492a6",textAlign:"center",opacity:.45,paddingBottom:2}}>drag to pin</div></div>))}
    {aiInsight&&<div style={{marginTop:14}}><div style={S.sh2}>AI Insight</div><div style={{...S.glassAccent,padding:12,fontSize:13,color:"#b0bec5",lineHeight:1.6}}>{aiInsight}</div></div>}
    {knowledge&&<div style={{marginTop:14}}><div style={S.sh2}>Knowledge</div>{Object.values(knowledge).map((info,i)=>(<div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{fontWeight:600,color:"#f1f5f9"}}>{info.name}</span><span style={{color:"#7b93f5",fontFamily:"'JetBrains Mono',monospace"}}>{info.pct}%</span></div><div style={S.pBar}><div style={S.pFill(info.pct)}/></div></div>))}</div>}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 10: AI INSIGHTS (category-free, Gemini-powered)
// ══════════════════════════════════════════════════════════════
function InsightsPage({notes,folders,knowledge,onAddTopic,geminiKey,topicSections,confidence,insightsFolder,setInsightsFolder}){
  const[aiData,setAiData]=useState(null);const[ld,setLd]=useState(false);
  const[studyPlan,setStudyPlan]=useState(null);const[spLd,setSpLd]=useState(false);

  // Get notes for selected folder
  const selFolder=folders.find(f=>f.id===insightsFolder);
  const folderNoteIds=selFolder?getAllFolderNoteIds(selFolder):[];
  const folderNotes=folderNoteIds.map(id=>({id,...notes[id]})).filter(n=>n&&!n.children);
  const allNotes=Object.values(notes).filter(n=>!n.children);
  const totalWords=folderNotes.reduce((s,n)=>s+(n.content||"").replace(/<[^>]+>/g,"").split(/\s+/).filter(Boolean).length,0);

  // Build confidence data for this folder's notes
  const confData=[];
  folderNotes.forEach(n=>{
    const secs=topicSections[n.id]||[];
    secs.forEach((sec,i)=>{
      const score=confidence[`${n.id}:${i}`]||0;
      confData.push({noteId:n.id,noteTitle:n.title,section:sec.title,score,sectionIdx:i});
    });
  });
  const scoredTopics=confData.filter(d=>d.score>0);
  const weakTopics=scoredTopics.filter(d=>d.score<=4).sort((a,b)=>a.score-b.score);
  const strongTopics=scoredTopics.filter(d=>d.score>=7).sort((a,b)=>b.score-a.score);
  const avgConf=scoredTopics.length?Math.round(scoredTopics.reduce((s,d)=>s+d.score,0)/scoredTopics.length*10)/10:0;

  // Bar chart data: count of each confidence level 1-10
  const barData=Array.from({length:10},(_,i)=>({level:i+1,count:scoredTopics.filter(d=>d.score===i+1).length}));
  const maxBar=Math.max(1,...barData.map(b=>b.count));

  const nxt=getNextTopics(knowledge);
  const kVals=Object.values(knowledge);

  const gen=async()=>{
    if(!geminiKey)return;setLd(true);
    const digest=folderNotes.map(n=>`[${n.title}]\n${(n.content||"").replace(/<[^>]+>/g,"").slice(0,600)}`).join("\n---\n");
    const confDigest=scoredTopics.map(d=>`"${d.section}" (in ${d.noteTitle}): confidence ${d.score}/10`).join("\n");
    const prompt=`You are an intelligent note-analysis AI. Analyze the following notes from the "${selFolder?.name||"folder"}" category.
${confDigest?`\nUser confidence scores per topic:\n${confDigest}\n`:""}
Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "themes": [{"name": "Theme Name", "noteCount": 3, "icon": "emoji", "summary": "One-line summary", "insights": ["insight 1"], "actions": ["action 1"]}],
  "crossInsights": ["Cross-theme insight"],
  "weeklyFocus": "One sentence recommendation for this week",
  "strengths": ["What the user is doing well"],
  "gaps": ["What's missing or could be improved based on low confidence scores"]
}

Notes:\n${digest}`;
    try{
      const txt=await aiCall(prompt,geminiKey,{maxOutputTokens:1500,temperature:0.4});
      if(txt){setAiData(JSON.parse(txt));}
    }catch(e){console.error("Insights error:",e);}
    setLd(false);
  };

  const genStudyPlan=async()=>{
    if(!geminiKey||weakTopics.length===0)return;setSpLd(true);
    const weakDigest=weakTopics.map(d=>`"${d.section}" (confidence: ${d.score}/10, from note: ${d.noteTitle})`).join("\n");
    const prompt=`Create a focused study plan for a student who is weak in these topics:\n${weakDigest}\n\nReturn ONLY valid JSON:\n{"plan":[{"topic":"topic name","confidence":3,"priority":"high/medium","actions":["specific action 1","specific action 2"],"timeEstimate":"2 hours","resources":["resource suggestion"]}],"summary":"One paragraph overview of the study plan","schedule":"Suggested weekly schedule"}`;
    try{
      const txt=await aiCall(prompt,geminiKey,{maxOutputTokens:1200,temperature:0.4});
      if(txt){setStudyPlan(JSON.parse(txt));}
    }catch(e){console.error("Study plan error:",e);}
    setSpLd(false);
  };

  const IBox=({icon,text})=>(<div style={{...S.glassAccent,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}><span style={{fontSize:14,flexShrink:0,color:"#7b93f5"}}>{icon}</span><div style={{fontSize:13,color:"#b0bec5",lineHeight:1.6}}>{text}</div></div>);

  return(<div style={{padding:"28px 36px",overflowY:"auto",flex:1}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h2 style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:26,margin:0,color:"#f1f5f9",fontWeight:800,letterSpacing:"-0.5px"}}>Insights</h2>
        <div style={{fontSize:14,color:"#8492a6",marginTop:4}}>Analysis for <span style={{color:"#7b93f5",fontWeight:600}}>{selFolder?.name||"all notes"}</span></div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {geminiKey&&<button className="grad-btn" onClick={gen} disabled={ld} style={{padding:"10px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:13,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Analyzing...":"Generate Insights"}</button>}
      </div>
    </div>

    {/* Folder tabs */}
    <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
      {folders.map(f=>(
        <button key={f.id} onClick={()=>{setInsightsFolder(f.id);setAiData(null);setStudyPlan(null);}} style={{padding:"6px 16px",borderRadius:10,border:`1px solid ${insightsFolder===f.id?"rgba(123,147,245,.4)":"rgba(255,255,255,.06)"}`,background:insightsFolder===f.id?"rgba(123,147,245,.1)":"transparent",color:insightsFolder===f.id?"#7b93f5":"#8492a6",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>{f.name}<span style={{marginLeft:6,fontSize:10,opacity:0.6}}>{getAllFolderNoteIds(f).length}</span></button>
      ))}
    </div>

    {/* Quick stats */}
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      <div className="stat-card" style={S.statCard}><div style={S.statN}>{folderNotes.length}</div><div style={S.statL}>Notes</div></div>
      <div className="stat-card" style={S.statCard}><div style={S.statN}>{totalWords.toLocaleString()}</div><div style={S.statL}>Words</div></div>
      <div className="stat-card" style={S.statCard}><div style={S.statN}>{scoredTopics.length}</div><div style={S.statL}>Topics Rated</div></div>
      <div className="stat-card" style={S.statCard}><div style={S.statN}>{avgConf||"—"}</div><div style={S.statL}>Avg Confidence</div></div>
    </div>

    {/* ── Confidence Bar Graph ── */}
    {scoredTopics.length>0&&<div style={{...S.glass,padding:18,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={S.sh}>Confidence Distribution</div>
        <div style={{fontSize:10,color:"#8492a6"}}>{scoredTopics.length} topics rated</div>
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,padding:"0 8px"}}>
        {barData.map(b=>{const pct=b.count/maxBar*100;const color=b.level<=3?"#ff5c5c":b.level<=6?"#f59e0b":"#22c55e";return(
          <div key={b.level} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:9,color:"#b0bec5",fontFamily:"'JetBrains Mono',monospace"}}>{b.count||""}</span>
            <div style={{width:"100%",height:`${Math.max(pct,2)}%`,background:color,borderRadius:"4px 4px 0 0",transition:"height 0.5s ease",minHeight:b.count?4:1,opacity:b.count?1:0.2}}/>
            <span style={{fontSize:10,color:b.count?"#f1f5f9":"#8492a6",fontWeight:b.count?600:400}}>{b.level}</span>
          </div>
        );})}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:10,color:"#8492a6"}}>
        <span>Weak</span><span>Moderate</span><span>Strong</span>
      </div>
    </div>}

    {/* ── Weakness Trends ── */}
    {weakTopics.length>0&&<div style={{...S.glass,padding:16,marginBottom:16,borderLeft:"3px solid #ff5c5c"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={S.sh3}>Weak Areas ({weakTopics.length})</div>
        {geminiKey&&<button className="grad-btn" onClick={genStudyPlan} disabled={spLd} style={{padding:"6px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:11,fontWeight:600,cursor:spLd?"wait":"pointer",opacity:spLd?.7:1}}>{spLd?"Generating...":"Create Study Plan"}</button>}
      </div>
      {weakTopics.slice(0,8).map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<weakTopics.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
          <span style={{width:24,height:24,borderRadius:6,background:d.score<=2?"rgba(255,92,92,0.15)":"rgba(149,113,205,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:d.score<=2?"#ff5c5c":"#9571cd",flexShrink:0}}>{d.score}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:"#f1f5f9",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.section}</div>
            <div style={{fontSize:10,color:"#8492a6"}}>{d.noteTitle}</div>
          </div>
        </div>
      ))}
    </div>}

    {/* ── Strong Areas ── */}
    {strongTopics.length>0&&<div style={{...S.glass,padding:16,marginBottom:16,borderLeft:"3px solid #22c55e"}}>
      <div style={S.sh}>Strong Areas ({strongTopics.length})</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {strongTopics.slice(0,10).map((d,i)=>(
          <span key={i} style={{padding:"4px 10px",borderRadius:8,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",fontSize:11,color:"#22c55e",fontWeight:600}}>
            {d.section} <span style={{opacity:0.6}}>({d.score})</span>
          </span>
        ))}
      </div>
    </div>}

    {/* ── Study Plan ── */}
    {studyPlan&&<div style={{...S.glassAccent,padding:18,marginBottom:16,borderLeft:"3px solid #7b93f5"}}>
      <div style={{...S.sh,marginBottom:10}}>AI Study Plan</div>
      {studyPlan.summary&&<div style={{fontSize:13,color:"#b0bec5",lineHeight:1.6,marginBottom:14}}>{studyPlan.summary}</div>}
      {studyPlan.schedule&&<div style={{fontSize:12,color:"#7b93f5",marginBottom:12,padding:"8px 12px",background:"rgba(123,147,245,0.06)",borderRadius:8}}>{studyPlan.schedule}</div>}
      {studyPlan.plan?.map((item,i)=>(
        <div key={i} style={{...S.glass,padding:12,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:600,color:"#f1f5f9"}}>{item.topic}</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:item.priority==="high"?"rgba(255,92,92,0.15)":"rgba(149,113,205,0.15)",color:item.priority==="high"?"#ff5c5c":"#9571cd",fontWeight:600}}>{item.priority}</span>
              {item.timeEstimate&&<span style={{fontSize:10,color:"#8492a6"}}>{item.timeEstimate}</span>}
            </div>
          </div>
          {item.actions?.map((a,j)=><div key={j} style={{fontSize:12,color:"#b0bec5",paddingLeft:10,borderLeft:"2px solid rgba(255,255,255,0.06)",marginBottom:3,lineHeight:1.5}}>{a}</div>)}
          {item.resources?.map((r,j)=><div key={j} style={{fontSize:11,color:"#7b93f5",marginTop:4}}>Resource: {r}</div>)}
        </div>
      ))}
    </div>}

    {/* Knowledge tracker */}
    {kVals.length>0&&<div style={{marginBottom:16}}>
      <div style={S.sh}>Knowledge Tracker</div>
      {kVals.map((info,i)=>(<div key={i} style={{...S.glass,padding:12,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600}}>{info.name}</span><span style={{fontSize:12,color:T.a1,fontFamily:"'JetBrains Mono',monospace"}}>{info.pct}%</span></div>
        <div style={S.pBar}><div style={S.pFill(info.pct,info.pct>70?T.a1:info.pct>40?T.purple:T.red)}/></div>
        <div style={{fontSize:11,color:T.txt2,marginTop:2}}>{info.found}/{info.total} concepts covered</div>
        {info.missing.length>0&&<div style={{marginTop:4}}><span style={{fontSize:11,color:T.purple}}>Gaps: </span><span style={{fontSize:11,color:T.txt3}}>{info.missing.join(", ")}</span></div>}
      </div>))}
      {nxt.length>0&&<><div style={{...S.sh,marginTop:12}}>Suggested Next Topics</div>
        {nxt.map((nt,i)=>(<div key={i} style={{...S.glass,padding:10,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:13,fontWeight:600}}>{nt.topic}</div><div style={{fontSize:11,color:T.txt2}}>{nt.subject} ({nt.curPct}%)</div></div>
          <div style={{display:"flex",gap:5}}><button className="grad-btn" onClick={()=>onAddTopic(nt)} style={{padding:"4px 12px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>Add</button><a href={nt.video} target="_blank" rel="noopener noreferrer" style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${T.border}`,color:T.a2,fontSize:11,textDecoration:"none"}}>Watch</a></div>
        </div>))}</>}
    </div>}

    {!geminiKey&&<IBox icon="!" text="Add an API key (VITE_ANTHROPIC_KEY or VITE_GEMINI_KEY) in .env to unlock AI-powered insights."/>}

    {/* AI Analysis results */}
    {aiData&&<div>
      {aiData.weeklyFocus&&<div style={{...S.glassAccent,padding:14,marginBottom:14,borderLeft:`3px solid ${T.a1}`}}>
        <div style={{fontSize:10,color:T.a1,fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>This Week's Focus</div>
        <div style={{fontSize:13,color:T.txt,lineHeight:1.5}}>{aiData.weeklyFocus}</div>
      </div>}
      {aiData.themes&&<div style={{marginBottom:14}}>
        <div style={S.sh}>Detected Themes</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {aiData.themes.map((th,i)=><div key={i} style={{...S.glass,padding:12,flex:"1 1 calc(50% - 4px)",minWidth:200}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{fontSize:14,fontWeight:600}}><span style={{marginRight:6}}>{th.icon}</span>{th.name}</div>
              <span style={{fontSize:11,color:T.a2,fontFamily:"'JetBrains Mono',monospace"}}>{th.noteCount} note{th.noteCount!==1?"s":""}</span>
            </div>
            <div style={{fontSize:12,color:T.txt2,marginBottom:8}}>{th.summary}</div>
            {th.insights?.map((ins,j)=><div key={j} style={{fontSize:11,color:T.txt3,lineHeight:1.5,paddingLeft:8,borderLeft:`2px solid ${T.border}`,marginBottom:4}}>{ins}</div>)}
            {th.actions?.map((act,j)=><div key={j} style={{fontSize:11,color:T.a2,marginTop:4}}>→ {act}</div>)}
          </div>)}
        </div>
      </div>}
      {aiData.crossInsights?.length>0&&<div style={{marginBottom:14}}>
        <div style={S.sh}>Cross-Theme Insights</div>
        {aiData.crossInsights.map((ci,i)=><IBox key={i} icon="↗" text={ci}/>)}
      </div>}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {aiData.strengths?.length>0&&<div style={{flex:1}}>
          <div style={S.sh}>Strengths</div>
          {aiData.strengths.map((s,i)=><div key={i} style={{...S.glass,padding:"8px 12px",marginBottom:4,borderLeft:`3px solid ${T.a1}`}}><div style={{fontSize:12,color:T.txt3}}>{s}</div></div>)}
        </div>}
        {aiData.gaps?.length>0&&<div style={{flex:1}}>
          <div style={S.sh}>Areas to Improve</div>
          {aiData.gaps.map((g,i)=><div key={i} style={{...S.glass,padding:"8px 12px",marginBottom:4,borderLeft:`3px solid ${T.purple}`}}><div style={{fontSize:12,color:T.txt3}}>{g}</div></div>)}
        </div>}
      </div>
    </div>}

    {!aiData&&!ld&&geminiKey&&scoredTopics.length===0&&<div style={{textAlign:"center",padding:48,color:"#8492a6"}}>
      <div style={{fontSize:14,marginBottom:10,color:"#7b93f5",fontFamily:"'JetBrains Mono',monospace"}}>---</div>
      <div style={{fontSize:14,color:"#b0bec5"}}>Rate your confidence on topics in your notes, then generate insights</div>
      <div style={{fontSize:12,marginTop:6,color:"#8492a6"}}>Open a note and rate each section 1-10 using the Topics & Confidence panel below the editor</div>
    </div>}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 11B: SUMMARY PAGE
// ══════════════════════════════════════════════════════════════
function SummaryPage({notes,folders,geminiKey}){
  const[filter,setFilter]=useState({folder:"all",cat:"all"});
  const[summary,setSummary]=useState(null);const[loading,setLoading]=useState(false);

  const allNotes=Object.entries(notes).map(([id,n])=>({id,...n})).filter(n=>!n.children);
  const filtered=allNotes.filter(n=>{
    if(filter.cat!=="all"&&n.cat!==filter.cat)return false;
    if(filter.folder!=="all"){
      const f=folders.find(f=>getAllFolderNoteIds(f).includes(n.id));
      if(!f||f.id!==filter.folder)return false;
    }
    return true;
  });

  const cats=[...new Set(allNotes.map(n=>n.cat).filter(Boolean))];

  const genSummary=async()=>{
    if(!geminiKey||filtered.length===0)return;setLoading(true);
    const digest=filtered.map(n=>`[${n.title}] (${n.cat||"uncategorized"})\n${(n.content||"").replace(/<[^>]+>/g,"").slice(0,400)}`).join("\n---\n");
    const prompt=`Summarize these ${filtered.length} notes concisely. Group by theme. Return ONLY valid JSON:\n{"overview":"2-3 sentence overview","groups":[{"theme":"Theme","notes":["note title 1"],"summary":"group summary"}],"keyTakeaways":["takeaway 1","takeaway 2"]}\n\nNotes:\n${digest}`;
    try{
      const txt=await aiCall(prompt,geminiKey,{maxOutputTokens:1200,temperature:0.3});
      if(txt)setSummary(JSON.parse(txt));
    }catch(e){console.error("Summary error:",e);}
    setLoading(false);
  };

  return(<div style={{padding:"28px 36px",overflowY:"auto",flex:1}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h2 style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:26,margin:0,color:"var(--t-txt)",fontWeight:800,letterSpacing:"-0.5px"}}>Summary</h2>
        <div style={{fontSize:14,color:"var(--t-txt2)",marginTop:4}}>{filtered.length} notes</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {geminiKey&&<button className="grad-btn" onClick={genSummary} disabled={loading} style={{padding:"10px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:13,fontWeight:600,cursor:loading?"wait":"pointer",opacity:loading?.7:1}}>{loading?"Summarizing...":"Generate Summary"}</button>}
      </div>
    </div>

    {/* Filters */}
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      <select value={filter.folder} onChange={e=>setFilter(p=>({...p,folder:e.target.value}))} style={{padding:"6px 12px",borderRadius:8,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt)",fontSize:12,cursor:"pointer",outline:"none"}}>
        <option value="all">All Folders</option>
        {folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <select value={filter.cat} onChange={e=>setFilter(p=>({...p,cat:e.target.value}))} style={{padding:"6px 12px",borderRadius:8,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt)",fontSize:12,cursor:"pointer",outline:"none"}}>
        <option value="all">All Types</option>
        {cats.map(c=><option key={c} value={c}>{CM[c]?.lb||c}</option>)}
      </select>
    </div>

    {/* Note list */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:20}}>
      {filtered.map(n=>{const words=(n.content||"").replace(/<[^>]+>/g,"").split(/\s+/).filter(Boolean).length;return(
        <div key={n.id} style={{...S.glass,padding:14}}>
          <div style={{fontSize:14,fontWeight:600,color:"var(--t-txt)",marginBottom:4}}>{n.title}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {n.cat&&<span style={S.tag(n.cat)}>{CM[n.cat]?.lb||n.cat}</span>}
            <span style={{fontSize:10,color:"var(--t-txt2)"}}>{words} words</span>
            <span style={{fontSize:10,color:"var(--t-txt2)"}}>{n.created}</span>
          </div>
        </div>
      );})}
    </div>

    {/* AI Summary result */}
    {summary&&<div>
      {summary.overview&&<div style={{...S.glassAccent,padding:16,marginBottom:14,borderLeft:"3px solid var(--t-a1)"}}>
        <div style={{fontSize:10,color:"var(--t-a1)",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Overview</div>
        <div style={{fontSize:14,color:"var(--t-txt)",lineHeight:1.6}}>{summary.overview}</div>
      </div>}
      {summary.groups?.map((g,i)=><div key={i} style={{...S.glass,padding:14,marginBottom:8}}>
        <div style={{fontSize:14,fontWeight:600,color:"var(--t-txt)",marginBottom:4}}>{g.theme}</div>
        <div style={{fontSize:12,color:"var(--t-txt2)",marginBottom:6}}>{g.summary}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{g.notes?.map((t,j)=><span key={j} style={{padding:"2px 8px",borderRadius:20,fontSize:10,background:"var(--t-glass)",color:"var(--t-a1)",border:"1px solid var(--t-border)"}}>{t}</span>)}</div>
      </div>)}
      {summary.keyTakeaways?.length>0&&<div style={{...S.glassAccent,padding:14,marginBottom:14}}>
        <div style={{fontSize:10,color:"var(--t-a1)",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Key Takeaways</div>
        {summary.keyTakeaways.map((t,i)=><div key={i} style={{fontSize:13,color:"var(--t-txt3)",lineHeight:1.6,paddingLeft:10,borderLeft:"2px solid var(--t-border)",marginBottom:4}}>{t}</div>)}
      </div>}
    </div>}

    {!summary&&!loading&&<div style={{textAlign:"center",padding:48,color:"var(--t-txt2)"}}>
      <div style={{fontSize:14,marginBottom:10,color:"var(--t-a1)",fontFamily:"'JetBrains Mono',monospace"}}>---</div>
      <div style={{fontSize:14,color:"var(--t-txt3)"}}>Select filters and generate an AI summary of your notes</div>
    </div>}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 12A: KNOWLEDGE GRAPH (multi-call LLM entity extraction)
// ══════════════════════════════════════════════════════════════
function LinksPage({notes,geminiKey,onSelectNote}){
  const[links,setLinks]=useState(null);const[loading,setLoading]=useState(false);
  const[selectedNode,setSelectedNode]=useState(null);const[entities,setEntities]=useState({});
  const[progress,setProgress]=useState("");
  const[positions,setPositions]=useState({});
  const canvasRef=useRef(null);const animRef=useRef(null);const posRef=useRef({});const velRef=useRef({});
  const analyzedRef=useRef(false);const dragRef=useRef(null);const hoverRef=useRef(null);

  const analyze=useCallback(async()=>{
    if(!geminiKey||loading)return;setLoading(true);setLinks(null);setEntities({});setSelectedNode(null);
    const noteList=Object.entries(notes).filter(([_,n])=>!n.children&&(n.content||"").replace(/<[^>]+>/g,"").trim().length>20);
    const results={};
    for(let i=0;i<noteList.length;i+=4){
      const batch=noteList.slice(i,i+4);
      setProgress(`Analyzing ${Math.min(i+4,noteList.length)}/${noteList.length} notes...`);
      const promises=batch.map(([id,n])=>geminiExtractEntities(n.title,n.content||"",geminiKey).then(r=>({id,result:r})));
      const batchResults=await Promise.all(promises);
      batchResults.forEach(({id,result})=>{if(result)results[id]=result;});
    }
    setEntities(results);
    const linkMap=[];const ids=Object.keys(results);
    for(let i=0;i<ids.length;i++){
      for(let j=i+1;j<ids.length;j++){
        const a=results[ids[i]].concepts.map(c=>c.toLowerCase());
        const b=results[ids[j]].concepts.map(c=>c.toLowerCase());
        const shared=a.filter(c=>b.some(bc=>bc.includes(c)||c.includes(bc)));
        if(shared.length>0)linkMap.push({from:ids[i],to:ids[j],concepts:shared,strength:shared.length});
      }
    }
    setLinks(linkMap);setLoading(false);setProgress("");
  },[geminiKey,notes,loading]);

  // Auto-analyze on mount
  useEffect(()=>{
    if(!analyzedRef.current&&geminiKey){analyzedRef.current=true;analyze();}
  },[geminiKey,analyze]);

  // Force-directed layout simulation
  useEffect(()=>{
    if(!links||!canvasRef.current)return;
    const nodeIds=Object.keys(entities);if(nodeIds.length===0)return;
    const canvas=canvasRef.current;const ctx=canvas.getContext("2d");
    const W=canvas.width,H=canvas.height;
    // Initialize positions
    const pos={};const vel={};
    nodeIds.forEach((id,i)=>{
      const angle=(2*Math.PI*i)/nodeIds.length;
      pos[id]={x:W/2+Math.cos(angle)*(W*0.3),y:H/2+Math.sin(angle)*(H*0.3)};
      vel[id]={x:0,y:0};
    });
    posRef.current=pos;velRef.current=vel;

    const connCount={};nodeIds.forEach(id=>{connCount[id]=links.filter(l=>l.from===id||l.to===id).length;});
    const maxConn=Math.max(1,...Object.values(connCount));

    const colors=["#7b93f5","#9571cd","#f59b7b","#71cda5","#cd71b8","#71b8cd","#cdc171","#f57b93"];
    const nodeColor={};nodeIds.forEach((id,i)=>nodeColor[id]=colors[i%colors.length]);

    let frame=0;
    const draw=()=>{
      frame++;
      const cooling=Math.max(0.01,1-frame/300);
      // Force simulation
      nodeIds.forEach(id=>{vel[id]={x:0,y:0};});
      // Repulsion between all nodes
      for(let i=0;i<nodeIds.length;i++){
        for(let j=i+1;j<nodeIds.length;j++){
          const a=nodeIds[i],b=nodeIds[j];
          let dx=pos[b].x-pos[a].x,dy=pos[b].y-pos[a].y;
          const dist=Math.max(1,Math.sqrt(dx*dx+dy*dy));
          const force=800/(dist*dist);
          const fx=dx/dist*force,fy=dy/dist*force;
          vel[a].x-=fx;vel[a].y-=fy;vel[b].x+=fx;vel[b].y+=fy;
        }
      }
      // Attraction along edges
      links.forEach(l=>{
        const dx=pos[l.to].x-pos[l.from].x,dy=pos[l.to].y-pos[l.from].y;
        const dist=Math.max(1,Math.sqrt(dx*dx+dy*dy));
        const force=(dist-150)*0.005*l.strength;
        const fx=dx/dist*force,fy=dy/dist*force;
        vel[l.from].x+=fx;vel[l.from].y+=fy;vel[l.to].x-=fx;vel[l.to].y-=fy;
      });
      // Center gravity
      nodeIds.forEach(id=>{
        vel[id].x+=(W/2-pos[id].x)*0.002;
        vel[id].y+=(H/2-pos[id].y)*0.002;
      });
      // Apply velocities
      nodeIds.forEach(id=>{
        if(dragRef.current===id)return;
        pos[id].x+=vel[id].x*cooling;pos[id].y+=vel[id].y*cooling;
        pos[id].x=Math.max(40,Math.min(W-40,pos[id].x));
        pos[id].y=Math.max(40,Math.min(H-40,pos[id].y));
      });
      // Draw
      ctx.clearRect(0,0,W,H);
      // Glow effect background
      const grad=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.5);
      grad.addColorStop(0,"rgba(123,147,245,0.03)");grad.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
      // Draw edges
      links.forEach(l=>{
        const f=pos[l.from],t=pos[l.to];if(!f||!t)return;
        const isSel=selectedNode&&(l.from===selectedNode||l.to===selectedNode);
        const isHov=hoverRef.current&&(l.from===hoverRef.current||l.to===hoverRef.current);
        ctx.beginPath();ctx.moveTo(f.x,f.y);
        // Curved edges
        const mx=(f.x+t.x)/2+(f.y-t.y)*0.1,my=(f.y+t.y)/2+(t.x-f.x)*0.1;
        ctx.quadraticCurveTo(mx,my,t.x,t.y);
        ctx.strokeStyle=isSel?"rgba(123,147,245,0.6)":isHov?"rgba(149,113,205,0.4)":"rgba(123,147,245,0.12)";
        ctx.lineWidth=Math.min(3,l.strength)+(isSel||isHov?1.5:0);
        ctx.stroke();
        // Show concept label on selected/hovered edges
        if(isSel||isHov){
          ctx.fillStyle="rgba(149,113,205,0.8)";ctx.font="600 9px Inter,sans-serif";ctx.textAlign="center";
          ctx.fillText(l.concepts[0],(f.x+t.x)/2,(f.y+t.y)/2-8);
        }
      });
      // Draw nodes
      nodeIds.forEach(id=>{
        const p=pos[id];const note=notes[id];const isSel=selectedNode===id;const isHov=hoverRef.current===id;
        const conns=connCount[id]||0;const r=14+conns/maxConn*16+(isSel?4:isHov?2:0);
        const color=nodeColor[id];
        // Outer glow
        if(isSel||isHov){
          const g=ctx.createRadialGradient(p.x,p.y,r*0.5,p.x,p.y,r*2.5);
          g.addColorStop(0,color+"40");g.addColorStop(1,color+"00");
          ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r*2.5,0,Math.PI*2);ctx.fill();
        }
        // Node circle with gradient
        const ng=ctx.createRadialGradient(p.x-r*0.3,p.y-r*0.3,0,p.x,p.y,r);
        ng.addColorStop(0,color+"50");ng.addColorStop(1,color+"20");
        ctx.fillStyle=ng;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=isSel?color:color+"60";ctx.lineWidth=isSel?2.5:1;ctx.stroke();
        // Label
        ctx.fillStyle=isSel?"#f1f5f9":"#c0cad8";ctx.font=`${isSel?'700':'600'} ${isSel?11:10}px Inter,sans-serif`;ctx.textAlign="center";
        const label=(note?.title||"").length>16?(note?.title||"").slice(0,14)+"\u2026":(note?.title||"");
        ctx.fillText(label,p.x,p.y+r+14);
        // Connection count badge
        if(conns>0){
          ctx.fillStyle=color+"90";ctx.beginPath();ctx.arc(p.x+r*0.7,p.y-r*0.7,7,0,Math.PI*2);ctx.fill();
          ctx.fillStyle="#fff";ctx.font="700 8px Inter,sans-serif";ctx.fillText(conns,p.x+r*0.7,p.y-r*0.7+3);
        }
      });
      setPositions({...pos});
      animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return()=>{if(animRef.current)cancelAnimationFrame(animRef.current);};
  },[links,entities,selectedNode,notes]);

  // Canvas mouse interaction
  const handleCanvasClick=useCallback(e=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
    const mx=(e.clientX-rect.left)*scaleX,my=(e.clientY-rect.top)*scaleY;
    const nodeIds=Object.keys(entities);
    const connCount={};nodeIds.forEach(id=>{connCount[id]=(links||[]).filter(l=>l.from===id||l.to===id).length;});
    const maxC=Math.max(1,...Object.values(connCount));
    for(const id of nodeIds){
      const p=posRef.current[id];if(!p)continue;
      const r=14+(connCount[id]||0)/maxC*16+6;
      if(Math.sqrt((mx-p.x)**2+(my-p.y)**2)<r){setSelectedNode(prev=>prev===id?null:id);return;}
    }
    setSelectedNode(null);
  },[entities,links]);

  const handleCanvasMove=useCallback(e=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
    const mx=(e.clientX-rect.left)*scaleX,my=(e.clientY-rect.top)*scaleY;
    const nodeIds=Object.keys(entities);
    const connCount={};nodeIds.forEach(id=>{connCount[id]=(links||[]).filter(l=>l.from===id||l.to===id).length;});
    const maxC=Math.max(1,...Object.values(connCount));
    let found=null;
    for(const id of nodeIds){
      const p=posRef.current[id];if(!p)continue;
      const r=14+(connCount[id]||0)/maxC*16+6;
      if(Math.sqrt((mx-p.x)**2+(my-p.y)**2)<r){found=id;break;}
    }
    hoverRef.current=found;
    canvas.style.cursor=found?"pointer":"default";
  },[entities,links]);

  const nodeIds=Object.keys(entities);
  const selEnt=selectedNode&&entities[selectedNode];
  const selNote=selectedNode&&notes[selectedNode];
  const selLinks=links?.filter(l=>l.from===selectedNode||l.to===selectedNode)||[];

  return(<div style={{padding:"28px 36px",overflowY:"auto",flex:1}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
      <div><h2 style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:26,margin:0,color:"var(--t-txt)",fontWeight:800,letterSpacing:"-0.5px"}}>Knowledge Graph</h2>
        <div style={{fontSize:14,color:"var(--t-txt2)",marginTop:4}}>AI-discovered connections between your notes</div></div>
      {links&&<button className="grad-btn" onClick={()=>{analyzedRef.current=false;analyze();}} disabled={loading} style={{padding:"8px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",opacity:loading?.6:1}}>
        Re-analyze</button>}
    </div>
    {!geminiKey&&<div style={{...S.glass,padding:16,color:"var(--t-txt2)",fontSize:13}}>API key required for knowledge graph.</div>}
    {loading&&<div style={{textAlign:"center",padding:48,color:"var(--t-txt2)"}}>
      <div style={{fontSize:14,marginBottom:8,color:"var(--t-txt3)"}}>{progress}</div>
      <div style={{fontSize:12}}>Extracting concepts and finding connections...</div>
      <div style={{...S.pBar,width:200,margin:"14px auto"}}><div style={{height:"100%",borderRadius:6,background:"linear-gradient(135deg,#7b93f5,#9571cd)",animation:"pulse 1.5s ease infinite",width:"60%"}}/></div>
    </div>}
    {links&&!loading&&(<>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <div className="stat-card" style={S.statCard}><div style={S.statN}>{nodeIds.length}</div><div style={S.statL}>Notes Analyzed</div></div>
        <div className="stat-card" style={S.statCard}><div style={S.statN}>{links.length}</div><div style={S.statL}>Connections</div></div>
        <div className="stat-card" style={S.statCard}><div style={S.statN}>{[...new Set(links.flatMap(l=>l.concepts))].length}</div><div style={S.statL}>Shared Concepts</div></div>
      </div>
      <div style={{display:"flex",gap:14}}>
        <div style={{...S.glass,padding:0,overflow:"hidden",flex:2,borderRadius:20,position:"relative"}}>
          <canvas ref={canvasRef} width={800} height={600} onClick={handleCanvasClick} onMouseMove={handleCanvasMove}
            style={{width:"100%",height:500,display:"block",background:"rgba(0,0,0,0.15)",borderRadius:20}}/>
        </div>
        <div style={{flex:1,minWidth:220}}>
          {selEnt&&selNote?(<div style={{...S.glassAccent,padding:16,borderRadius:16}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--t-txt)",marginBottom:4}}>{selNote.title}</div>
            <div style={{fontSize:11,color:"var(--t-txt2)",margin:"8px 0 10px",lineHeight:1.5}}>{selEnt.summary}</div>
            <div style={S.sh2}>Concepts</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
              {selEnt.concepts.map((c,i)=><span key={i} style={{padding:"3px 10px",borderRadius:20,fontSize:11,background:"rgba(123,147,245,0.1)",color:"var(--t-a1)",border:"1px solid rgba(123,147,245,0.2)"}}>{c}</span>)}
            </div>
            {selLinks.length>0&&<><div style={S.sh2}>Connected To</div>
              {selLinks.map((l,i)=>{const oid=l.from===selectedNode?l.to:l.from;return(
                <div key={i} onClick={()=>setSelectedNode(oid)} style={{padding:"8px 10px",marginBottom:4,cursor:"pointer",fontSize:12,borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",transition:"background 0.15s"}}>
                  <span style={{fontWeight:600,color:"var(--t-txt)"}}>{notes[oid]?.title}</span>
                  <div style={{fontSize:10,color:"var(--t-txt2)",marginTop:2}}>via <span style={{color:"var(--t-a2)"}}>{l.concepts.join(", ")}</span></div>
                </div>);})}</>}
            <button className="grad-btn" onClick={()=>{onSelectNote(selectedNode);}} style={{marginTop:10,padding:"7px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%"}}>Open Note</button>
          </div>):(<div style={{...S.glass,padding:16,textAlign:"center",color:"var(--t-txt2)",fontSize:12,borderRadius:16}}>Click a node to see its concepts and connections</div>)}
        </div>
      </div>
      {links.length===0&&<div style={{...S.glass,padding:14,textAlign:"center",color:"var(--t-txt2)",fontSize:13,marginTop:12}}>No connections found. Add more detailed content to discover links between notes.</div>}
    </>)}
  </div>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 12B: AI NOTE TRANSFORMER (structured JSON → multi-format)
// ══════════════════════════════════════════════════════════════
function TransformPanel({note,geminiKey,onClose}){
  const[format,setFormat]=useState(null);const[result,setResult]=useState(null);
  const[loading,setLoading]=useState(false);const[quizAnswers,setQuizAnswers]=useState({});
  const[flipped,setFlipped]=useState({});
  const transform=async(fmt)=>{
    setFormat(fmt);setResult(null);setLoading(true);setQuizAnswers({});setFlipped({});
    const r=await geminiTransformNote(note.title,note.content||"",fmt,geminiKey);
    setResult(r);setLoading(false);
  };
  const qLen=result?.questions?.length||0;
  const answered=Object.keys(quizAnswers).length;
  const quizScore=result?.questions?result.questions.reduce((s,q,i)=>s+(quizAnswers[i]===q.answer?1:0),0):0;
  return(<div style={{...S.sugPanel,width:340,minWidth:340}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={S.sh}>AI Transform</div>
      <button onClick={onClose} style={{border:"none",background:"transparent",color:"#8492a6",cursor:"pointer",fontSize:16,transition:"color 0.15s"}}>{"\u00d7"}</button>
    </div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
      {[["quiz","Quiz"],["summary","Summary"],["flashcards","Flashcards"],["mindmap","Mind Map"]].map(([k,lb])=>(
        <button key={k} onClick={()=>transform(k)} disabled={loading} style={{padding:"6px 14px",borderRadius:10,border:`1px solid ${format===k?"rgba(123,147,245,.4)":"rgba(255,255,255,.06)"}`,background:format===k?"rgba(123,147,245,.1)":"transparent",color:format===k?"#7b93f5":"#8492a6",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.2s ease"}}>{lb}</button>
      ))}
    </div>
    {loading&&<div style={{textAlign:"center",padding:20,color:T.txt2,fontSize:12}}>
      <div style={{...S.pBar,width:120,margin:"8px auto"}}><div style={{height:"100%",borderRadius:7,background:"var(--t-grad)",animation:"pulse 1.5s ease infinite",width:"70%"}}/></div>
      Generating {format}...</div>}

    {/* ── Quiz ── */}
    {format==="quiz"&&result?.questions&&(<div>
      {result.questions.map((q,qi)=>(<div key={qi} style={{...S.glass,padding:10,marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>{qi+1}. {q.q}</div>
        {q.options.map((opt,oi)=>{
          const done=quizAnswers[qi]!==undefined;const correct=oi===q.answer;const picked=quizAnswers[qi]===oi;
          let bg=T.glass,bdr=T.border,clr=T.txt;
          if(done&&correct){bg="rgba(39,174,96,.15)";bdr="rgba(39,174,96,.4)";clr="var(--t-a1)";}
          else if(done&&picked&&!correct){bg="rgba(192,57,43,.1)";bdr="rgba(192,57,43,.3)";clr="var(--t-red)";}
          return(<button key={oi} className="quiz-opt" onClick={()=>{if(!done)setQuizAnswers(p=>({...p,[qi]:oi}));}}
            style={{display:"block",width:"100%",textAlign:"left",padding:"5px 10px",marginBottom:3,borderRadius:6,border:`1px solid ${bdr}`,background:bg,color:clr,fontSize:11,cursor:done?"default":"pointer",fontFamily:"'Inter',sans-serif"}}>{String.fromCharCode(65+oi)}. {opt}</button>);
        })}
        {quizAnswers[qi]!==undefined&&q.explanation&&<div style={{fontSize:10,color:T.txt2,marginTop:4,fontStyle:"italic"}}>{q.explanation}</div>}
      </div>))}
      {answered===qLen&&qLen>0&&(<div style={{...S.glassAccent,padding:12,textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,background:T.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{quizScore}/{qLen}</div>
        <div style={{fontSize:11,color:T.txt2}}>{quizScore===qLen?"Perfect score!":quizScore>=qLen*.7?"Great job!":"Keep studying!"}</div>
      </div>)}
    </div>)}

    {/* ── Summary ── */}
    {format==="summary"&&result&&(<div>
      {result.title&&<div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{result.title}</div>}
      {result.keyPoints&&(<div style={{...S.glass,padding:10,marginBottom:8}}>
        <div style={S.sh2}>Key Points</div>
        {result.keyPoints.map((p,i)=><div key={i} style={{fontSize:12,color:T.txt3,marginBottom:4,paddingLeft:8,borderLeft:`2px solid var(--t-a2)`}}>{p}</div>)}
      </div>)}
      {result.details&&<div style={{...S.glass,padding:10,marginBottom:8}}><div style={S.sh2}>Details</div><div style={{fontSize:12,color:T.txt3,lineHeight:1.6}}>{result.details}</div></div>}
      {result.connections?.length>0&&(<div style={{...S.glass,padding:10}}><div style={S.sh2}>Related Topics</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{result.connections.map((c,i)=><span key={i} style={{padding:"2px 8px",borderRadius:20,fontSize:10,background:T.glass,color:"var(--t-a2)",border:`1px solid ${T.border}`}}>{c}</span>)}</div>
      </div>)}
    </div>)}

    {/* ── Flashcards ── */}
    {format==="flashcards"&&result?.cards&&(<div>
      {result.cards.map((card,i)=>(<div key={i} className="flash-card" onClick={()=>setFlipped(p=>({...p,[i]:!p[i]}))}
        style={{...S.glass,padding:14,marginBottom:6,cursor:"pointer",minHeight:70,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",transition:"all .25s",background:flipped[i]?"var(--t-glass-accent)":T.glass,transform:flipped[i]?"scale(0.98)":"scale(1)"}}>
        <div>
          <div style={{fontSize:9,color:T.txt2,marginBottom:4,textTransform:"uppercase",letterSpacing:".5px"}}>{flipped[i]?"Answer":"Question"} {"\u00b7"} {i+1}/{result.cards.length}</div>
          <div style={{fontSize:13,fontWeight:flipped[i]?400:600,color:flipped[i]?T.txt3:T.txt,lineHeight:1.5}}>{flipped[i]?card.back:card.front}</div>
        </div>
      </div>))}
      <div style={{fontSize:10,color:T.txt2,textAlign:"center",marginTop:4}}>Click cards to flip</div>
    </div>)}

    {/* ── Mind Map ── */}
    {format==="mindmap"&&result&&(<div>
      <div style={{...S.glassAccent,padding:12,textAlign:"center",marginBottom:8}}>
        <div style={{fontSize:15,fontWeight:700,background:T.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{result.root}</div>
      </div>
      {result.branches?.map((b,i)=>(<div key={i} style={{...S.glass,padding:10,marginBottom:6}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--t-a1)",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:["var(--t-blue)","var(--t-purple)","var(--t-cyan)","var(--t-pink)","var(--t-red)"][i%5],flexShrink:0}}/>{b.label}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,paddingLeft:14}}>
          {b.children?.map((c,j)=><span key={j} style={{padding:"3px 10px",borderRadius:20,fontSize:11,background:T.glass,color:T.txt3,border:`1px solid ${T.border}`}}>{c}</span>)}
        </div>
      </div>))}
    </div>)}

    {!format&&!loading&&<div style={{fontSize:12,color:"#8492a6",textAlign:"center",padding:24}}>
      <div style={{fontSize:24,marginBottom:8,opacity:.3,color:"#7b93f5"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14 2 9.2h7.6z"/></svg></div>
      Transform "{note.title}" into a different format using AI
    </div>}
  </div>);
}

function NoteInsightsPanel({noteIds,notes,topicSections,confidence,geminiKey,title,onClose}){
  const[studyPlan,setStudyPlan]=useState(null);const[spLd,setSpLd]=useState(false);

  // Gather confidence data for the given noteIds
  const confData=[];
  noteIds.forEach(nid=>{
    const secs=topicSections[nid]||[];
    secs.forEach((sec,i)=>{
      const score=confidence[`${nid}:${i}`]||0;
      if(score>0)confData.push({noteId:nid,noteTitle:notes[nid]?.title||"",section:sec.title,score,sectionIdx:i});
    });
  });
  const avgConf=confData.length?Math.round(confData.reduce((s,d)=>s+d.score,0)/confData.length*10)/10:0;
  const weakTopics=confData.filter(d=>d.score<=4).sort((a,b)=>a.score-b.score);
  const strongTopics=confData.filter(d=>d.score>=7).sort((a,b)=>b.score-a.score);
  const barData=Array.from({length:10},(_,i)=>({level:i+1,count:confData.filter(d=>d.score===i+1).length}));
  const maxBar=Math.max(1,...barData.map(b=>b.count));

  const genStudyPlan=async()=>{
    if(!geminiKey||weakTopics.length===0)return;setSpLd(true);
    const weakDigest=weakTopics.map(d=>`"${d.section}" (confidence: ${d.score}/10, from note: ${d.noteTitle})`).join("\n");
    const prompt=`Create a focused study plan for a student who is weak in these topics:\n${weakDigest}\n\nReturn ONLY valid JSON:\n{"plan":[{"topic":"topic name","confidence":3,"priority":"high/medium","actions":["action 1","action 2"],"timeEstimate":"2 hours","resources":["resource"]}],"summary":"One paragraph overview","schedule":"Suggested weekly schedule"}`;
    try{
      const txt=await aiCall(prompt,geminiKey,{maxOutputTokens:1200,temperature:0.3});
      if(txt)setStudyPlan(JSON.parse(txt));
    }catch(e){console.error("Study plan error:",e);}
    setSpLd(false);
  };

  return(<div style={{background:"var(--t-bg2)",border:"1px solid var(--t-border)",borderRadius:16,padding:20,marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{fontSize:15,fontWeight:700,color:"var(--t-txt)"}}>Insights — {title}</div>
      <button onClick={onClose} style={{border:"none",background:"transparent",color:"var(--t-txt2)",cursor:"pointer",fontSize:18}}>{"\u00d7"}</button>
    </div>

    {/* Quick stats row */}
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <div style={{flex:1,background:"var(--t-glass)",border:"1px solid var(--t-border)",borderRadius:12,padding:"10px 14px",textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,background:"var(--t-grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{confData.length}</div>
        <div style={{fontSize:9,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>Topics Rated</div>
      </div>
      <div style={{flex:1,background:"var(--t-glass)",border:"1px solid var(--t-border)",borderRadius:12,padding:"10px 14px",textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,background:"var(--t-grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{avgConf||"\u2014"}</div>
        <div style={{fontSize:9,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>Avg Confidence</div>
      </div>
      <div style={{flex:1,background:"var(--t-glass)",border:"1px solid var(--t-border)",borderRadius:12,padding:"10px 14px",textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:"var(--t-red)"}}>{weakTopics.length}</div>
        <div style={{fontSize:9,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>Weak Areas</div>
      </div>
      <div style={{flex:1,background:"var(--t-glass)",border:"1px solid var(--t-border)",borderRadius:12,padding:"10px 14px",textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:"#22c55e"}}>{strongTopics.length}</div>
        <div style={{fontSize:9,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>Strong</div>
      </div>
    </div>

    {/* Bar graph */}
    {confData.length>0&&<div style={{background:"var(--t-glass)",border:"1px solid var(--t-border)",borderRadius:12,padding:14,marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:600,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Confidence Distribution</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80}}>
        {barData.map(b=>{const pct=b.count/maxBar*100;const color=b.level<=3?"var(--t-red)":b.level<=6?"var(--t-purple)":"#22c55e";return(
          <div key={b.level} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:8,color:"var(--t-txt2)",fontFamily:"'JetBrains Mono',monospace"}}>{b.count||""}</span>
            <div style={{width:"100%",height:`${Math.max(pct,3)}%`,background:color,borderRadius:"3px 3px 0 0",transition:"height 0.4s",minHeight:b.count?3:1,opacity:b.count?1:0.15}}/>
            <span style={{fontSize:9,color:b.count?"var(--t-txt)":"var(--t-txt2)",fontWeight:b.count?600:400}}>{b.level}</span>
          </div>
        );})}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:9,color:"var(--t-txt2)"}}>
        <span>Weak</span><span>Moderate</span><span>Strong</span>
      </div>
    </div>}

    {/* Weak topics list */}
    {weakTopics.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:600,color:"var(--t-purple)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Weak Areas</div>
      {weakTopics.map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<weakTopics.length-1?"1px solid var(--t-border)":"none"}}>
          <span style={{width:22,height:22,borderRadius:6,background:"rgba(255,92,92,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--t-red)",flexShrink:0}}>{d.score}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--t-txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.section}</div>
            <div style={{fontSize:10,color:"var(--t-txt2)"}}>{d.noteTitle}</div>
          </div>
        </div>
      ))}
    </div>}

    {/* Strong topics */}
    {strongTopics.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:600,color:"#22c55e",textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Strong Areas</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        {strongTopics.map((d,i)=>(
          <span key={i} style={{padding:"3px 8px",borderRadius:6,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",fontSize:10,color:"#22c55e",fontWeight:600}}>{d.section} ({d.score})</span>
        ))}
      </div>
    </div>}

    {/* Study plan button + results */}
    {weakTopics.length>0&&<div>
      {!studyPlan&&<button className="grad-btn" onClick={genStudyPlan} disabled={spLd} style={{width:"100%",padding:"10px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:12,fontWeight:600,cursor:spLd?"wait":"pointer",opacity:spLd?.7:1}}>{spLd?"Generating Study Plan...":"Generate Study Plan"}</button>}
      {studyPlan&&<div style={{marginTop:10}}>
        <div style={{fontSize:10,fontWeight:600,color:"var(--t-a1)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>AI Study Plan</div>
        {studyPlan.summary&&<div style={{fontSize:12,color:"var(--t-txt2)",lineHeight:1.5,marginBottom:10}}>{studyPlan.summary}</div>}
        {studyPlan.schedule&&<div style={{fontSize:11,color:"var(--t-a1)",marginBottom:10,padding:"6px 10px",background:"rgba(123,147,245,0.06)",borderRadius:8}}>{studyPlan.schedule}</div>}
        {studyPlan.plan?.map((item,i)=>(
          <div key={i} style={{background:"var(--t-glass)",border:"1px solid var(--t-border)",borderRadius:10,padding:10,marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--t-txt)"}}>{item.topic}</div>
              <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:item.priority==="high"?"rgba(255,92,92,0.12)":"rgba(149,113,205,0.12)",color:item.priority==="high"?"var(--t-red)":"var(--t-purple)",fontWeight:600}}>{item.priority}</span>
            </div>
            {item.actions?.map((a,j)=><div key={j} style={{fontSize:11,color:"var(--t-txt2)",paddingLeft:8,borderLeft:"2px solid var(--t-border)",marginBottom:2,lineHeight:1.4}}>{a}</div>)}
            {item.timeEstimate&&<div style={{fontSize:10,color:"var(--t-txt2)",marginTop:4}}>{item.timeEstimate}</div>}
          </div>
        ))}
      </div>}
    </div>}

    {confData.length===0&&<div style={{textAlign:"center",padding:16,color:"var(--t-txt2)",fontSize:12}}>No confidence ratings found for these notes. Rate topics in the editor to see insights.</div>}
  </div>);
}

function TransformPopup({note,geminiKey,onClose,selectedText}){
  const[format,setFormat]=useState(null);const[result,setResult]=useState(null);
  const[loading,setLoading]=useState(false);const[quizAnswers,setQuizAnswers]=useState({});
  const[flipped,setFlipped]=useState({});
  const textToTransform=selectedText||(note?.content||"").replace(/<[^>]+>/g,"");
  const transform=async(fmt)=>{
    setFormat(fmt);setResult(null);setLoading(true);setQuizAnswers({});setFlipped({});
    const r=await geminiTransformNote(note?.title||"Selection",textToTransform,fmt,geminiKey);
    setResult(r);setLoading(false);
  };
  const qLen=result?.questions?.length||0;
  const answered=Object.keys(quizAnswers).length;
  const quizScore=result?.questions?result.questions.reduce((s,q,i)=>s+(quizAnswers[i]===q.answer?1:0),0):0;
  return(<>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,backdropFilter:"blur(4px)"}}/>
    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:101,width:480,maxHeight:"80vh",overflowY:"auto",background:"var(--t-bg2)",border:"1px solid var(--t-border)",borderRadius:20,padding:24,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:700,color:"var(--t-txt)"}}>Transform</div>
        <button onClick={onClose} style={{border:"none",background:"transparent",color:"var(--t-txt2)",cursor:"pointer",fontSize:20}}>{"\u00d7"}</button>
      </div>
      {selectedText&&<div style={{...S.glass,padding:10,marginBottom:12,maxHeight:80,overflowY:"auto"}}><div style={{fontSize:11,color:"var(--t-txt2)",lineHeight:1.5}}>{selectedText.slice(0,200)}{selectedText.length>200?"...":""}</div></div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {[["quiz","Quiz"],["summary","Summary"],["flashcards","Flashcards"],["mindmap","Mind Map"]].map(([k,lb])=>(
          <button key={k} onClick={()=>transform(k)} disabled={loading} style={{padding:"8px 18px",borderRadius:10,border:`1px solid ${format===k?"rgba(123,147,245,.4)":"var(--t-border)"}`,background:format===k?"rgba(123,147,245,.1)":"transparent",color:format===k?"var(--t-a1)":"var(--t-txt2)",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s ease"}}>{lb}</button>
        ))}
      </div>
      {loading&&<div style={{textAlign:"center",padding:20,color:"var(--t-txt2)",fontSize:12}}>
        <div style={{...S.pBar,width:120,margin:"8px auto"}}><div style={{height:"100%",borderRadius:7,background:"var(--t-grad)",animation:"pulse 1.5s ease infinite",width:"70%"}}/></div>
        Generating {format}...</div>}
      {format==="quiz"&&result?.questions&&(<div>
        {result.questions.map((q,qi)=>(<div key={qi} style={{...S.glass,padding:10,marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>{qi+1}. {q.q}</div>
          {q.options.map((opt,oi)=>{
            const done=quizAnswers[qi]!==undefined;const correct=oi===q.answer;const picked=quizAnswers[qi]===oi;
            let bg="var(--t-glass)",bdr="var(--t-border)",clr="var(--t-txt)";
            if(done&&correct){bg="rgba(39,174,96,.15)";bdr="rgba(39,174,96,.4)";clr="var(--t-a1)";}
            else if(done&&picked&&!correct){bg="rgba(192,57,43,.1)";bdr="rgba(192,57,43,.3)";clr="var(--t-red)";}
            return(<button key={oi} onClick={()=>{if(!done)setQuizAnswers(p=>({...p,[qi]:oi}));}}
              style={{display:"block",width:"100%",textAlign:"left",padding:"5px 10px",marginBottom:3,borderRadius:6,border:`1px solid ${bdr}`,background:bg,color:clr,fontSize:11,cursor:done?"default":"pointer",fontFamily:"'Inter',sans-serif"}}>{String.fromCharCode(65+oi)}. {opt}</button>);
          })}
          {quizAnswers[qi]!==undefined&&q.explanation&&<div style={{fontSize:10,color:"var(--t-txt2)",marginTop:4,fontStyle:"italic"}}>{q.explanation}</div>}
        </div>))}
        {answered===qLen&&qLen>0&&(<div style={{...S.glassAccent,padding:12,textAlign:"center"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,background:"var(--t-grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{quizScore}/{qLen}</div>
          <div style={{fontSize:11,color:"var(--t-txt2)"}}>{quizScore===qLen?"Perfect score!":quizScore>=qLen*.7?"Great job!":"Keep studying!"}</div>
        </div>)}
      </div>)}
      {format==="summary"&&result&&(<div>
        {result.title&&<div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{result.title}</div>}
        {result.keyPoints&&(<div style={{...S.glass,padding:10,marginBottom:8}}>
          <div style={S.sh2}>Key Points</div>
          {result.keyPoints.map((p,i)=><div key={i} style={{fontSize:12,color:"var(--t-txt3)",marginBottom:4,paddingLeft:8,borderLeft:"2px solid var(--t-a2)"}}>{p}</div>)}
        </div>)}
        {result.details&&<div style={{...S.glass,padding:10}}><div style={S.sh2}>Details</div><div style={{fontSize:12,color:"var(--t-txt3)",lineHeight:1.6}}>{result.details}</div></div>}
      </div>)}
      {format==="flashcards"&&result?.cards&&(<div>
        {result.cards.map((card,i)=>(<div key={i} onClick={()=>setFlipped(p=>({...p,[i]:!p[i]}))}
          style={{...S.glass,padding:14,marginBottom:6,cursor:"pointer",minHeight:60,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",transition:"all .25s",background:flipped[i]?"var(--t-glass-accent)":"var(--t-glass)"}}>
          <div>
            <div style={{fontSize:9,color:"var(--t-txt2)",marginBottom:4,textTransform:"uppercase",letterSpacing:".5px"}}>{flipped[i]?"Answer":"Question"} {"\u00b7"} {i+1}/{result.cards.length}</div>
            <div style={{fontSize:13,fontWeight:flipped[i]?400:600,color:flipped[i]?"var(--t-txt3)":"var(--t-txt)",lineHeight:1.5}}>{flipped[i]?card.back:card.front}</div>
          </div>
        </div>))}
        <div style={{fontSize:10,color:"var(--t-txt2)",textAlign:"center",marginTop:4}}>Click cards to flip</div>
      </div>)}
      {format==="mindmap"&&result&&(<div>
        <div style={{...S.glassAccent,padding:12,textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:15,fontWeight:700,background:"var(--t-grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{result.root}</div>
        </div>
        {result.branches?.map((b,i)=>(<div key={i} style={{...S.glass,padding:10,marginBottom:6}}>
          <div style={{fontSize:13,fontWeight:600,color:"var(--t-a1)",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:["var(--t-blue)","var(--t-purple)","var(--t-cyan)","var(--t-pink)","var(--t-red)"][i%5],flexShrink:0}}/>{b.label}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,paddingLeft:14}}>
            {b.children?.map((c,j)=><span key={j} style={{padding:"3px 10px",borderRadius:20,fontSize:11,background:"var(--t-glass)",color:"var(--t-txt3)",border:"1px solid var(--t-border)"}}>{c}</span>)}
          </div>
        </div>))}
      </div>)}
      {!format&&!loading&&<div style={{fontSize:13,color:"var(--t-txt2)",textAlign:"center",padding:20}}>Choose a format to transform {selectedText?"your selection":"this note"}</div>}
    </div>
  </>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 13A: LANDING PAGE
// ══════════════════════════════════════════════════════════════

function DottedSurface({style:outerStyle={},children,parentRef}){
  const containerRef=useRef(null);const sceneRef=useRef(null);
  useEffect(()=>{
    if(!containerRef.current)return;
    const el=containerRef.current;
    const hoverTarget=parentRef?.current||el;
    const w=()=>el.clientWidth||window.innerWidth;
    const h=()=>el.clientHeight||window.innerHeight;
    const SEPARATION=100,AMOUNTX=140,AMOUNTY=100;
    const scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x000000,0.0001);
    const camera=new THREE.PerspectiveCamera(65,w()/h(),1,25000);
    camera.position.set(0,500,1800);
    camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(w(),h());
    renderer.setClearColor(0x000000,0);
    el.appendChild(renderer.domElement);
    const positions=[];
    const geometry=new THREE.BufferGeometry();
    for(let ix=0;ix<AMOUNTX;ix++)for(let iy=0;iy<AMOUNTY;iy++){
      positions.push(ix*SEPARATION-(AMOUNTX*SEPARATION)/2, 0, iy*SEPARATION-(AMOUNTY*SEPARATION)/2);
    }
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    const material=new THREE.PointsMaterial({size:5,color:0xcccccc,transparent:true,opacity:0.6,sizeAttenuation:true});
    const points=new THREE.Points(geometry,material);
    scene.add(points);
    // Raycaster for mouse projection
    const raycaster=new THREE.Raycaster();const mouseNDC=new THREE.Vector2();const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const intersectPt=new THREE.Vector3();
    let mouseWorld={x:9999,z:9999};
    const onMouseMove=e=>{
      const rect=hoverTarget.getBoundingClientRect();
      mouseNDC.x=((e.clientX-rect.left)/rect.width)*2-1;
      mouseNDC.y=-((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouseNDC,camera);
      if(raycaster.ray.intersectPlane(plane,intersectPt)){mouseWorld={x:intersectPt.x,z:intersectPt.z};}
    };
    const onMouseLeave=()=>{mouseWorld={x:9999,z:9999};};
    hoverTarget.addEventListener("mousemove",onMouseMove);
    hoverTarget.addEventListener("mouseleave",onMouseLeave);
    let count=0,animationId;
    const HOVER_RADIUS=600,HOVER_STRENGTH=120;
    const animate=()=>{
      animationId=requestAnimationFrame(animate);
      const posAttr=geometry.attributes.position;const arr=posAttr.array;
      let i=0;
      for(let ix=0;ix<AMOUNTX;ix++)for(let iy=0;iy<AMOUNTY;iy++){
        const idx=i*3;
        const baseX=ix*SEPARATION-(AMOUNTX*SEPARATION)/2;
        const baseZ=iy*SEPARATION-(AMOUNTY*SEPARATION)/2;
        // Subtle wave
        let yVal=Math.sin((ix+count)*0.3)*40+Math.sin((iy+count)*0.5)*40;
        // Mouse hover lift
        const dx=baseX-mouseWorld.x,dz=baseZ-mouseWorld.z;
        const dist=Math.sqrt(dx*dx+dz*dz);
        if(dist<HOVER_RADIUS){
          const t=1-dist/HOVER_RADIUS;
          yVal+=HOVER_STRENGTH*t*t;
        }
        arr[idx+1]=yVal;
        i++;
      }
      posAttr.needsUpdate=true;
      renderer.render(scene,camera);count+=0.015;
    };
    const handleResize=()=>{camera.aspect=w()/h();camera.updateProjectionMatrix();renderer.setSize(w(),h());};
    window.addEventListener("resize",handleResize);
    animate();
    sceneRef.current={scene,camera,renderer,animationId};
    return()=>{
      window.removeEventListener("resize",handleResize);
      hoverTarget.removeEventListener("mousemove",onMouseMove);
      hoverTarget.removeEventListener("mouseleave",onMouseLeave);
      if(sceneRef.current){
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.scene.traverse(obj=>{if(obj instanceof THREE.Points){obj.geometry.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose();}});
        sceneRef.current.renderer.dispose();
        if(el&&sceneRef.current.renderer.domElement)el.removeChild(sceneRef.current.renderer.domElement);
      }
    };
  },[]);
  return(<div ref={containerRef} style={{position:"absolute",inset:0,zIndex:-1,overflow:"hidden",...outerStyle}}>{children}</div>);
}

function FloatingPaths({position}){
  const paths=Array.from({length:36},(_,i)=>({
    id:i,
    d:`M-${380-i*5*position} -${189+i*6}C-${380-i*5*position} -${189+i*6} -${312-i*5*position} ${216-i*6} ${152-i*5*position} ${343-i*6}C${616-i*5*position} ${470-i*6} ${684-i*5*position} ${875-i*6} ${684-i*5*position} ${875-i*6}`,
    width:0.5+i*0.03,
  }));
  return(
    <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      <svg style={{width:"100%",height:"100%"}} viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map(p=>(
          <motion.path key={p.id} d={p.d} stroke="white" strokeWidth={p.width}
            strokeOpacity={0.04+p.id*0.012}
            initial={{pathLength:0.3,opacity:0.4}}
            animate={{pathLength:1,opacity:[0.15,0.4,0.15],pathOffset:[0,1,0]}}
            transition={{duration:40+Math.random()*15,repeat:Infinity,ease:"linear"}}
          />
        ))}
      </svg>
    </div>
  );
}

function TypingDemo(){
  // Script: type, ghost appears, user dismisses by typing more, new ghost appears, user accepts
  const script=[
    {action:"type",text:"Neural networks consist of layers of interconnected nodes."},
    {action:"pause",ms:300},
    {action:"type",text:"\nEach layer transforms its input through weighted sums and"},
    {action:"pause",ms:500},
    {action:"ghost",text:" activation functions like ReLU or sigmoid."},
    {action:"pause",ms:1600},
    // User ignores the suggestion and keeps typing
    {action:"dismiss"},
    {action:"type",text:" non-linear"},
    {action:"pause",ms:400},
    {action:"ghost",text:" activation functions, enabling the network to learn complex decision boundaries."},
    {action:"pause",ms:2000},
    // User accepts this one
    {action:"accept",text:" activation functions, enabling the network to learn complex decision boundaries."},
    {action:"pause",ms:2500},
    {action:"reset"},
  ];
  const[typed,setTyped]=useState("");const[ghost,setGhost]=useState(null);const[acceptedFlag,setAcceptedFlag]=useState(false);
  const stepRef=useRef(0);const timerRef=useRef(null);const charRef=useRef(0);const typedRef=useRef("");
  useEffect(()=>{
    const run=()=>{
      const step=script[stepRef.current];if(!step)return;
      if(step.action==="type"){
        const txt=step.text;charRef.current=0;
        const typeChar=()=>{
          if(charRef.current<txt.length){
            typedRef.current+=txt[charRef.current];setTyped(typedRef.current);charRef.current++;
            timerRef.current=setTimeout(typeChar,30+Math.random()*30);
          }else{stepRef.current++;run();}
        };typeChar();
      }else if(step.action==="pause"){
        timerRef.current=setTimeout(()=>{stepRef.current++;run();},step.ms);
      }else if(step.action==="ghost"){
        setGhost(step.text);setAcceptedFlag(false);
        stepRef.current++;run();
      }else if(step.action==="dismiss"){
        setGhost(null);stepRef.current++;run();
      }else if(step.action==="accept"){
        const txt=step.text;
        typedRef.current+=txt;setTyped(typedRef.current);
        setGhost(null);setAcceptedFlag(true);
        stepRef.current++;run();
      }else if(step.action==="reset"){
        timerRef.current=setTimeout(()=>{
          typedRef.current="";setTyped("");setGhost(null);setAcceptedFlag(false);
          stepRef.current=0;run();
        },step.ms||2500);
      }
    };
    run();
    return()=>{if(timerRef.current)clearTimeout(timerRef.current);};
  },[]);
  // Render typed text splitting on newlines
  const lines=typed.split("\n");
  return(
    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:20,border:"1px solid rgba(255,255,255,0.08)",padding:"32px 36px",fontFamily:"'JetBrains Mono',monospace",fontSize:14,lineHeight:2,color:"#e2e8f0",minHeight:240,width:"100%",backdropFilter:"blur(12px)"}}>
      <div style={{display:"flex",gap:7,marginBottom:20,alignItems:"center"}}>
        <span style={{width:12,height:12,borderRadius:"50%",background:"#ff5f57"}}/>
        <span style={{width:12,height:12,borderRadius:"50%",background:"#ffbd2e"}}/>
        <span style={{width:12,height:12,borderRadius:"50%",background:"#28c840"}}/>
        <span style={{marginLeft:"auto",fontSize:10,color:"#475569",letterSpacing:1}}>NOTIQ EDITOR</span>
      </div>
      {lines.map((l,i)=>(
        <div key={i}>
          {l}
          {i===lines.length-1&&<>
            {ghost&&<span style={{color:"#667eea",opacity:0.35,transition:"opacity 0.3s"}}>{ghost}</span>}
            {ghost&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:"rgba(102,126,234,0.15)",color:"#667eea",marginLeft:10,verticalAlign:"middle"}}>Tab</span>}
            {acceptedFlag&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:"rgba(39,174,96,0.15)",color:"#27ae60",marginLeft:10,verticalAlign:"middle"}}>Accepted</span>}
            {!ghost&&!acceptedFlag&&<span style={{borderRight:"2px solid #667eea",animation:"blink 1s step-end infinite"}}>&nbsp;</span>}
          </>}
        </div>
      ))}
    </div>
  );
}

function YouTubeDemo(){
  const cards=[
    {t:"Transformers Explained — Visual Guide",ch:"3Blue1Brown",v:"5.6M",dur:"26:14",delay:0},
    {t:"Machine Learning Full Course 2026",ch:"freeCodeCamp",v:"8.3M",dur:"4:32:10",delay:0.15},
    {t:"Neural Networks from Scratch — Deep Dive",ch:"StatQuest",v:"4.8M",dur:"18:42",delay:0.3},
    {t:"Random Forest vs Gradient Boosting",ch:"StatQuest",v:"4.2M",dur:"22:08",delay:0.45},
    {t:"Backpropagation Calculus Explained",ch:"3Blue1Brown",v:"9.1M",dur:"13:54",delay:0.6},
  ];
  const[visible,setVisible]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),300);return()=>clearTimeout(t);},[]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:11,color:"#667eea",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>Live Resources</div>
        <div style={{fontSize:10,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>{cards.length} results</div>
      </div>
      {cards.map((c,i)=>(
        <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:"16px 20px",borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",backdropFilter:"blur(8px)",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(15px)",transition:`all 0.5s ease ${c.delay+0.2}s`}}>
          <div style={{width:64,height:44,borderRadius:8,background:"linear-gradient(135deg,rgba(102,126,234,0.3),rgba(118,75,162,0.3))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}><span style={{fontSize:16}}>&#9654;</span><span style={{position:"absolute",bottom:2,right:4,fontSize:8,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{c.dur}</span></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.t}</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{c.ch} &middot; {c.v} views</div>
          </div>
          <div style={{fontSize:10,color:"#475569",flexShrink:0,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)"}}>Drag</div>
        </div>
      ))}
      <div style={{fontSize:11,color:"#475569",textAlign:"center",marginTop:8}}>AI extracts topics from your notes, then finds the most relevant videos</div>
    </div>
  );
}

function GraphDemo(){
  const nodes=[
    {x:280,y:80,label:"Machine Learning",color:"#667eea",r:40},
    {x:520,y:60,label:"NLP",color:"#764ba2",r:32},
    {x:640,y:220,label:"Finance",color:"#f59e0b",r:34},
    {x:120,y:320,label:"Health",color:"#ec4899",r:30},
    {x:400,y:340,label:"Startup",color:"#06b6d4",r:34},
    {x:60,y:140,label:"Ethics",color:"#8b5cf6",r:28},
    {x:640,y:400,label:"Nutrition",color:"#ec4899",r:26},
    {x:220,y:440,label:"Portfolio",color:"#667eea",r:28},
    {x:500,y:450,label:"Barcelona",color:"#f59e0b",r:26},
    {x:160,y:180,label:"Deep Learning",color:"#06b6d4",r:30},
  ];
  const links=[[0,1],[0,2],[0,4],[1,5],[2,4],[3,4],[0,5],[3,6],[4,7],[6,3],[1,0],[2,7],[0,9],[9,1],[9,5],[4,8],[7,2],[8,7]];
  return(
    <svg viewBox="0 0 720 520" style={{width:"100%"}}>
      {links.map(([a,b],i)=>(
        <motion.line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(102,126,234,0.15)" strokeWidth={1.5}
          initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:1}}
          transition={{duration:1.5,delay:0.3+i*0.1,ease:"easeOut"}}
        />
      ))}
      {nodes.map((n,i)=>(
        <motion.g key={i} style={{cursor:"default"}}
          initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
          transition={{delay:0.5+i*0.12,type:"spring",stiffness:120,damping:20}}>
          <g>
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity={0.12} stroke={n.color} strokeWidth={1.5}/>
            <text x={n.x} y={n.y+4} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight={600} fontFamily="'Inter',sans-serif">{n.label}</text>
          </g>
        </motion.g>
      ))}
    </svg>
  );
}

function TransformDemo(){
  const[active,setActive]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setActive(a=>(a+1)%4),3000);return()=>clearInterval(t);},[]);
  const tabs=["Quiz","Summary","Flashcards","Mind Map"];
  const contents=[
    <div key="q" style={{padding:"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:12,color:"#667eea",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>Question 1 of 5</div>
        <div style={{fontSize:11,color:"#475569"}}>Score: 1/1</div>
      </div>
      <div style={{fontSize:15,fontWeight:600,color:"#e2e8f0",marginBottom:16,lineHeight:1.5}}>What is the primary advantage of random forests over single decision trees?</div>
      {["Higher interpretability of individual predictions","Reduced variance through ensemble averaging","Significantly faster training time on large datasets","Lower memory usage during inference"].map((o,i)=>(
        <div key={i} style={{padding:"12px 18px",marginBottom:6,borderRadius:10,border:`1px solid ${i===1?"rgba(39,174,96,0.4)":"rgba(255,255,255,0.06)"}`,background:i===1?"rgba(39,174,96,0.08)":"transparent",fontSize:13,color:i===1?"#27ae60":"#94a3b8",lineHeight:1.4}}>{String.fromCharCode(65+i)}. {o}</div>
      ))}
      <div style={{fontSize:12,color:"#475569",marginTop:14,fontStyle:"italic",lineHeight:1.5,padding:"12px 16px",background:"rgba(255,255,255,0.02)",borderRadius:10}}>Random forests reduce variance by averaging multiple decorrelated trees trained on bootstrapped samples with random feature subsets (bagging).</div>
    </div>,
    <div key="s" style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#667eea",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Key Points</div>
      {["Supervised learning maps labeled inputs to outputs, enabling generalisation to unseen data through learned decision boundaries","Random forests combat overfitting by training many decorrelated trees on bootstrapped data subsets with random feature selection","Cross-validation (5-fold or 10-fold) provides robust generalisation estimates and prevents data leakage in model evaluation","Feature engineering and domain knowledge often matter more than model choice — start simple before adding complexity","In imbalanced datasets, use precision-recall curves and F1-score instead of accuracy, which can be misleading"].map((p,i)=>(
        <div key={i} style={{fontSize:13,color:"#cbd5e1",marginBottom:10,paddingLeft:14,borderLeft:"2px solid rgba(102,126,234,0.4)",lineHeight:1.6}}>{p}</div>
      ))}
    </div>,
    <div key="f" style={{padding:"24px 28px"}}>
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,padding:"32px 28px",textAlign:"center",border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontSize:11,color:"#667eea",marginBottom:12,textTransform:"uppercase",letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>Question 1 of 8</div>
        <div style={{fontSize:18,fontWeight:600,color:"#e2e8f0",lineHeight:1.5,marginBottom:8}}>What does WACC stand for?</div>
        <div style={{width:48,height:2,background:"rgba(102,126,234,0.3)",margin:"16px auto",borderRadius:1}}/>
        <div style={{fontSize:12,color:"#475569",marginTop:8}}>Click to reveal answer</div>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:16}}>
        {[1,2,3,4,5,6,7,8].map(n=><div key={n} style={{width:8,height:8,borderRadius:"50%",background:n===1?"#667eea":"rgba(255,255,255,0.08)"}}/>)}
      </div>
    </div>,
    <div key="m" style={{padding:"24px 28px"}}>
      <div style={{textAlign:"center",fontSize:18,fontWeight:700,background:"linear-gradient(135deg,#667eea,#764ba2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:20}}>Machine Learning</div>
      {[{label:"Supervised",items:["Regression","Classification","SVM","Random Forest","Gradient Boosting"],color:"#667eea"},{label:"Unsupervised",items:["K-means","PCA","DBSCAN","Autoencoders"],color:"#f59e0b"},{label:"Deep Learning",items:["CNN","RNN","Transformers","GANs"],color:"#06b6d4"},{label:"Evaluation",items:["Cross-validation","F1-score","AUC-ROC","Confusion Matrix"],color:"#ec4899"}].map((b,i)=>(
        <div key={i} style={{marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:600,color:b.color,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:b.color}}/>{b.label}</div>
          <div style={{display:"flex",gap:6,paddingLeft:16,flexWrap:"wrap"}}>{b.items.map((c,j)=><span key={j} style={{padding:"4px 12px",borderRadius:14,fontSize:11,background:"rgba(255,255,255,0.04)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.06)"}}>{c}</span>)}</div>
        </div>
      ))}
    </div>
  ];
  return(
    <div style={{width:"100%"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {tabs.map((t,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{padding:"8px 20px",borderRadius:10,border:`1px solid ${active===i?"rgba(102,126,234,0.4)":"rgba(255,255,255,0.06)"}`,background:active===i?"rgba(102,126,234,0.1)":"transparent",color:active===i?"#667eea":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>{t}</button>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",borderRadius:18,border:"1px solid rgba(255,255,255,0.06)",minHeight:280,overflow:"hidden"}}>
        {contents[active]}
      </div>
    </div>
  );
}

function LandingPage({onEnter}){
  const[scrollY,setScrollY]=useState(0);
  useEffect(()=>{
    document.body.classList.add("landing-body");
    const h=()=>setScrollY(window.scrollY);window.addEventListener("scroll",h);
    return()=>{document.body.classList.remove("landing-body");window.removeEventListener("scroll",h);};
  },[]);

  const dotsWrapRef=useRef(null);
  const enter=()=>{document.body.classList.remove("landing-body");onEnter();};

  // Letter-by-letter animated title
  const titleWords=[{text:"Write",gradient:false},{text:"smarter.",gradient:false},{text:"Think",gradient:true},{text:"faster.",gradient:true}];

  return(
    <div style={{minHeight:"100vh",background:"#08090d",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",overflowX:"hidden"}}>

      {/* ── NAV ── */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"20px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",background:scrollY>50?"rgba(8,9,13,0.92)":"transparent",backdropFilter:scrollY>50?"blur(24px)":"none",borderBottom:"1px solid",borderColor:scrollY>50?"rgba(255,255,255,0.06)":"transparent",transition:"background 0.3s, border-color 0.3s, backdrop-filter 0.3s"}}>
        <NotiqLogo size={30} animated/>
        <button onClick={enter} className="cta-btn" style={{padding:"10px 28px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Get Started</button>
      </nav>

      {/* ── HERO with Floating Paths ── */}
      <section style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 80px",position:"relative",overflow:"hidden"}}>
        {/* Animated path background */}
        <FloatingPaths position={1}/>
        <FloatingPaths position={-1}/>

        {/* Radial glows */}
        <div style={{position:"absolute",top:"15%",left:"30%",width:1000,height:800,background:"radial-gradient(circle,rgba(102,126,234,0.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"10%",right:"15%",width:600,height:600,background:"radial-gradient(circle,rgba(118,75,162,0.05) 0%,transparent 65%)",pointerEvents:"none"}}/>

        <div style={{position:"relative",zIndex:10,width:"100%",display:"flex",alignItems:"center",gap:80,paddingTop:80}}>
          <div style={{flex:1.2,minWidth:0}}>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.8}}
              style={{fontSize:15,color:"#667eea",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:28,fontFamily:"'JetBrains Mono',monospace"}}>
              Your Second Brain
            </motion.div>

            <h1 style={{fontSize:"clamp(48px, 6vw, 88px)",fontWeight:800,lineHeight:1.02,margin:"0 0 32px",letterSpacing:"-3px"}}>
              {titleWords.map((w,wi)=>(
                <span key={wi} style={{display:"inline-block",marginRight:wi===1?"clamp(12px, 2vw, 24px)":"clamp(8px, 1.5vw, 18px)"}}>
                  {w.text.split("").map((ch,ci)=>(
                    <motion.span key={`${wi}-${ci}`}
                      initial={{y:80,opacity:0}}
                      animate={{y:0,opacity:1}}
                      transition={{delay:wi*0.12+ci*0.035,type:"spring",stiffness:140,damping:22}}
                      style={{display:"inline-block",...(w.gradient?{background:"linear-gradient(135deg,#667eea 0%,#764ba2 40%,#f093fb 80%)",backgroundSize:"200% 200%",animation:"gradientShift 4s ease infinite",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}:{})}}
                    >{ch}</motion.span>
                  ))}
                </span>
              ))}
            </h1>

            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.6,duration:0.8}}
              style={{fontSize:20,color:"#94a3b8",lineHeight:1.75,maxWidth:560,margin:"0 0 48px"}}>
              Notes that learn with you. Notiq predicts what you'll write next, tracks what you actually understand, and builds personalised study plans to fill the gaps.
            </motion.p>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.8,duration:0.6}}
              style={{display:"flex",gap:16,alignItems:"center"}}>
              <button onClick={enter} className="cta-btn" style={{padding:"18px 44px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                Get Started &mdash; Free
              </button>
              <a href="#features" style={{padding:"18px 32px",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",fontSize:17,fontWeight:600,textDecoration:"none",transition:"all 0.2s"}}>
                See Features
              </a>
            </motion.div>

            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2,duration:0.8}}
              style={{display:"flex",gap:40,marginTop:56}}>
              {[["Real-time AI","autocomplete as you type"],["Knowledge Gaps","tracked per topic"],["Study Plans","generated in seconds"]].map(([n,l],i)=>(
                <div key={i}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:"#667eea"}}>{n}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{l}</div></div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{opacity:0,x:60}} animate={{opacity:1,x:0}} transition={{delay:0.5,duration:1,ease:"easeOut"}}
            style={{flex:1.1,minWidth:0}}>
            <TypingDemo/>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" style={{padding:"140px 80px",width:"100%"}}>
        <motion.div style={{textAlign:"center",marginBottom:80}} initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} transition={{duration:0.8,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-80px"}}>
          <div style={{fontSize:14,color:"#667eea",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:16,fontFamily:"'JetBrains Mono',monospace"}}>Features</div>
          <h2 style={{fontSize:"clamp(36px, 5vw, 64px)",fontWeight:800,letterSpacing:"-2px",margin:0}}>Built for how<br/><span style={{color:"#475569"}}>you actually study.</span></h2>
        </motion.div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:24}}>
          {[
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272z"/></svg>,title:"AI Autocomplete",desc:"Start typing and Notiq finishes your thought. Context-aware suggestions appear inline as ghost text based on your note title, content, and writing style. Press Tab to accept, Escape to dismiss.",color:"#667eea"},
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>,title:"Smart Subfolders",desc:"Organise notes the way your brain works. A 3-level hierarchy of folders, subfolders, and notes means everything has a home — and you can browse at any level.",color:"#22c55e"},
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,title:"Topic Detection",desc:"Every heading becomes a distinct topic, colour-coded with alternating backgrounds so you can see where one idea ends and the next begins. No manual tagging required.",color:"#764ba2"},
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,title:"Confidence Scoring",desc:"Be honest with yourself. Rate each topic 1-10 using the dropdown next to each heading, and Notiq turns those scores into a clear picture of your strengths and blind spots.",color:"#f59e0b"},
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>,title:"Smart Video Suggestions",desc:"Notiq reads your notes and finds the best YouTube videos to match. Not keyword search — the AI crafts the perfect query so you get tutorials that actually explain what you're writing about.",color:"#06b6d4"},
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="5" cy="19" r="2"/><line x1="12" y1="9" x2="12" y2="5"/><line x1="14.5" y1="13.5" x2="17.5" y2="17.5"/><line x1="9.5" y1="13.5" x2="6.5" y2="17.5"/></svg>,title:"Knowledge Graph",desc:"See how your notes connect. Notiq analyses every note to find shared concepts across subjects and maps them in an interactive visual graph. Discover links you didn't know existed.",color:"#ec4899"},
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l5 5-5 5"/><path d="M21 8H9"/><path d="M8 21l-5-5 5-5"/><path d="M3 16h12"/></svg>,title:"AI Transformer",desc:"Turn any note into a quiz, summary, set of flashcards, or mind map with one click. The AI restructures your content into interactive study materials you can use immediately.",color:"#8b5cf6"},
            {icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19V6l12-3v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/></svg>,title:"AI Study Plans",desc:"Stop guessing what to revise. Notiq identifies your weakest topics, then generates a personalised study plan with priorities, time estimates, and specific resources to close each gap.",color:"#f093fb"},
          ].map((f,i)=>(
            <motion.div key={i} className="feature-card"
              initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}}
              transition={{delay:i*0.06,duration:0.7,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-80px"}}
              style={{background:i%2===1?"rgba(118,75,162,0.04)":"rgba(255,255,255,0.02)",borderRadius:20,padding:"36px 32px",cursor:"default"}}>
              <div style={{width:52,height:52,borderRadius:14,background:`${f.color}15`,display:"flex",alignItems:"center",justifyContent:"center",color:f.color,marginBottom:18}}>{f.icon}</div>
              <h3 style={{fontSize:21,fontWeight:700,margin:"0 0 10px",color:"#f1f5f9"}}>{f.title}</h3>
              <p style={{fontSize:14,color:"#94a3b8",lineHeight:1.7,margin:0}}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DEMO SECTIONS ── */}
      <section id="demo" style={{padding:"80px 0",width:"100%"}}>

        {/* Autocomplete demo — purple bg */}
        <div style={{background:"rgba(118,75,162,0.04)",width:"100%"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,width:"100%"}}>
          <motion.div style={{padding:"80px 64px 80px 80px",display:"flex",flexDirection:"column",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <div style={{fontSize:13,color:"#667eea",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:20,fontFamily:"'JetBrains Mono',monospace"}}>Autocomplete</div>
            <h2 style={{fontSize:"clamp(34px, 4vw, 52px)",fontWeight:800,letterSpacing:"-2px",margin:"0 0 24px",lineHeight:1.08}}>Finish your thoughts<br/>before you type them.</h2>
            <p style={{fontSize:17,color:"#94a3b8",lineHeight:1.8,margin:"0 0 16px"}}>Notiq watches what you write in real time. As you type, the AI reads your note title, existing content, and writing style to predict what comes next. Suggestions appear inline as ghost text — press Tab to accept, Escape to dismiss.</p>
            <p style={{fontSize:15,color:"#64748b",lineHeight:1.7,margin:"0 0 28px"}}>Predictions are instant and never block your typing. The AI waits for natural pauses so suggestions feel helpful, not intrusive.</p>
            <div style={{display:"flex",gap:28}}>
              {[["Tab","accept"],["Esc","dismiss"],["Type","ignore"]].map(([k,v],i)=>(
                <div key={i} style={{fontSize:13,color:"#64748b"}}><span style={{padding:"3px 10px",borderRadius:6,background:"rgba(102,126,234,0.12)",color:"#667eea",fontWeight:700,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{k}</span><span style={{marginLeft:8}}>to {v}</span></div>
              ))}
            </div>
          </motion.div>
          <motion.div style={{padding:"80px 80px 80px 64px",display:"flex",alignItems:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,delay:0.12,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <TypingDemo/>
          </motion.div>
        </div>
        </div>

        {/* YouTube demo — normal bg */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,width:"100%"}}>
          <motion.div style={{padding:"80px 64px 80px 80px",display:"flex",alignItems:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,delay:0.12,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <YouTubeDemo/>
          </motion.div>
          <motion.div style={{padding:"80px 80px 80px 64px",display:"flex",flexDirection:"column",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <div style={{fontSize:13,color:"#764ba2",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:20,fontFamily:"'JetBrains Mono',monospace"}}>Video Suggestions</div>
            <h2 style={{fontSize:"clamp(34px, 4vw, 52px)",fontWeight:800,letterSpacing:"-2px",margin:"0 0 24px",lineHeight:1.08}}>Learn from the best.<br/>Automatically.</h2>
            <p style={{fontSize:17,color:"#94a3b8",lineHeight:1.8,margin:"0 0 16px"}}>When you write about a topic, Notiq doesn't just search for keywords — it understands what you're studying and finds the best educational videos to match. The AI crafts the perfect search query so results are always relevant.</p>
            <p style={{fontSize:15,color:"#64748b",lineHeight:1.7,margin:0}}>Each video card shows the title, channel, and view count. Drag any result directly into your editor to embed it as a reference link alongside your notes.</p>
          </motion.div>
        </div>

        {/* Topic Detection & Confidence demo — purple bg */}
        <div style={{background:"rgba(118,75,162,0.04)",width:"100%"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,width:"100%"}}>
          <motion.div style={{padding:"80px 64px 80px 80px",display:"flex",flexDirection:"column",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <div style={{fontSize:13,color:"#667eea",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:20,fontFamily:"'JetBrains Mono',monospace"}}>Topic Detection</div>
            <h2 style={{fontSize:"clamp(34px, 4vw, 52px)",fontWeight:800,letterSpacing:"-2px",margin:"0 0 24px",lineHeight:1.08}}>See your topics.<br/>Rate your knowledge.</h2>
            <p style={{fontSize:17,color:"#94a3b8",lineHeight:1.8,margin:"0 0 16px"}}>Every heading in your notes becomes a topic section, colour-coded so you can see the structure of your knowledge at a glance. No manual tagging, no setup — just write with headings and Notiq does the rest.</p>
            <p style={{fontSize:15,color:"#64748b",lineHeight:1.7,margin:0}}>The confidence dropdown next to each heading lets you honestly rate your understanding from 1-10. Those scores power everything: insights, bar charts, weakness detection, and personalised AI study plans.</p>
          </motion.div>
          <motion.div style={{padding:"80px 80px 80px 64px",display:"flex",alignItems:"center",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,delay:0.12,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            {/* Topic detection visual demo */}
            <div style={{width:"100%",maxWidth:420,borderRadius:16,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden",padding:20}}>
              {[{title:"Linear Regression",score:8},{title:"Logistic Regression",score:5},{title:"Decision Trees",score:3},{title:"Neural Networks",score:null}].map((t,i)=>(
                <div key={i} style={{marginBottom:i<3?12:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:i%2===0?"rgba(118,75,162,0.08)":"transparent",borderLeft:`3px solid ${i%2===0?"#764ba2":"rgba(255,255,255,0.06)"}`,borderRadius:6,padding:"8px 12px"}}>
                    <span style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{t.title}</span>
                    <span style={{fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",padding:"2px 8px",borderRadius:6,
                      background:t.score?(t.score>=7?"rgba(34,197,94,0.15)":t.score>=4?"rgba(245,158,11,0.15)":"rgba(255,92,92,0.15)"):"rgba(255,255,255,0.06)",
                      color:t.score?(t.score>=7?"#22c55e":t.score>=4?"#f59e0b":"#ff5c5c"):"#64748b"}}>{t.score||"—"}</span>
                  </div>
                  <div style={{padding:"6px 12px 2px",fontSize:13,color:"#64748b",lineHeight:1.5}}>
                    {i===0&&"y = wx + b, minimise squared residuals..."}
                    {i===1&&"Sigmoid function, decision boundary at 0.5..."}
                    {i===2&&"Information gain, Gini impurity, pruning..."}
                    {i===3&&"Activation functions, backpropagation..."}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        </div>

        {/* Knowledge Graph demo — normal bg */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,width:"100%"}}>
          <motion.div style={{padding:"80px 64px 80px 80px",display:"flex",alignItems:"center",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,delay:0.12,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <GraphDemo/>
          </motion.div>
          <motion.div style={{padding:"80px 80px 80px 64px",display:"flex",flexDirection:"column",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <div style={{fontSize:13,color:"#06b6d4",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:20,fontFamily:"'JetBrains Mono',monospace"}}>Knowledge Graph</div>
            <h2 style={{fontSize:"clamp(34px, 4vw, 52px)",fontWeight:800,letterSpacing:"-2px",margin:"0 0 24px",lineHeight:1.08}}>See the connections<br/>you are missing.</h2>
            <p style={{fontSize:17,color:"#94a3b8",lineHeight:1.8,margin:"0 0 16px"}}>Your notes contain more connections than you realise. Notiq analyses every note to extract key concepts, then maps the relationships between them — across subjects, across folders, across everything you've written.</p>
            <p style={{fontSize:15,color:"#64748b",lineHeight:1.7,margin:0}}>The result is an interactive graph where your notes are nodes and shared knowledge forms the edges. Hover any node to see exactly which concepts it shares with its neighbours.</p>
          </motion.div>
        </div>

        {/* Study Plans & Insights demo — purple bg */}
        <div style={{background:"rgba(118,75,162,0.04)",width:"100%"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,width:"100%"}}>
          <motion.div style={{padding:"80px 64px 80px 80px",display:"flex",flexDirection:"column",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <div style={{fontSize:13,color:"#f093fb",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:20,fontFamily:"'JetBrains Mono',monospace"}}>AI Study Plans</div>
            <h2 style={{fontSize:"clamp(34px, 4vw, 52px)",fontWeight:800,letterSpacing:"-2px",margin:"0 0 24px",lineHeight:1.08}}>Focus on what<br/>you don't know.</h2>
            <p style={{fontSize:17,color:"#94a3b8",lineHeight:1.8,margin:"0 0 16px"}}>Your confidence scores tell the full story. The Insights page shows a clear breakdown of where you're strong and where you're struggling, with visual charts so you can spot gaps at a glance.</p>
            <p style={{fontSize:15,color:"#64748b",lineHeight:1.7,margin:0}}>One click generates a structured study plan targeting your weakest areas, complete with priorities, time estimates, and specific resources. Stop wasting time on what you already know.</p>
          </motion.div>
          <motion.div style={{padding:"80px 80px 80px 64px",display:"flex",alignItems:"center",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,delay:0.12,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            {/* Study plan visual demo */}
            <div style={{width:"100%",maxWidth:420,borderRadius:16,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden",padding:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#f093fb",textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>Generated Study Plan</div>
              {[{topic:"Decision Trees",conf:3,priority:"high",time:"2h"},{topic:"Logistic Regression",conf:5,priority:"medium",time:"1.5h"},{topic:"SVMs",conf:4,priority:"medium",time:"1h"}].map((p,i)=>(
                <div key={i} style={{padding:"10px 12px",borderRadius:8,background:i%2===0?"rgba(118,75,162,0.06)":"transparent",border:`1px solid ${i%2===0?"rgba(118,75,162,0.10)":"rgba(255,255,255,0.04)"}`,marginBottom:i<2?8:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{p.topic}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,background:p.priority==="high"?"rgba(255,92,92,0.15)":"rgba(245,158,11,0.15)",color:p.priority==="high"?"#ff5c5c":"#f59e0b",textTransform:"uppercase"}}>{p.priority}</span>
                  </div>
                  <div style={{fontSize:12,color:"#64748b"}}>Confidence: {p.conf}/10 &middot; Est. {p.time}</div>
                </div>
              ))}
              <div style={{marginTop:12,padding:"8px 12px",borderRadius:8,background:"rgba(240,147,251,0.08)",border:"1px solid rgba(240,147,251,0.15)"}}>
                <div style={{fontSize:12,color:"#f093fb",fontWeight:600}}>Schedule: 3 sessions/week, 1.5h each</div>
              </div>
            </div>
          </motion.div>
        </div>
        </div>

        {/* Transform demo — normal bg */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,width:"100%"}}>
          <motion.div style={{padding:"80px 64px 80px 80px",display:"flex",alignItems:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,delay:0.12,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <div style={{width:"100%"}}><TransformDemo/></div>
          </motion.div>
          <motion.div style={{padding:"80px 80px 80px 64px",display:"flex",flexDirection:"column",justifyContent:"center"}} initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}} viewport={{once:true,margin:"-100px"}}>
            <div style={{fontSize:13,color:"#f59e0b",fontWeight:600,letterSpacing:3,textTransform:"uppercase",marginBottom:20,fontFamily:"'JetBrains Mono',monospace"}}>AI Transformer</div>
            <h2 style={{fontSize:"clamp(34px, 4vw, 52px)",fontWeight:800,letterSpacing:"-2px",margin:"0 0 24px",lineHeight:1.08}}>One note.<br/>Four formats.</h2>
            <p style={{fontSize:17,color:"#94a3b8",lineHeight:1.8,margin:"0 0 16px"}}>Highlight any text and transform it instantly. Interactive quizzes that test your understanding, concise summaries with key takeaways, flippable flashcards for spaced repetition, and visual mind maps that reveal the structure of a topic.</p>
            <p style={{fontSize:15,color:"#64748b",lineHeight:1.7,margin:0}}>Every format is fully interactive — answer quiz questions and get scored, flip flashcards to check yourself, or explore mind map branches. Switch between all four with a single click.</p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA + FOOTER with Dotted Surface ── */}
      <div ref={dotsWrapRef} style={{position:"relative",overflow:"hidden"}}>
        <DottedSurface style={{position:"absolute",inset:0,zIndex:0,pointerEvents:"none"}} parentRef={dotsWrapRef}/>

        <section style={{padding:"140px 48px",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{position:"relative",zIndex:10,maxWidth:700,margin:"0 auto"}}>
            <h2 style={{fontSize:"clamp(36px, 5vw, 60px)",fontWeight:800,letterSpacing:"-2px",margin:"0 0 20px"}}>
              Ready to write<br/>
              {["i","n","t","e","l","l","i","g","e","n","t","l","y","?"].map((ch,i)=>(
                <motion.span key={i} initial={{y:50,opacity:0}} whileInView={{y:0,opacity:1}}
                  transition={{delay:i*0.04,type:"spring",stiffness:140,damping:22}} viewport={{once:true}}
                  style={{display:"inline-block",background:"linear-gradient(135deg,#667eea,#764ba2,#f093fb)",backgroundSize:"200% 200%",animation:"gradientShift 4s ease infinite",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}
                >{ch}</motion.span>
              ))}
            </h2>
            <p style={{fontSize:18,color:"#94a3b8",lineHeight:1.75,marginBottom:40}}>No account needed. No setup. No friction.<br/>Just open the app and let the AI handle the rest.</p>
            <button onClick={enter} className="cta-btn" style={{padding:"20px 56px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",fontSize:20,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
              Launch Notiq &rarr;
            </button>
          </div>
        </section>

        <footer style={{padding:"48px 60px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"center",alignItems:"center",position:"relative",zIndex:1}}>
          <NotiqLogo size={22} animated/>
        </footer>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION 13B: TUTORIAL / ONBOARDING
// ══════════════════════════════════════════════════════════════
function Tutorial({onComplete}){
  const[step,setStep]=useState(0);
  const[typedIdx,setTypedIdx]=useState(0);
  const[barAnim,setBarAnim]=useState(false);
  const[flipDemo,setFlipDemo]=useState(false);

  // Reset animations on step change
  useEffect(()=>{setTypedIdx(0);setBarAnim(false);setFlipDemo(false);
    const t1=setTimeout(()=>setBarAnim(true),300);
    return()=>clearTimeout(t1);
  },[step]);

  // Typing animation for autocomplete step
  const ghostText="using gradient descent to minimize the loss function across all training samples...";
  useEffect(()=>{
    if(step!==4)return;
    if(typedIdx>=ghostText.length)return;
    const t=setTimeout(()=>setTypedIdx(p=>p+1),35);
    return()=>clearTimeout(t);
  },[step,typedIdx]);

  // Flip demo for transform step
  useEffect(()=>{
    if(step!==7)return;
    const i=setInterval(()=>setFlipDemo(p=>!p),2000);
    return()=>clearInterval(i);
  },[step]);

  const steps=[
    {id:"welcome",title:"Welcome to Notiq",desc:"Your AI-powered note-taking companion. Write smarter with autocomplete, track your knowledge with confidence scoring, and transform notes into study materials."},
    {id:"sidebar",title:"Sidebar & Folders",desc:"Your notes live here, organized in folders and subfolders. Click a folder to see all its notes, or select an individual note to open it in the editor."},
    {id:"new-note",title:"Create a Note",desc:"Start here to create notes. Add a title, choose a subfolder, describe the context for smarter AI, and attach reference files like PDFs or slides."},
    {id:"editor",title:"Editor & Ribbon",desc:"A full rich text editor with 5 ribbon tabs: Home (formatting), Insert (tables, images, links), Draw (freehand canvas), References (TOC, citations), and Review (comments, read aloud)."},
    {id:"autocomplete",title:"AI Autocomplete",desc:"As you type, the AI suggests completions as ghost text. Press TAB to accept or ESC to dismiss. Suggestions are context-aware based on your note and uploaded files."},
    {id:"confidence",title:"Confidence Scoring",desc:"See this small dropdown next to each heading? Rate your understanding from 1-10. These scores power your personalized insights and study plans."},
    {id:"insights",title:"Insights",desc:"View your confidence analysis: overall stats, a distribution graph, weak and strong areas, plus an AI-generated study plan targeting your weakest topics."},
    {id:"transform",title:"Transform",desc:"Highlight text and click Transform to convert your notes into a Quiz, Summary, Flashcards, or Mind Map. The AI restructures your content instantly."},
    {id:"ai-panel",title:"AI Panel",desc:"The right panel shows YouTube videos relevant to your note, plus a knowledge tracker showing your coverage of each subject. Toggle it from the top bar."},
    {id:"summary",title:"Summary Page",desc:"Get an AI-generated overview of all your notes. Filter by folder or type, then generate themed summaries with key takeaways."},
    {id:"links",title:"Knowledge Graph",desc:"AI discovers hidden connections between your notes and builds a visual graph showing how topics relate across different subjects."},
    {id:"theme",title:"Theme Toggle",desc:"Switch between light and dark mode. Both are fully themed — pick whichever suits you."},
    {id:"done",title:"You're All Set!",desc:"Start by opening a note from the sidebar or create a new one. As you write, the AI handles the rest. Happy studying!"},
  ];
  const cur=steps[step];
  const total=steps.length;
  const next=()=>{if(step<total-1)setStep(step+1);else onComplete();};

  // Dynamically query actual DOM element positions via data-tut attributes
  const getHighlight=()=>{
    const id=cur.id;
    if(id==="welcome"||id==="done")return null;
    // For autocomplete, reuse editor highlight
    const tutId=id==="autocomplete"?"editor":id;
    const el=document.querySelector(`[data-tut="${tutId}"]`);
    if(!el)return null;
    const r=el.getBoundingClientRect();
    const pad=4; // slight padding around element
    return{top:r.top-pad,left:r.left-pad,width:r.width+pad*2,height:r.height+pad*2};
  };

  // Card position: dynamically placed near the highlighted element, always within viewport
  const getCardPos=()=>{
    const id=cur.id;
    if(id==="welcome"||id==="done")return{top:"50vh",left:"50vw",transform:"translate(-50%,-50%)"};
    const tutId=id==="autocomplete"?"editor":id;
    const el=document.querySelector(`[data-tut="${tutId}"]`);
    if(!el)return{top:"50vh",left:"50vw",transform:"translate(-50%,-50%)"};
    const r=el.getBoundingClientRect();
    const vw=window.innerWidth,vh=window.innerHeight;
    const cardW=Math.min(500,vw*0.92);
    const cardH=360; // estimated max card height
    const margin=14;

    let top,left,transform;

    if(id==="sidebar"){top=vh/2;left=r.right+margin;transform="translateY(-50%)";}
    else if(id==="ai-panel"){top=vh/2;left=r.left-cardW-margin;transform="translateY(-50%)";}
    else if(id==="editor"||id==="autocomplete"){
      // Large element — center the card inside it
      top=r.top+r.height/2;left=r.left+r.width/2;transform="translate(-50%,-50%)";
    }
    else{
      // Default: place below if fits, otherwise above
      const spaceBelow=vh-(r.bottom+margin);
      if(spaceBelow>=cardH){top=r.bottom+margin;left=r.left;}
      else{top=r.top-margin;left=r.left;transform="translateY(-100%)";}
    }

    // Clamp left so card doesn't go off-screen right
    if(typeof left==="number"){
      left=Math.max(10,Math.min(left,vw-cardW-10));
    }
    // Clamp top so card stays in viewport
    if(typeof top==="number"&&!transform?.includes("translateY(-1")&&!transform?.includes("translate(-50%,-50%)")){
      top=Math.max(10,Math.min(top,vh-cardH-10));
    }

    const pos={top,left};
    if(transform)pos.transform=transform;
    return pos;
  };

  // Animated demo visuals per step
  const Demo=()=>{
    switch(cur.id){
      case"welcome":return(
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          {["Autocomplete","Insights","Transform","Knowledge Graph"].map((f,i)=>(
            <div key={i} style={{flex:1,padding:"8px 4px",borderRadius:8,background:"linear-gradient(135deg,rgba(123,147,245,0.1),rgba(149,113,205,0.1))",textAlign:"center",fontSize:10,fontWeight:600,color:"var(--t-a1)",animation:`tutFadeIn 0.4s ease-out ${i*0.1}s both`}}>{f}</div>
          ))}
        </div>
      );
      case"sidebar":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:10,marginBottom:8,border:"1px solid var(--t-border)"}}>
          {[{n:"Academics",open:true,ch:["Machine Learning","Corporate Finance"]},{n:"Career & Projects",open:false}].map((f,i)=>(
            <div key={i} style={{marginBottom:4}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--t-a1)",textTransform:"uppercase",letterSpacing:".5px",padding:"4px 0",animation:`tutFadeIn 0.3s ease-out ${i*0.15}s both`}}>{f.open?"\u25bc":"\u25b6"} {f.n}</div>
              {f.open&&f.ch?.map((c,j)=>(<div key={j} style={{fontSize:11,color:"var(--t-txt2)",paddingLeft:16,padding:"3px 0 3px 16px",animation:`tutFadeIn 0.3s ease-out ${(i+j+1)*0.12}s both`}}>{c}</div>))}
            </div>
          ))}
        </div>
      );
      case"new-note":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:10,marginBottom:8,border:"1px solid var(--t-border)"}}>
          <div style={{background:"var(--t-border)",borderRadius:6,height:28,marginBottom:6,display:"flex",alignItems:"center",padding:"0 10px"}}><span style={{fontSize:10,color:"var(--t-txt2)"}}>Note title...</span></div>
          <div style={{display:"flex",gap:4}}>
            <div style={{flex:1,background:"var(--t-border)",borderRadius:6,height:24,display:"flex",alignItems:"center",padding:"0 8px"}}><span style={{fontSize:9,color:"var(--t-txt2)"}}>Subfolder</span></div>
            <div style={{width:60,background:"linear-gradient(135deg,#7b93f5,#9571cd)",borderRadius:6,height:24,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"#fff",fontWeight:600}}>Create</span></div>
          </div>
        </div>
      );
      case"editor":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:8,marginBottom:8,border:"1px solid var(--t-border)"}}>
          <div style={{display:"flex",gap:3,marginBottom:6}}>
            {["Home","Insert","Draw","Ref","Review"].map((t,i)=>(<div key={i} style={{padding:"3px 8px",borderRadius:5,fontSize:9,fontWeight:600,background:i===0?"var(--t-note-active)":"transparent",color:i===0?"var(--t-a1)":"var(--t-txt2)",animation:`tutFadeIn 0.25s ease-out ${i*0.08}s both`}}>{t}</div>))}
          </div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {["B","I","U","H1","H2","\u2261","\u2022","1."].map((b,i)=>(<div key={i} style={{width:22,height:22,borderRadius:4,background:"var(--t-glass)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"var(--t-txt2)",animation:`tutFadeIn 0.2s ease-out ${0.3+i*0.05}s both`}}>{b}</div>))}
          </div>
        </div>
      );
      case"autocomplete":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:12,marginBottom:8,border:"1px solid var(--t-border)",fontFamily:"'Inter',sans-serif"}}>
          <div style={{fontSize:12,color:"var(--t-txt)",marginBottom:4}}>We optimize the model weights </div>
          <div style={{fontSize:12,color:"var(--t-txt2)",opacity:0.45,minHeight:18}}>{ghostText.slice(0,typedIdx)}<span style={{borderRight:"2px solid var(--t-a1)",animation:"tutBlink 1s step-end infinite"}}></span></div>
          <div style={{marginTop:8,display:"flex",gap:6}}>
            <span style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:"var(--t-glass)",color:"var(--t-a1)",fontFamily:"'JetBrains Mono',monospace",border:"1px solid var(--t-border)"}}>TAB accept</span>
            <span style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:"var(--t-glass)",color:"var(--t-txt2)",fontFamily:"'JetBrains Mono',monospace",border:"1px solid var(--t-border)"}}>ESC dismiss</span>
          </div>
        </div>
      );
      case"confidence":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:10,marginBottom:8,border:"1px solid var(--t-border)"}}>
          {[{t:"Linear Regression",s:9,c:"#22c55e"},{t:"Support Vector Machines",s:4,c:"var(--t-purple)"},{t:"WACC Calculation",s:3,c:"var(--t-red)"}].map((d,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",animation:`tutFadeIn 0.3s ease-out ${i*0.15}s both`}}>
              <div style={{width:22,height:22,borderRadius:5,background:`${d.c}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:d.c}}>{d.s}</div>
              <span style={{fontSize:11,color:"var(--t-txt)",flex:1}}>{d.t}</span>
              <div style={{width:50,height:5,borderRadius:3,background:"var(--t-border)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:d.c,width:barAnim?`${d.s*10}%`:"0%",transition:"width 0.8s ease"}}/></div>
            </div>
          ))}
        </div>
      );
      case"insights":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:10,marginBottom:8,border:"1px solid var(--t-border)"}}>
          <div style={{display:"flex",gap:4,marginBottom:8}}>
            {[{l:"Topics",v:"7"},{l:"Avg",v:"6.4"},{l:"Weak",v:"3"}].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:"center",animation:`tutFadeIn 0.3s ease-out ${i*0.1}s both`}}>
                <div style={{fontSize:16,fontWeight:700,background:"var(--t-grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.v}</div>
                <div style={{fontSize:8,color:"var(--t-txt2)",textTransform:"uppercase"}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:2,height:36}}>
            {[0,1,0,2,3,1,4,2,1,0].map((v,i)=>(<div key={i} style={{flex:1,height:barAnim?`${Math.max(v*25,4)}%`:"4%",background:i<3?"var(--t-red)":i<6?"var(--t-purple)":"#22c55e",borderRadius:"2px 2px 0 0",transition:`height 0.6s ease ${i*0.05}s`,minHeight:2}}/>))}
          </div>
        </div>
      );
      case"transform":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:10,marginBottom:8,border:"1px solid var(--t-border)"}}>
          <div style={{display:"flex",gap:4,marginBottom:8}}>
            {["Quiz","Summary","Flashcards","Mind Map"].map((f,i)=>(
              <div key={i} style={{flex:1,padding:"4px 2px",borderRadius:6,border:"1px solid var(--t-border)",textAlign:"center",fontSize:9,fontWeight:600,color:i===2?"var(--t-a1)":"var(--t-txt2)",background:i===2?"rgba(123,147,245,0.1)":"transparent",animation:`tutFadeIn 0.25s ease-out ${i*0.08}s both`}}>{f}</div>
            ))}
          </div>
          <div style={{background:flipDemo?"var(--t-glass-accent)":"var(--t-glass)",borderRadius:8,padding:10,textAlign:"center",transition:"all 0.5s",transform:flipDemo?"scale(0.97)":"scale(1)",border:"1px solid var(--t-border)"}}>
            <div style={{fontSize:8,color:"var(--t-txt2)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>{flipDemo?"Answer":"Question"}</div>
            <div style={{fontSize:11,fontWeight:flipDemo?400:600,color:flipDemo?"var(--t-txt2)":"var(--t-txt)"}}>{flipDemo?"The sigmoid function: σ(z) = 1/(1+e⁻ᶻ)":"What function maps values to 0-1 range?"}</div>
          </div>
        </div>
      );
      case"ai-panel":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:10,marginBottom:8,border:"1px solid var(--t-border)"}}>
          {[{t:"Neural Networks Explained",ch:"3Blue1Brown"},{t:"Backpropagation Deep Dive",ch:"Stanford CS"}].map((v,i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"4px 0",alignItems:"center",animation:`tutFadeIn 0.3s ease-out ${i*0.15}s both`}}>
              <div style={{width:36,height:24,borderRadius:4,background:"linear-gradient(135deg,rgba(123,147,245,0.15),rgba(149,113,205,0.15))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:"var(--t-a1)"}}>YT</span></div>
              <div><div style={{fontSize:10,fontWeight:600,color:"var(--t-txt)"}}>{v.t}</div><div style={{fontSize:8,color:"var(--t-txt2)"}}>{v.ch}</div></div>
            </div>
          ))}
        </div>
      );
      case"summary":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:10,marginBottom:8,border:"1px solid var(--t-border)"}}>
          <div style={{display:"flex",gap:4,marginBottom:6}}>
            <div style={{flex:1,height:22,borderRadius:5,border:"1px solid var(--t-border)",display:"flex",alignItems:"center",padding:"0 6px"}}><span style={{fontSize:8,color:"var(--t-txt2)"}}>All Folders</span></div>
            <div style={{flex:1,height:22,borderRadius:5,border:"1px solid var(--t-border)",display:"flex",alignItems:"center",padding:"0 6px"}}><span style={{fontSize:8,color:"var(--t-txt2)"}}>All Types</span></div>
          </div>
          <div style={{padding:6,borderRadius:6,borderLeft:"3px solid var(--t-a1)",background:"rgba(123,147,245,0.05)",animation:"tutFadeIn 0.4s ease-out 0.2s both"}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--t-a1)",textTransform:"uppercase",marginBottom:2}}>Overview</div>
            <div style={{fontSize:10,color:"var(--t-txt2)",lineHeight:1.4}}>Your notes cover ML, finance, and health topics...</div>
          </div>
        </div>
      );
      case"links":return(
        <div style={{background:"var(--t-glass)",borderRadius:10,padding:12,marginBottom:8,border:"1px solid var(--t-border)",display:"flex",alignItems:"center",justifyContent:"center",height:70}}>
          <svg width="120" height="50" viewBox="0 0 120 50">
            <circle cx="20" cy="25" r="8" fill="rgba(123,147,245,0.2)" stroke="var(--t-a1)" strokeWidth="1.5"><animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite"/></circle>
            <circle cx="60" cy="15" r="6" fill="rgba(149,113,205,0.2)" stroke="var(--t-purple)" strokeWidth="1.5"><animate attributeName="r" values="6;8;6" dur="2s" begin="0.3s" repeatCount="indefinite"/></circle>
            <circle cx="100" cy="25" r="7" fill="rgba(240,171,252,0.2)" stroke="var(--t-pink)" strokeWidth="1.5"><animate attributeName="r" values="7;9;7" dur="2s" begin="0.6s" repeatCount="indefinite"/></circle>
            <circle cx="60" cy="40" r="5" fill="rgba(34,211,238,0.2)" stroke="var(--t-cyan)" strokeWidth="1.5"><animate attributeName="r" values="5;7;5" dur="2s" begin="0.9s" repeatCount="indefinite"/></circle>
            <line x1="28" y1="25" x2="54" y2="17" stroke="var(--t-border)" strokeWidth="1" opacity="0.5"/>
            <line x1="66" y1="15" x2="93" y2="23" stroke="var(--t-border)" strokeWidth="1" opacity="0.5"/>
            <line x1="60" y1="21" x2="60" y2="35" stroke="var(--t-border)" strokeWidth="1" opacity="0.5"/>
            <line x1="26" y1="30" x2="55" y2="38" stroke="var(--t-border)" strokeWidth="1" opacity="0.5"/>
            <text x="20" y="27" textAnchor="middle" fontSize="5" fill="var(--t-a1)">ML</text>
            <text x="60" y="17" textAnchor="middle" fontSize="4" fill="var(--t-purple)">NLP</text>
            <text x="100" y="27" textAnchor="middle" fontSize="5" fill="var(--t-pink)">Finance</text>
            <text x="60" y="42" textAnchor="middle" fontSize="4" fill="var(--t-cyan)">Ethics</text>
          </svg>
        </div>
      );
      case"theme":return(
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <div style={{flex:1,background:"#1a1d28",borderRadius:8,padding:8,border:"1px solid rgba(255,255,255,0.08)",animation:"tutFadeIn 0.3s ease-out both"}}>
            <div style={{fontSize:8,fontWeight:700,color:"#f1f5f9",marginBottom:3}}>Dark</div>
            <div style={{height:3,borderRadius:2,background:"linear-gradient(135deg,#7b93f5,#9571cd)",width:"60%"}}/>
          </div>
          <div style={{flex:1,background:"#fafbfe",borderRadius:8,padding:8,border:"1px solid rgba(0,0,0,0.1)",animation:"tutFadeIn 0.3s ease-out 0.15s both"}}>
            <div style={{fontSize:8,fontWeight:700,color:"#1e293b",marginBottom:3}}>Light</div>
            <div style={{height:3,borderRadius:2,background:"linear-gradient(135deg,#5b6fd6,#6b4f9e)",width:"60%"}}/>
          </div>
        </div>
      );
      default:return null;
    }
  };

  const hl=getHighlight();
  const cardPos=getCardPos();

  // Build clip-path to cut out highlighted region, so only non-highlighted areas are darkened/blurred
  const getClipPath=()=>{
    if(!hl)return"none";
    const t=`${hl.top}px`,l=`${hl.left}px`,w=`${hl.width}px`,h=`${hl.height}px`;
    return`polygon(0% 0%, 0% 100%, ${l} 100%, ${l} ${t}, calc(${l} + ${w}) ${t}, calc(${l} + ${w}) calc(${t} + ${h}), ${l} calc(${t} + ${h}), ${l} 100%, 100% 100%, 100% 0%)`;
  };

  return(<>
    <style>{`
      @keyframes tutFadeInCenter{from{opacity:0;transform:translate(-50%,-50%) translateY(10px)}to{opacity:1;transform:translate(-50%,-50%) translateY(0)}}
      @keyframes tutFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes tutPulse{0%,100%{box-shadow:0 0 0 0 rgba(123,147,245,0.4)}50%{box-shadow:0 0 0 12px rgba(123,147,245,0)}}
      @keyframes tutBlink{50%{border-color:transparent}}
      .tut-card{animation:tutFadeIn 0.35s ease-out both}
      .tut-card-center{animation:tutFadeInCenter 0.35s ease-out both}
      .tut-hl{animation:tutPulse 2s ease infinite}
    `}</style>
    {/* Dark overlay with hole cut out for highlighted element */}
    <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(2px)",WebkitBackdropFilter:"blur(2px)",clipPath:hl?getClipPath():"none",transition:"clip-path 0.3s ease"}}/>
    {/* Highlight border ring around the clear area */}
    {hl&&<div className="tut-hl" style={{position:"fixed",...hl,border:"2px solid rgba(123,147,245,0.6)",borderRadius:10,pointerEvents:"none",zIndex:10001}}/>}
    {/* Tutorial card */}
    <div key={step} className={cardPos.transform?.includes("translate(-50%,-50%)")?"tut-card-center":"tut-card"} style={{position:"fixed",zIndex:10002,maxWidth:500,width:"92vw",padding:28,background:"var(--t-bg2)",border:"1px solid var(--t-border)",borderRadius:18,boxShadow:"0 16px 48px rgba(0,0,0,0.35)",...cardPos}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",gap:3}}>{steps.map((_,i)=>(<div key={i} style={{width:i===step?18:5,height:5,borderRadius:3,background:i===step?"linear-gradient(135deg,#7b93f5,#9571cd)":i<step?"var(--t-a1)":"var(--t-border)",transition:"all 0.3s",opacity:i<step?0.4:1}}/>))}</div>
        <span style={{fontSize:10,color:"var(--t-txt2)",fontFamily:"'JetBrains Mono',monospace"}}>{step+1}/{total}</span>
      </div>
      <div style={{fontSize:20,fontWeight:800,fontFamily:"'Inter',sans-serif",background:"linear-gradient(135deg,#7b93f5,#9571cd)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8,letterSpacing:"-0.3px"}}>{cur.title}</div>
      <div style={{fontSize:14,color:"var(--t-txt2)",lineHeight:1.65,marginBottom:16}}>{cur.desc}</div>
      <Demo/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={onComplete} style={{padding:"8px 18px",borderRadius:8,border:"1px solid var(--t-border)",background:"transparent",color:"var(--t-txt2)",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Skip</button>
        <button onClick={next} style={{padding:"10px 28px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7b93f5,#9571cd)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 14px rgba(123,147,245,0.3)"}}>{step===total-1?"Get Started":"Next"}</button>
      </div>
    </div>
  </>);
}

// ══════════════════════════════════════════════════════════════
// SECTION 13C: MAIN APP
// ══════════════════════════════════════════════════════════════
export default function App(){
  const[showLanding,setShowLanding]=useState(true);
  const[showTutorial,setShowTutorial]=useState(false);
  if(showLanding)return <LandingPage onEnter={()=>{setShowLanding(false);setShowTutorial(true);}}/>;
  return <>
    <NotiqApp/>
    {showTutorial&&<Tutorial onComplete={()=>setShowTutorial(false)}/>}
  </>;
}

function NotiqApp(){
  const[folders,setFolders]=useState(INIT_FOLDERS);const[notes,setNotes]=useState(INIT_NOTES);
  const[activeNote,setActiveNote]=useState("n1");const[activeFolder,setActiveFolder]=useState("academics");
  const[activeSubfolder,setActiveSubfolder]=useState("ml_2026");
  const[viewMode,setViewMode]=useState(null); // null=note, "parent:id", "folder:id", "subfolder:id"
  const[page,setPage]=useState("notes");const[showAI,setShowAI]=useState(true);const[showFiles,setShowFiles]=useState(false);
  const[ghostData,setGhostData]=useState(null);const[ghostLoading,setGhostLoading]=useState(false);
  const[ytResults,setYtResults]=useState([]);const[ytLoading,setYtLoading]=useState(false);const[aiInsight,setAiInsight]=useState(null);
  const[uploadedFiles,setUploadedFiles]=useState([]);const[fileSearch,setFileSearch]=useState("");
  const[isDark,setIsDark]=useState(false);
  const[showTransform,setShowTransform]=useState(false);
  const[showTransformPopup,setShowTransformPopup]=useState(false);
  const[showNewNoteModal,setShowNewNoteModal]=useState(false);
  const[showInsightsPanel,setShowInsightsPanel]=useState(false);
  // Topic sections & confidence scores
  const[topicSections,setTopicSections]=useState({
  n1:[{title:"Supervised Learning Overview",index:0},{title:"Regression vs Classification",index:1},{title:"Linear Regression",index:2},{title:"Logistic Regression",index:3},{title:"Decision Trees & Random Forests",index:4},{title:"Support Vector Machines",index:5},{title:"Evaluation Metrics",index:6}],
  n2:[{title:"Neural Networks Fundamentals",index:0},{title:"Activation Functions",index:1},{title:"Backpropagation & Gradient Descent",index:2},{title:"Convolutional Neural Networks (CNNs)",index:3},{title:"Famous CNN Architectures",index:4},{title:"Practical Tips",index:5}],
  n3:[{title:"NLP — From Bag of Words to Transformers",index:0},{title:"Classical NLP Pipeline",index:1},{title:"Word Embeddings",index:2},{title:"The Transformer Architecture",index:3},{title:"Self-Attention Mechanism",index:4},{title:"LLMs: GPT, BERT, and Beyond",index:5}],
  n4:[{title:"Valuation — Core Methods",index:0},{title:"Discounted Cash Flow (DCF)",index:1},{title:"WACC — Weighted Average Cost of Capital",index:2},{title:"NPV and IRR",index:3},{title:"Comparable Company Analysis (Comps)",index:4},{title:"Modigliani-Miller Theorem",index:5}],
  n5:[{title:"Quantum Computing — Beyond Classical Bits",index:0}],
  n6:[{title:"Ethics in Data Science and AI",index:0}],
});
  const[confidence,setConfidence]=useState({
  "n1:0":8,"n1:1":7,"n1:2":9,"n1:3":6,"n1:4":8,"n1:5":4,"n1:6":7,
  "n2:0":7,"n2:1":8,"n2:2":5,"n2:3":9,"n2:4":6,"n2:5":7,
  "n3:0":6,"n3:1":5,"n3:2":7,"n3:3":9,"n3:4":4,"n3:5":8,
  "n4:0":7,"n4:1":5,"n4:2":3,"n4:3":6,"n4:4":8,"n4:5":4,
  "n5:0":3,
  "n6:0":6,
});
  const[insightsFolder,setInsightsFolder]=useState("academics"); // which root folder insights are for
  const timerRef=useRef(null);const ytRef=useRef(null);const abortRef=useRef(null);const ytAbortRef=useRef(null);
  useEffect(()=>{
    let s=document.getElementById("nt-theme");
    if(!s){s=document.createElement("style");s.id="nt-theme";document.head.appendChild(s);}
    const lightOverrides=isDark?"":`
      [style*="color: rgb(241, 245, 249)"],
      [style*="color:#f1f5f9"]{color:#1e293b !important}
      [style*="color: rgb(176, 190, 197)"],
      [style*="color:#b0bec5"]{color:#475569 !important}
      [style*="color: rgb(132, 146, 166)"],
      [style*="color:#8492a6"]{color:#64748b !important}
      [style*="color: rgb(123, 147, 245)"],
      [style*="color:#7b93f5"]{color:#5b6fd6 !important}
      [style*="color: rgb(149, 113, 205)"],
      [style*="color:#9571cd"]{color:#6b4f9e !important}
      [style*="color: rgb(240, 171, 252)"],
      [style*="color:#f0abfc"]{color:#7c3aed !important}
      [style*="color: rgb(251, 191, 36)"],
      [style*="color:#fbbf24"]{color:#d97706 !important}
      [style*="color: rgb(255, 107, 107)"],
      [style*="color:#ff6b6b"]{color:#dc2626 !important}
      [style*="color: rgb(34, 211, 238)"],
      [style*="color:#22d3ee"]{color:#0891b2 !important}
      [style*="color: rgb(34, 197, 94)"],
      [style*="color:#22c55e"]{color:#16a34a !important}
      [style*="background: rgb(15, 17, 23)"],
      [style*="background:rgba(15,17,23"]{background:rgba(243,244,248,0.95) !important}
      [style*="background: rgb(12, 14, 21)"],
      [style*="background:rgba(12,14,21"]{background:rgba(243,244,248,0.97) !important}
      [style*="background: rgba(255, 255, 255, 0.04)"],
      [style*="background:rgba(255,255,255,0.04)"]{background:rgba(0,0,0,0.03) !important}
      [style*="background: rgba(255, 255, 255, 0.03)"],
      [style*="background:rgba(255,255,255,0.03)"]{background:rgba(0,0,0,0.02) !important}
      [style*="background: rgba(255, 255, 255, 0.06)"],
      [style*="background:rgba(255,255,255,0.06)"]{background:rgba(0,0,0,0.04) !important}
      [style*="background: rgba(255, 255, 255, 0.08)"],
      [style*="background:rgba(255,255,255,0.08)"]{background:rgba(0,0,0,0.05) !important}
      [style*="background:rgba(123,147,245,0.1)"]{background:rgba(91,111,214,0.1) !important}
      [style*="background:rgba(123,147,245,0.07)"]{background:rgba(91,111,214,0.07) !important}
      [style*="border-color: rgba(255, 255, 255"],
      [style*="border:1px solid rgba(255,255,255"]{border-color:rgba(0,0,0,0.1) !important}
      [style*="border-bottom: 1px solid rgba(255, 255, 255"]{border-bottom-color:rgba(0,0,0,0.08) !important}
      [style*="border-left: 1px solid rgba(255, 255, 255"]{border-left-color:rgba(0,0,0,0.08) !important}
      [style*="border-right: 1px solid rgba(255, 255, 255"]{border-right-color:rgba(0,0,0,0.08) !important}
      div[contenteditable="true"]{color:#1e293b !important}
      div[contenteditable="true"] h2,div[contenteditable="true"] h3{color:#1e293b !important}
      div[contenteditable="true"] p,div[contenteditable="true"] li,div[contenteditable="true"] ul,div[contenteditable="true"] ol{color:#334155 !important}
      div[contenteditable="true"] strong{color:#1e293b !important}
      div[contenteditable="true"] em{color:#475569 !important}
      .grad-btn{background:linear-gradient(135deg,#5b6fd6,#6b4f9e) !important}
      .tab-btn{color:#475569}
      .note-btn{color:#475569}
      .note-btn:hover{background:rgba(91,111,214,0.08) !important}
      .nq-input{background:rgba(0,0,0,0.03) !important;color:#1e293b !important;border-color:rgba(0,0,0,0.12) !important}
      .res-card{background:rgba(0,0,0,0.02) !important;border-color:rgba(0,0,0,0.08) !important}
      .feature-card{background:rgba(0,0,0,0.02) !important}
      select{background:rgba(0,0,0,0.05) !important;color:#475569 !important;border-color:rgba(0,0,0,0.12) !important}
    `;
    s.textContent=`:root{${isDark?DARK_CSS:LIGHT_CSS}}body,#root{background:var(--t-bg)}${lightOverrides}`;
  },[isDark]);

  const active=notes[activeNote];
  const knowledge=useMemo(()=>calcKnow(notes),[notes]);
  const videos=useMemo(()=>active?getVideos(active.content||""):[],[active?.content]);

  // Parse topic sections from note content (client-side heading detection)
  const parseSections=useCallback((noteId,html)=>{
    if(!html)return;
    const div=document.createElement("div");div.innerHTML=html;
    const headings=[...div.querySelectorAll("h2,h3")];
    if(headings.length===0)return;
    const sections=headings.map((h,i)=>({title:h.textContent||`Section ${i+1}`,index:i}));
    setTopicSections(p=>{if(JSON.stringify(p[noteId])===JSON.stringify(sections))return p;return{...p,[noteId]:sections};});
  },[]);

  // Detect sections when note changes
  useEffect(()=>{if(active?.content)parseSections(activeNote,active.content);},[activeNote,active?.content,parseSections]);

  const setConfidenceScore=(noteId,sectionIdx,score)=>{
    setConfidence(p=>({...p,[`${noteId}:${sectionIdx}`]:score}));
  };

  const handleChange=useCallback(html=>{
    setNotes(p=>({...p,[activeNote]:{...p[activeNote],content:html}}));
    // Parse sections on content change
    parseSections(activeNote,html);
    // ── Copilot-style autocomplete: abort previous, debounce 500ms ──
    if(timerRef.current)clearTimeout(timerRef.current);
    timerRef.current=setTimeout(async()=>{
      const plain=html.replace(/<[^>]+>/g,"");if(plain.length<15)return;
      const localGhost=getGhost(html);
      if(!AI_KEY){if(localGhost)setGhostData(localGhost);return;}
      if(abortRef.current)abortRef.current.abort();
      const ac=new AbortController();abortRef.current=ac;
      setGhostLoading(true);
      const pLines=plain.split("\n").filter(l=>l.trim());
      const ctx=pLines.slice(-10).join("\n");
      const ragCtx=active?.context||"";
      const r=await geminiComplete(ctx,{title:active?.title||"",context:ragCtx},AI_KEY,ac.signal);
      if(!ac.signal.aborted){setGhostData(r||localGhost);setGhostLoading(false);}
    },500);
    // ── YouTube pipeline ──
    if(ytRef.current)clearTimeout(ytRef.current);
    ytRef.current=setTimeout(async()=>{
      if(!YOUTUBE_KEY)return;const plain=html.replace(/<[^>]+>/g,"");if(plain.length<30)return;
      if(ytAbortRef.current)ytAbortRef.current.abort();
      const ac=new AbortController();ytAbortRef.current=ac;
      setYtLoading(true);
      let q=null;
      const ytCtx=active?.context?"\n\nNote context: "+active.context.slice(0,500):"";
      if(AI_KEY)q=await geminiExtractTopic(html+ytCtx,AI_KEY,ac.signal);
      if(!q){q=plain.split("\n").filter(l=>l.trim()).slice(-2).join(" ").slice(0,80);}
      if(ac.signal.aborted)return;
      if(q.length<5){setYtLoading(false);return;}
      const r=await ytSearch(q,YOUTUBE_KEY,4);
      if(!ac.signal.aborted){setYtResults(r);setYtLoading(false);}
    },1800);
    if(AI_KEY&&html.replace(/<[^>]+>/g,"").length>100){setTimeout(async()=>{const r=await geminiAnalyze(html,"Most important takeaway? One sentence.",AI_KEY);setAiInsight(r);},3500);}
  },[activeNote,parseSections]);

  const acceptGhost=useCallback(()=>{setGhostData(null);},[]);

  const selectNote=id=>{setActiveNote(id);setViewMode(null);setGhostData(null);setYtResults([]);setAiInsight(null);setPage("notes");
    // Auto-set active folder/subfolder
    const loc=findNoteLocation(folders,id);
    if(loc){setActiveFolder(loc.root.id);if(loc.sub)setActiveSubfolder(loc.sub.id);}
  };
  const selectParent=id=>{setViewMode("parent:"+id);setActiveNote(id);setPage("notes");};
  const selectFolderView=fid=>{setViewMode("folder:"+fid);setPage("notes");setActiveSubfolder("");};
  const selectSubfolderView=subId=>{setViewMode("subfolder:"+subId);setPage("notes");};
  const createNote=(title,subId,context="",ragFiles=[])=>{
    const id=`n_${Date.now()}`;
    setNotes(p=>({...p,[id]:{title,content:"",created:new Date().toISOString().slice(0,10),context,ragFiles}}));
    setFolders(p=>p.map(f=>({...f,children:(f.children||[]).map(sub=>sub.id===subId?{...sub,notes:[...sub.notes,id]}:sub)})));
    selectNote(id);
  };
  const createFolder=name=>{setFolders(p=>[...p,{id:`f_${Date.now()}`,name,children:[]}]);};
  const createSubfolder=(rootId,name)=>{const sid=`sf_${Date.now()}`;setFolders(p=>p.map(f=>f.id===rootId?{...f,children:[...(f.children||[]),{id:sid,name,notes:[]}]}:f));};
  const addLesson=(pid,title)=>{const id=`${pid}_l${Date.now()}`;setNotes(p=>{const pn=p[pid];return{...p,[pid]:{...pn,children:[...(pn.children||[]),id]},[id]:{title,cat:pn.cat,created:new Date().toISOString().slice(0,10),parent:pid,content:""}};});};
  const addTopic=nt=>{const tid=nt.tn;if(!notes[tid])return;setNotes(p=>({...p,[tid]:{...p[tid],content:(p[tid].content||"")+`<h3 style="color:var(--t-blue)">${nt.topic}</h3><p>${nt.desc}</p><p><a href="${nt.video}" target="_blank" style="color:var(--t-a2)">Watch \u2192</a></p>`}}));selectNote(tid);};
  const handleShowFiles=()=>{const sel=window.getSelection()?.toString()||"";setFileSearch(sel);setShowFiles(true);setShowAI(false);};

  // Folder/subfolder breadcrumb
  const loc=findNoteLocation(folders,activeNote);
  const folderName=loc?`${loc.root.name}${loc.sub?" / "+loc.sub.name:""}`:"";

  // Build combined view items
  let combinedTitle="",combinedItems=[],combinedParentId=null;
  if(viewMode?.startsWith("parent:")){
    const pid=viewMode.slice(7);const pn=notes[pid];
    if(pn?.children){combinedTitle=pn.title;combinedParentId=pid;combinedItems=(pn.children||[]).map(id=>({id,...notes[id]})).filter(Boolean).sort((a,b)=>(a.created||"").localeCompare(b.created||""));}
  }else if(viewMode?.startsWith("subfolder:")){
    const subId=viewMode.slice(10);
    const info=findSubfolder(folders,subId);
    if(info?.sub){combinedTitle=info.sub.name;
      (info.sub.notes||[]).forEach(nid=>{const n=notes[nid];if(!n)return;
        if(n.children){n.children.forEach(cid=>{if(notes[cid])combinedItems.push({id:cid,...notes[cid]});});}
        else if(!n.parent){combinedItems.push({id:nid,...n});}
      });combinedItems.sort((a,b)=>(a.created||"").localeCompare(b.created||""));}
  }else if(viewMode?.startsWith("folder:")){
    const fid=viewMode.slice(7);const folder=folders.find(f=>f.id===fid);
    if(folder){combinedTitle=folder.name;
      getAllFolderNoteIds(folder).forEach(nid=>{const n=notes[nid];if(!n)return;
        if(n.children){n.children.forEach(cid=>{if(notes[cid])combinedItems.push({id:cid,...notes[cid]});});}
        else if(!n.parent){combinedItems.push({id:nid,...n});}
      });combinedItems.sort((a,b)=>(a.created||"").localeCompare(b.created||""));}
  }

  return(<div style={S.app}>
    <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"10%",left:"35%",width:1000,height:800,background:"radial-gradient(circle,rgba(123,147,245,0.07) 0%,transparent 65%)"}}/>
      <div style={{position:"absolute",bottom:"15%",right:"10%",width:600,height:600,background:"radial-gradient(circle,rgba(149,113,205,0.05) 0%,transparent 65%)"}}/>
    </div>
    {showNewNoteModal&&<NewNoteModal folders={folders} activeFolder={activeFolder} activeSubfolder={activeSubfolder} onClose={()=>setShowNewNoteModal(false)} onCreate={createNote}/>}
    {showTransformPopup&&active&&<TransformPopup note={active} geminiKey={AI_KEY} selectedText={window.getSelection()?.toString()||""} onClose={()=>setShowTransformPopup(false)}/>}
    <Sidebar folders={folders} notes={notes} activeNote={activeNote} activeFolder={activeFolder} activeSubfolder={activeSubfolder}
      onSelect={selectNote} onSelectFolder={setActiveFolder} onSelectSubfolder={setActiveSubfolder} onCreateFolder={createFolder} onCreateSubfolder={createSubfolder} onSelectParent={selectParent} onSelectFolderView={selectFolderView} onSelectSubfolderView={selectSubfolderView} onOpenNewNote={()=>setShowNewNoteModal(true)}/>
    <div style={S.main}>
      <div style={S.topBar}>
        <button className="tab-btn" style={S.tabBtn(page==="notes")} onClick={()=>setPage("notes")}>Notes</button>
        <button data-tut="summary" className="tab-btn" style={S.tabBtn(page==="summary")} onClick={()=>setPage("summary")}>Summary</button>
        <button data-tut="links" className="tab-btn" style={S.tabBtn(page==="links")} onClick={()=>setPage("links")}>Links</button>
        <div style={{flex:1}}/>
        <button data-tut="theme" onClick={()=>{document.body.classList.add("theme-transition");setIsDark(d=>!d);setTimeout(()=>document.body.classList.remove("theme-transition"),400);}} style={{padding:"7px 16px",borderRadius:10,border:"1px solid var(--t-border)",background:"var(--t-glass)",color:"var(--t-txt2)",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginRight:4,transition:"all 0.2s ease"}}>{isDark?"Light":"Dark"}</button>
        {page==="notes"&&!viewMode&&<button className="tab-btn" style={{...S.tabBtn(showAI),fontSize:12}} onClick={()=>{setShowAI(!showAI);if(showAI){setShowFiles(false);}else{setShowTransform(false);}}}>{showAI?"AI Panel":"AI Panel"}</button>}
      </div>
      {page==="notes"&&viewMode&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"16px 32px 8px"}}>
          <h2 style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:24,margin:"0 0 10px",color:"var(--t-txt)",fontWeight:800,letterSpacing:"-0.5px"}}>{combinedTitle}</h2>
          <div style={{display:"flex",gap:8}}>
            <button data-tut="insights" onClick={()=>setShowInsightsPanel(p=>!p)} style={{padding:"10px 24px",borderRadius:12,border:"none",background:showInsightsPanel?"linear-gradient(135deg,#7b93f5,#9571cd)":"linear-gradient(135deg,rgba(149,113,205,0.15),rgba(123,147,245,0.15))",color:showInsightsPanel?"#fff":"var(--t-purple)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:8,transition:"all 0.2s"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              Insights
            </button>
            <button data-tut="transform" onClick={()=>setShowTransformPopup(true)} style={{padding:"10px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,rgba(149,113,205,0.15),rgba(123,147,245,0.15))",color:"var(--t-purple)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:8,transition:"all 0.2s"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14 2 9.2h7.6z"/></svg>
              Transform
            </button>
          </div>
        </div>
        {showInsightsPanel&&<div style={{padding:"12px 32px 0"}}><NoteInsightsPanel noteIds={combinedItems.map(c=>c.id)} notes={notes} topicSections={topicSections} confidence={confidence} geminiKey={AI_KEY} title={combinedTitle} onClose={()=>setShowInsightsPanel(false)}/></div>}
        <CombinedView hideTitle title={combinedTitle} items={combinedItems} onSelect={selectNote} onAddLesson={t=>combinedParentId&&addLesson(combinedParentId,t)} parentId={combinedParentId} onChangeNote={(id,html)=>setNotes(p=>({...p,[id]:{...p[id],content:html}}))}/></div>}
      {page==="notes"&&!viewMode&&active&&(
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"20px 32px"}}>
            <div style={{marginBottom:12}}>
              <span style={{fontSize:12,color:"var(--t-txt2)",letterSpacing:"0.3px"}}>{folderName} / {active.created}</span>
              {active.parent&&<span style={{fontSize:12,color:"var(--t-a1)",marginLeft:8,cursor:"pointer",transition:"opacity 0.15s"}} onClick={()=>selectParent(active.parent)}>{"\u2190"} {notes[active.parent]?.title}</span>}
              <h2 style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:28,margin:"8px 0",color:"var(--t-txt)",fontWeight:800,letterSpacing:"-0.5px"}}>{active.title}</h2>
              {active.context&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7b93f5" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{fontSize:11,color:"#7b93f5"}}>RAG context attached</span>
                {active.ragFiles?.length>0&&<span style={{fontSize:10,color:"#8492a6"}}>({active.ragFiles.length} file{active.ragFiles.length!==1?"s":""})</span>}
              </div>}
            </div>
            {showInsightsPanel&&<NoteInsightsPanel noteIds={[activeNote]} notes={notes} topicSections={topicSections} confidence={confidence} geminiKey={AI_KEY} title={active.title} onClose={()=>setShowInsightsPanel(false)}/>}
            <div style={{display:"flex",gap:8,marginBottom:6}}>
              <button data-tut="insights" onClick={()=>setShowInsightsPanel(p=>!p)} style={{padding:"10px 24px",borderRadius:12,border:"none",background:showInsightsPanel?"linear-gradient(135deg,#7b93f5,#9571cd)":"linear-gradient(135deg,rgba(149,113,205,0.15),rgba(123,147,245,0.15))",color:showInsightsPanel?"#fff":"var(--t-purple)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:8,transition:"all 0.2s"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                Insights
              </button>
              <button data-tut="transform" onClick={()=>setShowTransformPopup(true)} style={{padding:"10px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,rgba(149,113,205,0.15),rgba(123,147,245,0.15))",color:"var(--t-purple)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:8,transition:"all 0.2s"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14 2 9.2h7.6z"/></svg>
                Transform
              </button>
            </div>
            <RichEditor key={activeNote} content={active.content} onChange={handleChange} ghostData={ghostData} onAcceptGhost={acceptGhost} noteId={activeNote} loading={ghostLoading} onShowFiles={handleShowFiles} sectionColors={SECTION_COLORS} confidence={confidence} onSetConfidence={setConfidenceScore}/>
          </div>
          {showFiles&&<FilePanel files={uploadedFiles} onUpload={f=>setUploadedFiles(p=>[...p,f])} onClose={()=>{setShowFiles(false);setShowAI(true);}} searchText={fileSearch}/>}
          {showAI&&!showFiles&&!showTransform&&<SugPanel videos={videos} ytResults={ytResults} knowledge={knowledge} aiInsight={aiInsight} loadingYT={ytLoading}/>}
        </div>
      )}
      {page==="notes"&&!viewMode&&!active&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",maxWidth:340}}>
        <NotiqLogo size={44} style={{marginBottom:16}}/>
        <p style={{color:"#b0bec5",fontSize:15,lineHeight:1.6,margin:"0 0 8px"}}>Select a note from the sidebar or create a new one to get started.</p>
        <p style={{color:"#8492a6",fontSize:12}}>Your AI-powered writing companion is ready.</p>
      </div></div>}
      {page==="insights"&&<InsightsPage notes={notes} folders={folders} knowledge={knowledge} onAddTopic={addTopic} geminiKey={AI_KEY} topicSections={topicSections} confidence={confidence} insightsFolder={insightsFolder} setInsightsFolder={setInsightsFolder}/>}
      {page==="summary"&&<SummaryPage notes={notes} folders={folders} geminiKey={AI_KEY}/>}
      {page==="links"&&<LinksPage notes={notes} geminiKey={AI_KEY} onSelectNote={selectNote}/>}
    </div>
  </div>);
}
