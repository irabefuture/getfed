# Adaptive Meal Builder - Learning Reference

**Project:** Adaptive Meal Builder  
**Start Date:** 1 December 2025  
**Ship Date:** 10 December 2025  
**Purpose:** First complete web app shipped to external users + solve personal meal planning problem

---

## Quick Reference: The Stack

| Layer | Tool | What It Does |
|-------|------|--------------|
| Runtime | **Node.js** | JavaScript engine that runs outside browser. Enables JS on your machine. |
| Framework | **Next.js** | React framework with routing, server-side features, build tooling built-in. |
| UI Library | **React** | Component-based UI library. Everything is a component. |
| Styling | **Tailwind CSS** | Utility-first CSS. Classes like `bg-blue-500` instead of writing CSS files. |
| Components | **shadcn/ui** | Copy-paste component library built on Radix UI + Tailwind. You own the code. |
| Package Manager | **npm** | Installs and manages JavaScript packages (libraries). |
| Dev Server | **localhost:3000** | Local web server for development. See changes live. |
| Hosting | **Vercel** | Deploys your app to the internet. Built by Next.js creators. |
| Database | **Supabase** | Backend-as-a-service: database, auth, API. PostgreSQL under the hood. |
| AI | **Claude API** | Anthropic's API for meal generation. Uses culinary knowledge. |

---

## Day 3 - Wednesday 3 December 2025

### Session 1 (Morning) - Project Specification

**What was accomplished:**
- Major project scope evolution from ingredient browser to full meal planning system
- Complete specification documented in PROJECT-SPEC.md
- Database schema designed (7 tables)
- User flows documented
- Build phases defined

**Key insight:** The real problem wasn't "calculate macros" - it was "plan the week and generate a shopping list."

---

### Session 2 (Afternoon) - Database & Core Logic (Phase 2.1)

**What was accomplished:**
- Created 7 database tables in Supabase
- Inserted user profiles (Ian + Rhonda with body stats)
- Built UserContext for React state management
- Created nutrition calculation library (BMR/TDEE/macros)
- Built UserSelector component
- Verified calculations within 1% accuracy

**New concepts learned:**

#### React Context
- **What:** Way to share state across components without prop drilling
- **Why:** User state needed in sidebar, planner, and other components
- **Pattern:**
```jsx
// Create context
const UserContext = createContext()

// Provider wraps app
<UserProvider>
  <App />
</UserProvider>

// Use in any component
const { user, setUser } = useUser()
```

#### useEffect Hook
- **What:** Run code when component mounts or dependencies change
- **Why:** Fetch data when component first renders
- **Pattern:**
```jsx
useEffect(() => {
  // This runs once when component mounts
  fetchUsers()
}, []) // Empty array = only run once
```

#### Destructuring
- **What:** Extract values from objects/arrays in one line
- **Example:**
```javascript
const { data, error } = await supabase.from('users').select('*')
// Instead of: const result = await ...; const data = result.data;
```

---

### Session 3 (Late Afternoon) - Claude API Integration (Phase 2.2 Start)

**What was accomplished:**
- Installed Anthropic SDK
- Added API key to environment variables
- Created /api/generate-meals route
- Successfully tested meal generation (~$0.02 per generation)
- Claude generates recipes using culinary knowledge, not database lookup

**New concepts learned:**

#### API Routes in Next.js
- **What:** Server-side endpoints in your Next.js app
- **Location:** `src/app/api/[route-name]/route.js`
- **Why:** Run code on server (hide API keys, database access)
- **Pattern:**
```javascript
// src/app/api/generate-meals/route.js
export async function POST(request) {
  const body = await request.json()
  // Do server stuff
  return Response.json({ success: true })
}
```

#### Server vs Client Code
- **API routes:** Always run on server, safe for secrets
- **Components with 'use client':** Run in browser
- **Server components (default):** Run on server, can't use hooks

#### Environment Variables for Server
- Variables WITHOUT `NEXT_PUBLIC_` prefix are server-only
- `ANTHROPIC_API_KEY` - safe, only accessible in API routes
- `NEXT_PUBLIC_SUPABASE_URL` - exposed to browser

#### JSON Response Pattern
```javascript
return Response.json({ 
  success: true, 
  data: meals 
}, { status: 200 })

// Error response
return Response.json({ 
  error: 'Failed' 
}, { status: 500 })
```

---

### Session 4 (Evening) - UI Implementation

**What was accomplished:**
- Installed and configured shadcn/ui
- Created sage green theme using oklch color space
- Built Sidebar component (user selector, macro display, navigation)
- Built MealCard component (expandable ingredients/steps)
- Built MealPlanner component (form, grid, selection)
- Fixed field name mismatches between API and components
- Meals now generate and display correctly

**New concepts learned:**

#### shadcn/ui Philosophy
- **NOT a traditional npm package** - copies components INTO your project
- **You own the code** - fully customizable, no version lock-in
- **Built on:** Radix UI (accessibility) + Tailwind (styling)
- **CLI workflow:**
```bash
npx shadcn@latest init          # Setup
npx shadcn@latest add button    # Add component
```
- **Components live in:** `src/components/ui/`

#### oklch Color Space
- **What:** Modern CSS color format (lightness, chroma, hue)
- **Why:** Better for creating consistent color palettes
- **Example:** `oklch(0.52 0.1 145)` = sage green
- **Usage:** CSS variables in globals.css

#### CSS Variables for Theming
```css
:root {
  --primary: oklch(0.52 0.1 145);
  --background: oklch(0.98 0.01 145);
}
```
- Change one variable → entire app updates

#### Component Composition
- Build small pieces (Button, Card, Input)
- Combine into larger components (MealCard uses Card + Button)
- shadcn provides primitives, you compose

#### cn() Utility
- **What:** Merges Tailwind classes conditionally
- **From:** `src/lib/utils.js`
- **Example:**
```jsx
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "outline" && "outline-classes"
)}>
```

#### Lucide React Icons
- **What:** Icon library used by shadcn/ui
- **Usage:**
```jsx
import { Clock, Users, Plus } from 'lucide-react'
<Clock className="h-4 w-4" />
```

#### Fixed Sidebar Layout
```jsx
// Sidebar
<aside className="w-64 h-screen fixed left-0 top-0">

// Main content offset
<main className="ml-64 p-8">
```

---

## Files Created Day 3

**Session 2:**
- `src/context/UserContext.js` - User state management
- `src/lib/nutrition.js` - BMR/TDEE/macro calculations
- `src/components/UserSelector.jsx` - Dropdown for user switching

**Session 3:**
- `src/app/api/generate-meals/route.js` - Claude API integration

**Session 4:**
- `src/components/Sidebar.jsx` - Left navigation
- `src/components/MealCard.jsx` - Individual meal display
- `src/components/MealPlanner.jsx` - Generation form and grid
- `src/components/ui/button.jsx` - shadcn button
- `src/components/ui/card.jsx` - shadcn card
- `src/components/ui/input.jsx` - shadcn input
- `src/components/ui/select.jsx` - shadcn select
- `src/components/ui/dropdown-menu.jsx` - shadcn dropdown
- `src/components/ui/avatar.jsx` - shadcn avatar
- `src/lib/utils.js` - cn() utility
- `components.json` - shadcn configuration
- `docs/PROJECT-STATUS.md` - Project tracking

---

## Error Solutions Log (Updated)

| Error | Cause | Solution |
|-------|-------|----------|
| `setUser is not a function` | Context exported different name than component expected | Match export names: `user` not `currentUser` |
| `NaN` in meal macros | API returns nested object, component expected flat | Read from `meal.per_serve.calories` not `meal.calories_per_serve` |
| Instructions not showing | API returns string with `\n`, component expected array | Split string: `instructions.split('\n')` |

---

## Commands Learned Day 3

```bash
# shadcn/ui setup
npx shadcn@latest init

# Add shadcn component
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# etc.

# Install Anthropic SDK
npm install @anthropic-ai/sdk
```

---

## Questions / Things to Explore Later

- [x] ~~Claude API integration for meal generation~~ ✅ Done
- [ ] JSONB queries in Supabase
- [ ] Date/time handling in JavaScript
- [ ] Mobile-responsive cooking mode
- [ ] Drag-and-drop for meal planning
- [ ] Shopping list aggregation algorithm

---

---

## Day 4 - Thursday 4 December 2025

### Session 1 (Morning) - Setup & Planning

**Status check:**
- Confirmed all Day 3 work is in place (API, UI, database)
- Identified gap: meals generate and select but don't persist
- Next: Add date assignment + save to database

**Process improvement:**
- Set up git for version control (first commit)
- Established end-of-session save workflow
- Docs: PROJECT-STATUS.md for quick state, LEARNING-REFERENCE.md for details

**UI Decision (from Day 3 evening discussion):**

Three-column layout agreed:
```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR      │  GENERATE (middle)      │  WEEK PLAN (right)     │
│              │                         │                        │
│ User select  │  Constraints: ____      │  Thu 5 Dec             │
│ Macro targets│  Serves/Meals/Snacks    │  - Lunch: [empty]      │
│ Navigation   │  [Generate Week]        │  - Snack: [empty]      │
│              │                         │  - Dinner: [empty]     │
│              │  Generated Meals        │  - Snack: [empty]      │
│              │  [draggable cards]      │                        │
│              │                         │  Fri 6 Dec...          │
│              │  Generated Snacks       │                        │
│              │  [draggable cards]      │  [Commit All]          │
│              │                         │  [Clear Week]          │
└─────────────────────────────────────────────────────────────────┘
```

**Key features:**
- Drag-and-drop from generated meals to day slots
- "Commit All Suggestions" for fast acceptance
- Visual completion (see when slots filled)
- Snacks separate from main meals
- Per day: Lunch → Snack → Dinner → Snack (Galveston 16:8 fasting)

---

## End-of-Session Workflow

**At end of each session, ask Claude:**
> "End of session. Update PROJECT-STATUS.md and LEARNING-REFERENCE.md, then tell me the git command."

**Then run in terminal:**
```bash
cd ~/Documents/agent-workspace/adaptive-meal-builder
git add .
git commit -m "Day X Session Y - brief description"
```

---

*Last updated: Thursday 4 December 2025, 9:30 AM AEDT - Day 4 Session 1*
