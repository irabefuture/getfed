# Adaptive Meal Builder - Project Status

**Last Updated:** 4 December 2025  
**Ship Date:** 10 December 2025

---

## Quick Status

| What | Status |
|------|--------|
| **Current Phase** | Phase 2.3 - Save Plan to Database |
| **Next Action** | Add date assignment + save functionality |
| **Blocker** | None |
| **Schedule** | On track |

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
| Claude API integration | ✅ Complete |
| Sidebar component | ✅ Complete |
| MealCard component | ✅ Complete |
| MealPlanner (generate + select) | ✅ Complete |
| shadcn/ui components | ✅ Complete |
| **Assign dates to meals** | 🔜 Next |
| **Save plan to database** | 🔜 Next |
| View saved plans | ⏳ Pending |
| Shopping list generation | ⏳ Pending |
| Cooking mode | ⏳ Pending |
| Meal logging | ⏳ Pending |

---

## Current Functionality

**What works now:**
1. Select user (Ian or Rhonda) - calculates their personal macro targets
2. Enter constraints ("use the lamb", "no seafood")
3. Choose serves and meal count
4. Generate meals via Claude API (~$0.02 per generation)
5. View generated meals with ingredients, instructions, macros
6. Select/deselect meals to build a plan (in memory only)

**What's missing for MVP:**
1. Assign dates to selected meals (which day is each meal for?)
2. Save plan to `planned_meals` table
3. View saved plans
4. Shopping list from saved plans

---

## User Profiles

| User | Calories | Phase 1 Macros |
|------|----------|----------------|
| Ian | 2,300/day | 115g P / 179g F / 58g C |
| Rhonda | 1,850/day | 93g P / 144g F / 46g C |

---

## Build Phases (Revised)

1. ✅ **Foundation** (Days 1-2) - Project setup, ingredients, deployment
2. ✅ **Core Infrastructure** (Day 3) - Schema, users, API, UI components
3. 🔜 **Plan Persistence** (Day 4) - Date assignment, save to database, view plans
4. ⏳ **Shopping List** (Day 5-6) - Aggregation, units, checklist
5. ⏳ **Daily Execution** (Day 7-8) - Cooking mode, logging, portions
6. ⏳ **Polish & Ship** (Day 9-10) - Flexibility, ratings, final testing

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

## End-of-Session Save

```bash
cd ~/Documents/agent-workspace/adaptive-meal-builder
git add .
git commit -m "Day X Session Y - brief description"
```

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/PROJECT-SPEC.md` | Complete specification |
| `docs/LEARNING-REFERENCE.md` | Concepts, commands, daily progress |
| `PROJECT-STATUS.md` | This file - quick status |

---

*Last updated: 4 December 2025, 9:30 AM AEDT*
