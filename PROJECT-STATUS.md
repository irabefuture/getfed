# Adaptive Meal Builder - Project Status

**Last Updated:** 4 December 2025, 3:30 PM AEDT  
**Ship Date:** 10 December 2025

---

## Quick Status

| What | Status |
|------|--------|
| **Current Phase** | Recipe Library Architecture |
| **Next Action** | Extract full recipe set from book |
| **Blocker** | None |
| **Schedule** | On track (architecture pivot complete) |

---

## Architecture Pivot (Day 4)

**Before:** AI generates recipes on-demand via Claude API
- Slow (10-50 seconds)
- Error-prone (JSON parsing failures)
- No quality control
- Snacks = Meals (wrong)

**After:** Pre-made recipe library with smart selection
- Instant (database query)
- Guaranteed quality (Ian-curated)
- Proper meal type tagging
- Phase-aware, batch-aware, preference-aware

---

## What's Built

| Component | Status |
|-----------|--------|
| Next.js project | ✅ Complete |
| Supabase connection | ✅ Complete |
| Vercel deployment | ✅ Complete |
| 171 ingredients database | ✅ Complete |
| Ingredient browser with search/filter | ✅ Complete |
| Project specification | ✅ Complete |
| Database schema (7 tables) | ✅ Complete |
| User profiles (Ian + Rhonda) | ✅ Complete |
| UserContext (React state) | ✅ Complete |
| Nutrition calculations (BMR/TDEE) | ✅ Complete |
| Claude API integration | ✅ Complete (kept for future use) |
| Sidebar component (new nav) | ✅ Complete |
| WeekView component | ✅ Complete (needs recipe library) |
| **Recipe Schema** | ✅ Complete |
| **US→AU Mappings** | ✅ Complete |
| **Sample Recipes (8)** | ✅ Complete |
| Full recipe extraction | 🔜 Next |
| Recipes page UI | ⏳ Pending |
| Planner (smart selection) | ⏳ Pending |
| Shopping list generation | ⏳ Pending |

---

## New File Structure

```
adaptive-meal-builder/
├── data/
│   ├── ingredients.json              ← 171 Galveston ingredients
│   ├── schemas/
│   │   └── RECIPE-SCHEMA.md          ← Full recipe structure
│   ├── mappings/
│   │   ├── us-to-au-ingredients.json ← Ingredient name mapping
│   │   └── imperial-to-metric.json   ← Unit conversions
│   └── recipes-reference/            ← Book extracts (personal use)
│       ├── snacks-sample.json        ← 5 sample snacks
│       └── mains-sample.json         ← 3 sample mains
├── docs/
│   ├── galveston-guide/
│   │   └── galveston-diet-book.md    ← Full book content
│   ├── PROJECT-SPEC.md
│   ├── LEARNING-REFERENCE.md
│   └── COMPONENT-STRUCTURE.md
└── src/
    └── ... (app code)
```

---

## Revised Build Phases

1. ✅ **Foundation** (Days 1-2) - Project setup, ingredients, deployment
2. ✅ **Core Infrastructure** (Day 3) - Schema, users, API, UI components
3. ✅ **Recipe Architecture** (Day 4) - Schema design, mappings, samples
4. 🔜 **Recipe Library** (Day 5) - Full extraction from book
5. ⏳ **Recipes UI** (Day 6) - Browse, filter, favourites
6. ⏳ **Smart Planner** (Day 7-8) - Week generation from library
7. ⏳ **Shopping List** (Day 8-9) - Aggregation from plan
8. ⏳ **Polish & Ship** (Day 10) - Testing, fixes, deploy

---

## User Profiles

| User | Calories | Phase 1 Macros |
|------|----------|----------------|
| Ian | 2,300/day | 115g P / 179g F / 58g C |
| Rhonda | 1,850/day | 93g P / 144g F / 46g C |

---

## Live URL

**Production:** https://adaptive-meal-builder.vercel.app

---

## How to Resume

```bash
cd ~/Documents/agent-workspace/adaptive-meal-builder
npm run dev
```

Open: http://localhost:3000

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/PROJECT-SPEC.md` | Complete specification |
| `docs/LEARNING-REFERENCE.md` | Concepts, commands, daily progress |
| `data/schemas/RECIPE-SCHEMA.md` | Recipe structure definition |
| `PROJECT-STATUS.md` | This file - quick status |

---

*Last updated: 4 December 2025, 3:30 PM AEDT - Day 4 Session 2*
