# 🦋 BossLadyLisa's Beautify Yourself & Beyond App℠

**A Self-Care & Emotional Realignment Hub**

This repository contains two versions of the BossLadyLisa wellness app — a Python/Streamlit prototype and a full React upgrade.

---

## 🆕 React Version (Current) — `WellnessOasis_Integrated.jsx`

A complete rebuild of the app in React (JSX) with a premium dark glassmorphism UI, AI integration, community features, and interactive wellness tools.

### Features

| Page | Description |
|---|---|
| 🏠 **Home** | Welcome hub with personalized greeting and navigation cards |
| 🧩 **Self-Care Lounge** | Mood reset cards (11 moods), 55+ affirmation deck, AI Reset Toolkit, grounding tracker |
| 💬 **Reflections Studio** | Structured daily journal with focus areas, gratitude, intention, soul mantra, and tarot pull |
| 🔥 **Phoenix Room** | 5 Rise Rituals + Emotional Armor Check for burnout recovery |
| 🌿 **Visual Garden** | Animated quote cards, curated affirmations, and Dragonfly Wisdom principles |
| 🪷 **Lily Pad** | Interactive visual breathing exercise with butterfly animation and optional audio narration |
| 🧠 **143 Life Notes** | Personal wisdom notes with add and delete support |
| 📋 **Boss Mode Planner** | Task manager with priority levels (High/Medium/Low) and delete support |
| 🕊️ **Community Garden** | 5 themed garden zones for sharing affirmations, mantras, and journal entries publicly |
| 💎 **Premium Portal** | 3-tier pricing page (Free / $9.99/mo / $99/yr) |

### Additional Highlights

- **AI Reset Toolkit** — Claude-powered personalized reset rituals, affirmations, and grounding questions
- **Emergency Lily Pad Button** — Floating 🪷 button for instant access to the breathing tool at any time
- **Crisis Safety** — Text moderation detects crisis keywords and surfaces 988 / Crisis Text Line resources
- **Community Sharing** — Share affirmations, grounding answers, and journal entries to themed garden zones with 🌸 bloom reactions
- **Inclusive Content** — All mood cards and affirmations written for universal inclusivity across identity, body, and life path
- **Persistent Storage** — User name, notes, tasks, journal entries, and affirmations saved via cloud key-value store

### How to Run

This is a React component intended for use in a React application environment.

1. Install dependencies in your React project:

   ```bash
   npm install react react-dom
   ```

2. Import and render the component:

   ```jsx
   import WellnessOasis from './WellnessOasis_Integrated.jsx';

   function App() {
     return <WellnessOasis />;
   }
   ```

---

## 🐍 Original Streamlit Version — `streamlit_app.py`

The original Python prototype built with Streamlit. Retained for reference.

### Features

- Feel It to Release It — Mood Reset Toolkit (7 moods)
- Grounded Thoughts — Daily Journal
- 143 Life Notes
- Visual Quote Cards (PIL-generated)
- Boss Mode Planner
- Space & Mind Declutter Tools
- Daily 2:43 Affirmation Alerts
- Feedback Form

### How to Run

1. Install the requirements:

   ```bash
   pip install -r requirements.txt
   ```

2. Run the app:

   ```bash
   streamlit run streamlit_app.py
   ```

---

## 📁 Repository Structure

```
BossLadyLisasWellnessApp/
├── WellnessOasis_Integrated.jsx   # React app (current version)
├── streamlit_app.py               # Original Streamlit prototype
├── requirements.txt               # Python dependencies (streamlit, Pillow)
├── .devcontainer/                 # Dev container configuration
└── .github/                       # GitHub configuration
```

---

*BossLadyLisa's Beautify Yourself & Beyond App℠ — Wellness, healing, and self-care for everyone.*
