# Adaptive Meal Builder - Project Instructions

> Project-specific rules for Claude Code. Updated: 26 November 2025

## Project Overview

**Ship Date:** 10 December 2025
**Purpose:** Anti-inflammatory meal planning for Ian & Rhonda
**Type:** Personal tool MVP (learning project)

---

## Build Philosophy

This is a SHIPPING project, not a research project.

- Don't overthink - build
- Don't expand scope - ship first
- Don't let perfect block good
- Make decisions, move forward

---

## Week 1 Target (by 3 Dec)

- [ ] Live website deployed (not localhost)
- [ ] Generate recipe for any of 4 meal types
- [ ] Uses real AFCD ingredients
- [ ] Macros calculated and displayed
- [ ] Ian used it for actual meal planning

## Week 2 Target (by 10 Dec)

- [ ] User authentication working
- [ ] Preferences saved and applied
- [ ] Recipe history with ratings
- [ ] "Generate Another" with saved preferences

---

## Technical Decisions

**Frontend:** [TO DECIDE - Friday session]
**Backend/API:** [TO DECIDE - Friday session]
**Database:** [TO DECIDE - Friday session]
**Auth:** Simple OAuth (Google) or email/password
**Hosting:** [TO DECIDE - Friday session]
**AI API:** Claude API or Gemini API for recipe generation

**Data Source:** Australian Food Composition Database (AFCD)
- Subset of 50-100 core anti-inflammatory ingredients
- Metric measurements only
- Australian ingredient names

---

## Meal Types & Constraints

**Meal Types:**
- Lunch
- Afternoon Snack
- Dinner
- Evening Snack

**Diet Principles (Galveston-inspired, no branding):**
- Anti-inflammatory focus
- Intermittent fasting compatible
- Macro ratio targets (protein/fat/carb balance)
- No specific Galveston Diet IP used

**User Constraints (optional per generation):**
- Ingredient exclusions ("no coriander")
- Ingredient preferences ("something with chicken")
- Saved in user profile

---

## Output Format (per recipe)

```
Recipe Name: [Name]

Ingredients:
- [amount] [unit] [ingredient]
- ...

Instructions:
1. [step]
2. [step]
...

Macros:
- Protein: [X]g
- Fat: [X]g
- Carbs: [X]g
- Calories: [X]
```

---

## Explicitly Out of Scope (V1)

DO NOT BUILD:
- Multiple diet types
- Multiple user profiles
- Health/weight tracking
- Grocery lists
- Meal planning calendar
- Pantry integration
- Cost optimisation
- Payment system
- Recipe upload/compliance checking
- Galveston Diet branding

---

## File Structure

```
adaptive-meal-builder/
├── claude-instructions.md   # THIS FILE
├── src/                     # Application code
├── data/                    # AFCD ingredient subset
├── docs/                    # Technical decisions, architecture notes
└── README.md                # Setup instructions
```

---

## Success = Daily Use

MVP is successful when Ian uses this daily instead of manually asking Claude to convert recipes.
