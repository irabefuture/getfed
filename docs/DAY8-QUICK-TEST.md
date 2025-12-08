# Day 8 Quick Test Checklist

**Date:** 8 December 2025
**Time:** ~45 minutes total
**Purpose:** Essential pre-ship validation

---

## Part A: Critical Path (Must Pass) - 20 mins

| # | Test | Steps | Pass |
|---|------|-------|------|
| C1 | First-time user flow | Clear localStorage, reload, generate week, commit shopping | [ ] |
| C3 | Full week + shopping | Generate 7 days, verify shopping list has correct totals | [ ] |
| C4 | Swap preserves integrity | Swap 3 recipes, regenerate shopping list, verify changes | [ ] |
| C5 | Portion accuracy | View a recipe, check Ian ~55% / Rhonda ~45% portions | [ ] |
| C7 | Error recovery | Disconnect network, try generate, reconnect, retry works | [ ] |

---

## Part B: Empty States - 5 mins

| # | Test | Steps | Pass |
|---|------|-------|------|
| 1.1.1 | Fresh user | Clear localStorage, reload - shows empty week, no errors | [ ] |
| 1.2.1 | Empty shopping | With no meals, go to Shopping List - shows helpful message | [ ] |
| 1.3.1 | No swap alternatives | Set restrictive filters in swap panel - shows "no matches" | [ ] |

---

## Part C: Ingredient Formatting (NEW) - 5 mins

| # | Test | Steps | Pass |
|---|------|-------|------|
| F1 | Small quantities | Find recipe with cinnamon/spices - shows "1/2 tsp" not "0.5g" | [ ] |
| F2 | AU names | Find "Pumpkin Spice Walnuts" - shows "mixed spice" not "pumpkin pie spice" | [ ] |
| F3 | Print formatting | Print a day's recipes - quantities show practical measures | [ ] |

---

## Part D: Shopping List Quantities - 5 mins

| # | Test | Steps | Pass |
|---|------|-------|------|
| 3.5.1 | Tiny amounts | Spices aggregate correctly, show "1 tsp" type measures | [ ] |
| 3.5.3 | Egg rounding | Eggs round UP (can't buy 0.3 of an egg) | [ ] |
| 3.5.4 | Aggregation | Same ingredient across meals = single line item | [ ] |

---

## Part E: Cross-Component Consistency - 10 mins

| # | Test | Steps | Pass |
|---|------|-------|------|
| 4.3.1 | Swap → Shopping | Swap a meal, regenerate shopping - new ingredients appear | [ ] |
| 4.3.5 | Delete → Totals | Remove a meal - daily totals recalculate correctly | [ ] |

---

## Part F: Mobile Quick Check - 5 mins

| # | Test | Steps | Pass |
|---|------|-------|------|
| M1 | Week view | Days visible, tappable, meals readable | [ ] |
| M2 | Recipe expand | Tap recipe, ingredients list readable | [ ] |
| M3 | Swap panel | Opens, search works, can select alternative | [ ] |

---

## Results Summary

| Section | Tests | Passed |
|---------|-------|--------|
| Critical Path | 5 | /5 |
| Empty States | 3 | /3 |
| Ingredient Formatting | 3 | /3 |
| Shopping Quantities | 3 | /3 |
| Cross-Component | 2 | /2 |
| Mobile | 3 | /3 |
| **TOTAL** | **19** | **/19** |

---

## Issues Found

| Test | Issue | Severity | Fix Now? |
|------|-------|----------|----------|
| | | | |
| | | | |

---

## Quick Reference

**Local URL:** http://localhost:3000
**Mobile URL:** http://192.168.20.10:3000

**Clear localStorage:**
```javascript
localStorage.clear(); location.reload();
```

**Recipes with spices to test:**
- Snacks → Pumpkin Spice Walnuts
- Breakfast → any with cinnamon
- Dinner → Stuffed Capsicums (paprika)

---

*Run before Rhonda user testing (Phase 2)*
