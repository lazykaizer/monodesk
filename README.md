<div align="center">

# 🌌 Monodesk
**The AI-Powered Operating System for Next-Gen Founders & Creators.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB&Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini API](https://img.shields.io/badge/Google-Gemini_&_Veo-EA4335?style=for-the-badge&logo=google)](https://ai.google.dev/)

*All systems operational. Ready to build.*

</div>

---

## 🚀 Overview

**Monodesk** isn't just a dashboard; it's a complete, end-to-end mission control for taking an idea from a napkin sketch to a market-ready product. Engineered with a cutting-edge **Next.js 16** and **React 19** architecture, Monodesk seamlessly integrates state-of-the-art AI models (Google's Gemini and Veo) to accelerate every phase of the startup lifecycle: from initial validation and financial modeling to generating hyper-realistic product marketing assets.

Say goodbye to context-switching between 10 different SaaS tools. **Monodesk is your unified workspace.**

---

## ✨ The 8 Core Modules (The Start-to-Scale Pipeline)

Monodesk is structured into 4 distinct phases, guiding you from inception to funding.

### Phase 1: Validation 💡
* **Idea Validator:** Validate your startup ideas instantly with AI-driven market analysis, feasibility checks, and competitive landscaping.
* **Trend Hunter:** Tap into the zeitgeist. Discover emerging market trends and viral topics before they peak.
* **Persona Tester:** Stop guessing. Simulate deep user interviews with AI personas to gather actionable feedback before writing a single line of code.

### Phase 2: Strategy 🗺️
* **Strategy Deck:** Auto-generate comprehensive SWOT analyses and tactical go-to-market plans to outmaneuver competitors.
* **Roadmap Engine:** Architect your product's future with an interactive, AI-suggested milestone and task engine.

### Phase 3: Execution & Creative 🎨
* **Finance View:** Keep your runway clear. Monitor burn rate, cash flow, and overall financial health with intuitive charts.
* **Creative Studio (Powered by Gemini & Veo):** 
  * 🖼️ **Text to Image:** High-fidelity concepts enhanced by Gemini Pro.
  * 🎥 **Text to Video:** Cinematic 30-90 second generations using the Veo model.
  * 🎨 **Logo Maker:** Professional, perfect 1:1 aspect ratio vector-style logos.
  * 📸 **Agency Replacer:** Advanced multimodal *Dual Upload* system. Upload your raw product, upload a reference scene, and perfectly composite your product into the scene with 100% architectural preservation.

### Phase 4: Fundraising 💼
* **Pitch Deck Builder:** Synthesize all your validated data, financials, and creative assets into compelling, investor-ready pitch decks (Exportable via PPTX & PDF).

---

## 🛠 Tech Stack Architecture

Built for scale, speed, and real-time collaboration.

| Category | Technologies Used |
| :--- | :--- |
| **Core Framework** | Next.js 16.1 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Radix UI Primitives |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Cloud Storage) |
| **AI Integration** | `@google/generative-ai` (Gemini Pro, Imagen 3, Veo 2) |
| **State & Logic** | Zustand (Global State), React Hook Form, Zod |
| **Rich Text & Canvas** | Tiptap (Pro Editor), Three.js (3D Renderings) |
| **Document Export** | `jspdf`, `pptxgenjs`, `html2canvas` |

---

## 🎨 Design Engineering (The "Wow" Factor)

Monodesk features a hyper-modern, "developer-first but designer-loved" aesthetic:
* **Scrollytelling Hero:** A cinematic 400vh canvas-rendered intro sequence that immerses the user instantly.
* **Gooey Text & Micro-interactions:** Fluid morphing text, radial orbital timelines, and animated reveal sequences powered by Framer Motion.
* **Glassmorphism & Gradients:** A deep, dark-mode-first environment (`#050505`) accented with vibrant Cyan (`#06B6D4`) and Deep Blue (`#3B82F6`) tokens.
* **Responsive Layouts:** A deeply integrated Sidebar/Topbar architecture that provides maximum canvas space for the task at hand.

---

## 🚦 Getting Started (Local Development)

### 1. Clone & Install
```bash
git clone <repository_url>
cd monodesk
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add the required keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_google_ai_studio_key
```

### 3. Database Migration
Navigate to your Supabase SQL Editor and run the provided initialization scripts located in the root directory to set up tables and RLS (Row Level Security):
* `COMPLETE_SUPABASE_SETUP.sql`
* *(Or run the individual module migrations: `supabase_creative_fix.sql`, `supabase_finance_migration.sql`, etc.)*

### 4. Run the Matrix
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧠 System Deep Dive: The Creative Studio API

The Creative Studio is Monodesk's crown jewel. It doesn't just pass prompts; it engineers them.

**Agency Mode Architecture:**
```text
[Raw Product Image (Base64)] + [Reference Scene Image (Base64)] + [User Prompt] 
       ↓
  (Strict Preservation Engineering Rules applied via Next.js Server Actions)
       ↓
  Gemini Multimodal API (nano-banana-pro-preview / Gemini 2.5 Pro)
       ↓
[Flawless 100% Product Match placed authentically in a dynamic environment]
```

*History & Context safety is built-in. Generated assets auto-save to Supabase Storage, and current prompt states are protected via Modal interruption to prevent data loss.*

---

## 🛡️ Security & Performance

* **Edge Ready:** Designed to leverage optimizations for API integrations and generation routes.
* **Strict RLS:** Supabase Row Level Security ensures tenant data (financials, pitch decks, history) is absolutely isolated.
* **Optimized Loading:** Next.js Font optimization, aggressive image caching, and dynamic imports for heavy modules (like Three.js and PDF Generation).

---

<div align="center">
  <p>
    <i>"Stop switching tabs. Start building the future."</i>
  </p>
  <b>Monodesk Inc. © 2026. Made by Gulfam with love.</b>
</div>
