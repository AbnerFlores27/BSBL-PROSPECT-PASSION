# DiamondIQ — Official Specification (v4.3)

> Spec-Driven Development: DiamondIQ Web Platform & AI Spec Review System
> Official spec of record. Docs only — no website code changes yet.

Project Title: DiamondIQ — Multi-Perspective Baseball Educational Hub

Target Level: 9th Grade Web Development Student (HTML5, CSS3, Vanilla JavaScript)

Methodology: Spec-Driven Development (SDD)

Document Version: v4.3

## 1. Feature Name & Goal

Feature Name: DiamondIQ Interactive Web Platform & 5-Expert Review Engine

Core Goal: Build a responsive, baseball-themed educational web application displaying game scenario analyses across 5 distinct expert perspectives. All component specifications must pass structured review by the 5-expert panel before front-end implementation begins.

## 2. User Story & Workflow

User Story: As a 9th-grade web design student and baseball fan, I want my website specs evaluated by 5 specialized experts (Youth Coach, Sabermetrician, Web Dev Mentor, UI/UX Designer, Rookie Player) so that I catch layout, logic, and content flaws on paper before writing code.

Review Workflow:

Draft Spec (v1, v2...) ⟶ 5-Expert Panel Review ⟶ Resolve Questions ⟶ Verdict Check (Pass/Needs Work) ⟶ Phase Build

## 3. Visual & UI Requirements

### Page Layout & Structure

Header & Branding:
- Logo: DiamondIQ with a baseball diamond icon.
- Tagline: "Five Experts. One Pitch."
- Navigation Bar: Links for Home, Scenarios, Expert Panel, About.

Scenario Controls:
- Scenario Selector: Dropdown menu ordered fundamentals-first (e.g., Force Out vs. Tag Out, Stealing Second, followed by analytics plays like Reading Launch Angle). Every option includes a one-line plain-English description.
- View Toggle Buttons: Full Panel Grid View (all 5 cards) vs. Single Expert Focus View (1 card).

Plain-English Summary Card:
- Prominent top banner summarizing all expert perspectives in 2 simple sentences for beginners. In the desktop layout, it occupies the sixth grid cell.

5-Expert Card Themes & Accent Colors:
- Specific color hex values are deferred to Phase 2 (CSS Layout & Styling) to evaluate WCAG contrast compliance during visual styling.

### Responsive Layout Rules

- Desktop (>= 1024px): 3x2 CSS Grid layout containing the 5 expert cards plus the Plain-English Summary card in the sixth cell.
- Tablet (768px - 1023px): 2-column Flexbox grid with automatic wrapping.
- Mobile (< 768px): Single-column vertical stack using native HTML <details> and <summary> collapsible accordion elements.

## 4. Technical Requirements & Architecture

### Stack & Data Layer

- HTML5: Semantic structural tags (<header>, <nav>, <main>, <section>, <article>, <details>, <summary>, <footer>).
- CSS3: CSS Grid, Flexbox, custom CSS variables for expert colors (configured in Phase 2), media queries.
- Vanilla JavaScript: DOM scripting for scenario filtering, panel view state toggling, and native accordion controls without external libraries.
- Data Architecture (mockData.js): Local JavaScript file storing scenarios, expert answers, 3-tier visual meter values (Low/Med/High), summary text, and one-line scenario descriptions as structured JavaScript objects.

### 5-Expert Persona & Evaluation Matrix

| Persona | Target Domain | Required Evaluation Criteria |
|---|---|---|
| Youth Baseball Coach | Baseball Fundamentals | Baseball terminology is accurate; fundamental rules are simplified clearly. |
| Sabermetrics Analyst | Advanced Analytics | Statcast concepts use 3-tier visual meters (Low/Med/High) with optional tooltips. |
| Web Dev Mentor | Front-End Buildability | Standard HTML/CSS/JS stack without backend API dependencies. |
| UI/UX Designer | Responsive Design & Accessibility | Clear visual hierarchy; color contrast passes WCAG standards across device sizes. |
| Rookie Player | Usability & Clarity | Content is in plain language; core takeaway is immediately obvious to a beginner. |

## 5. Acceptance Criteria

- [ ] Spec doc contains all 5 required structural sections.
- [ ] Front-end stays strictly within HTML5, CSS3, Vanilla JS, and local mockData.js.
- [ ] Visual layout rules cover desktop 3x2 grid, tablet 2-column flexbox, and mobile native accordions.
- [ ] Accent colors are deferred to Phase 2 for contrast testing prior to writing CSS variables.
- [ ] Scenario dropdown presents fundamental rules first with one-line plain-English descriptions.

## 6. 5-Phase Implementation Breakdown

[Phase 1: HTML Skeleton] -> [Phase 2: CSS Grid & Themes] -> [Phase 3: Mock Data Architecture] -> [Phase 4: JS Interactivity] -> [Phase 5: Polish & Testing]

- Phase 1: Semantic HTML Skeleton — Create index.html structure with semantic tags (<header>, <nav>, <main>, <section>, <article>, <details>, <summary>, <footer>).
- Phase 2: CSS Layout & Accent Styling — Build CSS Grid/Flexbox layouts and define expert CSS variables in style.css.
- Phase 3: Mock Data Architecture — Construct mockData.js storing scenarios, answers, stat gauges, and descriptions.
- Phase 4: JavaScript Interactivity — Build DOM state scripts in script.js for dropdown scenario swapping and panel view toggles.
- Phase 5: Accessibility & Final Testing — Audit color contrast, verify mobile responsiveness, and run final 5-expert review check.

---

Theme decision (Abner): grey + powder blue palette, WCAG contrast-tested in Phase 2.
