# Adaptive Meal Builder - Edge Case Test Checklist

**Testing for:** Pre-ship QA
**Date:** December 2025
**Tester:** _______________

---

## 1. EMPTY STATES

### 1.1 Week View - No Meals Generated
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 1.1.1 | Fresh user, no meal plan | Clear localStorage, reload app | Shows empty week grid with "Generate Week" CTA, no errors in console | [ ] |
| 1.1.2 | Single day empty | Generate week, then delete all meals for one day | Day shows empty slots with placeholder state, daily totals show 0 | [ ] |
| 1.1.3 | Partial day (1-3 meals) | Generate week, delete some meals from a day | Remaining meals display, totals recalculate correctly | [ ] |

### 1.2 Shopping List - No Meals
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 1.2.1 | Generate list with no meals | Navigate to Shopping List with empty meal plan | Shows "No meals planned" message, no generate button or empty list | [ ] |
| 1.2.2 | All meals deleted after generation | Generate shopping list, then delete all meals, return to shopping | Shows stale list warning or prompts regeneration | [ ] |

### 1.3 Recipe Swap - No Alternatives
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 1.3.1 | Swap with strict dietary filters | Set all dietary restrictions, try to swap a meal | Shows "No alternatives match your filters" message | [ ] |
| 1.3.2 | Swap on day using all recipes | Fill all 4 slots with unique recipes, try swap | Excludes same-day recipes, still shows alternatives from other days | [ ] |

### 1.4 Household - No Members
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 1.4.1 | Household with 0 members | Delete all household members in Supabase | App falls back to default targets or shows setup wizard | [ ] |
| 1.4.2 | No primary member set | Unset is_primary on all members | Uses first member as default or prompts selection | [ ] |

---

## 2. ERROR STATES

### 2.1 AI Generation Failures
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 2.1.1 | API key invalid/missing | Remove ANTHROPIC_API_KEY env var, try generate | Shows user-friendly error "Unable to generate meals", logs detailed error | [ ] |
| 2.1.2 | Network timeout | Throttle network to 2G, attempt generation | Shows timeout error after reasonable wait (30-60s), allows retry | [ ] |
| 2.1.3 | AI returns malformed JSON | Mock API to return incomplete JSON | Falls back to JSON extraction regex, shows error if fails | [ ] |
| 2.1.4 | AI returns invalid recipe IDs | Mock API returning non-existent IDs | Reports invalid_ids in response, skips those slots or shows warning | [ ] |
| 2.1.5 | AI returns partial week (6 days) | Mock incomplete plan | Handles gracefully, generates for available days only | [ ] |
| 2.1.6 | Rate limit exceeded | Rapid-fire generation requests | Shows rate limit error, suggests wait time | [ ] |

### 2.2 Database Failures
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 2.2.1 | Supabase unreachable | Block Supabase domain in network | Shows "Unable to load household data" with retry option | [ ] |
| 2.2.2 | Household not found | Use invalid household ID | Falls back to single-user mode or shows setup flow | [ ] |
| 2.2.3 | Member data corrupted | Insert member with null required fields | Skips invalid member, logs warning, continues with valid members | [ ] |

### 2.3 Local Storage Failures
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 2.3.1 | LocalStorage full | Fill localStorage to quota, try save | Shows "Storage full" warning, doesn't lose current state | [ ] |
| 2.3.2 | LocalStorage disabled | Use private browsing without localStorage | Falls back to session-only state, warns user data won't persist | [ ] |
| 2.3.3 | Corrupted meal plan JSON | Manually corrupt localStorage meal-plan key | Detects corruption, clears and starts fresh with warning | [ ] |

### 2.4 Recipe Data Issues
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 2.4.1 | Recipe file missing | Rename lunch-mains.json temporarily | Shows "Unable to load recipes" error, doesn't crash | [ ] |
| 2.4.2 | Recipe with null per_serve | Add recipe with per_serve: null | Skips recipe in generation, doesn't divide by undefined | [ ] |
| 2.4.3 | Recipe with missing ingredients | Recipe with ingredients: [] | Renders meal card, shopping list skips it gracefully | [ ] |

---

## 3. BOUNDARY CONDITIONS

### 3.1 Body Stats - Extreme Inputs
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 3.1.1 | Minimum valid age (18) | Set DOB to exactly 18 years ago | Calculates BMR correctly, no NaN | [ ] |
| 3.1.2 | Maximum realistic age (100) | Set DOB to 100 years ago | Calculates without error (even if unrealistic) | [ ] |
| 3.1.3 | Age = 0 (infant DOB) | Set DOB to today | Blocks input or shows validation error | [ ] |
| 3.1.4 | Future DOB (negative age) | Set DOB in future | Shows validation error, doesn't calculate negative age | [ ] |
| 3.1.5 | Height 140cm (very short) | Set height to 140cm | Calculates valid BMR, portion multiplier reasonable | [ ] |
| 3.1.6 | Height 220cm (very tall) | Set height to 220cm | Calculates valid BMR, no overflow | [ ] |
| 3.1.7 | Height 0cm | Set height to 0 | Validation error, doesn't divide by zero | [ ] |
| 3.1.8 | Weight 40kg (underweight) | Set current weight to 40kg | Calculates BMR, may show health warning | [ ] |
| 3.1.9 | Weight 250kg (extreme) | Set current weight to 250kg | Calculates without overflow, portion multiplier clamped | [ ] |
| 3.1.10 | Weight 0kg | Set weight to 0 | Validation error, doesn't multiply by zero | [ ] |
| 3.1.11 | Target > Current (weight gain) | Set target_weight > current_weight | Adds calories (+300), doesn't subtract | [ ] |
| 3.1.12 | Target = Current (maintenance) | Set target_weight = current_weight | Uses TDEE directly, no deficit/surplus | [ ] |

### 3.2 Portion Multiplier Bounds
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 3.2.1 | Multiplier < 0.5 (tiny portion) | Set very low calorie target (800cal), high-cal recipe (1000cal/serve) | Clamps to 0.5x minimum, shows 0.5 serving | [ ] |
| 3.2.2 | Multiplier > 2.0 (huge portion) | Set high calorie target (4000cal), low-cal recipe (200cal/serve) | Clamps to 2.0x maximum, shows 2.0 servings | [ ] |
| 3.2.3 | Multiplier exactly 1.0 | Match calorie target to recipe exactly | Shows "1 serving" cleanly | [ ] |

### 3.3 Recipe Count Extremes
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 3.3.1 | Very few recipes (< 7) | Reduce recipe library to 5 lunch recipes | AI reuses recipes across days, warns about limited variety | [ ] |
| 3.3.2 | Maximum recipe usage | 28 meals (4×7), only 10 total recipes | Handles repetition, no infinite loop | [ ] |
| 3.3.3 | Single recipe per category | 1 lunch, 1 dinner, 1 each snack | Uses same recipes daily, no error | [ ] |

### 3.4 Date Navigation Boundaries
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 3.4.1 | Week spanning month end | Navigate to Dec 28 - Jan 3 | Dates format correctly, "Dec 28" to "Jan 3" | [ ] |
| 3.4.2 | Week spanning year end | Navigate to Dec 30 - Jan 5, 2026 | Year changes mid-week, dates correct | [ ] |
| 3.4.3 | Leap year Feb 29 | Set date to Feb 29, 2028 | Date displays and saves correctly | [ ] |
| 3.4.4 | Navigate far into future | Jump to December 2026 | Works but may show warning about planning far ahead | [ ] |
| 3.4.5 | Navigate to past | Try to select last week | Either blocks or allows viewing without editing | [ ] |

### 3.5 Shopping List Quantities
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 3.5.1 | Ingredient < 1g | Recipe with 0.5g spice | Shows "pinch" or similar, not "0g" | [ ] |
| 3.5.2 | Ingredient > 10kg | 14 dinners with 500g chicken each = 7kg+ | Displays in kg (e.g., "7.2 kg chicken"), not grams | [ ] |
| 3.5.3 | Fractional eggs | Calculation requires 2.3 eggs | Rounds up to 3 eggs (can't buy 0.3 egg) | [ ] |
| 3.5.4 | Ingredient appears 28 times | Same ingredient in every meal | Aggregates once with total, not 28 line items | [ ] |

---

## 4. DATA INTEGRITY

### 4.1 Missing/Null Data Handling
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 4.1.1 | Recipe without name | Recipe with name: null | Shows "Untitled Recipe" or skips gracefully | [ ] |
| 4.1.2 | Recipe without meal_type | Recipe missing meal_type field | Excluded from generation or assigned default | [ ] |
| 4.1.3 | Recipe without phase | Recipe missing phase array | Treated as compatible with all phases or excluded | [ ] |
| 4.1.4 | Ingredient without grams | Ingredient: { name: "salt", grams: null } | Shows "to taste" or excludes from shopping list | [ ] |
| 4.1.5 | Member without targets | Member object missing targets property | Recalculates on-the-fly or shows settings prompt | [ ] |
| 4.1.6 | Meal slot with undefined recipe | meals.monday.lunch = undefined | Shows empty slot, doesn't crash on .name access | [ ] |

### 4.2 Malformed Data
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 4.2.1 | Negative calorie recipe | Recipe with per_serve.calories: -500 | Filtered out or shows data error warning | [ ] |
| 4.2.2 | Non-numeric macros | Recipe with protein_g: "high" | Type coercion handles or shows validation error | [ ] |
| 4.2.3 | base_servings = 0 | Recipe with base_servings: 0 | Prevents divide-by-zero, uses default of 1 | [ ] |
| 4.2.4 | Invalid phase number | Member with current_phase: 5 | Falls back to Phase 1 defaults | [ ] |
| 4.2.5 | Invalid activity_level | Member with activity_level: "extreme" | Falls back to "sedentary" multiplier (1.2) | [ ] |
| 4.2.6 | Duplicate recipe IDs | Two recipes with same ID in library | First one wins or shows duplicate warning | [ ] |

### 4.3 Cross-Component Data Consistency
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 4.3.1 | Swap recipe, check shopping list | Swap a meal, regenerate shopping list | New ingredient quantities reflect swapped recipe | [ ] |
| 4.3.2 | Change member macros, check portions | Update member's calorie target | Portion displays update immediately | [ ] |
| 4.3.3 | Add household member, check shopping | Add 3rd member, view shopping list | Shopping quantities increase appropriately (~50%) | [ ] |
| 4.3.4 | Change phase, check recipe filtering | Switch from Phase 1 to Phase 3 | Recipe options expand (more carb-friendly recipes) | [ ] |
| 4.3.5 | Delete meal, check daily totals | Remove dinner from a day | Daily calorie/macro totals recalculate | [ ] |

### 4.4 Household Calculation Edge Cases
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 4.4.1 | Two members, vastly different needs | Ian: 2300cal, Child: 1200cal | Portions scale correctly (1.79x vs 0.93x for 805cal lunch) | [ ] |
| 4.4.2 | Member portion rounds to 0.5x | Low calorie member + high calorie recipe | Clamps at 0.5, doesn't show 0.3x | [ ] |
| 4.4.3 | Household sum > 4.0 servings | 3 members with high needs | Shopping list handles large quantities correctly | [ ] |
| 4.4.4 | Conflicting dietary restrictions | Ian: none, Rhonda: gluten-free | Household mode uses gluten-free only (AND logic) | [ ] |
| 4.4.5 | Different phases | Ian: Phase 1, Rhonda: Phase 2 | Uses most restrictive (Phase 1) for generation | [ ] |

---

## 5. RACE CONDITIONS & ASYNC ISSUES

### 5.1 Concurrent Operations
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 5.1.1 | Swap during generation | Start "Generate Week", immediately try to swap | Swap blocked during generation or queued | [ ] |
| 5.1.2 | Double-click generate | Rapidly click "Generate Week" twice | Only one API call made, button disabled during load | [ ] |
| 5.1.3 | Navigate away during generation | Start generation, switch to Settings tab | Generation completes in background or cancels cleanly | [ ] |
| 5.1.4 | Edit settings during generation | Change dietary restrictions while generating | Uses settings at generation start, not mid-flight changes | [ ] |
| 5.1.5 | Rapid recipe swapping | Swap 5 recipes in quick succession | All swaps saved correctly, no lost updates | [ ] |

### 5.2 State Sync Issues
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 5.2.1 | Two browser tabs | Open app in 2 tabs, modify meals in one | Other tab shows stale warning or syncs on focus | [ ] |
| 5.2.2 | Offline then online | Go offline, make changes, reconnect | Changes persist locally, no data loss | [ ] |
| 5.2.3 | Page refresh during save | Refresh immediately after swapping meal | Swap persisted to localStorage before unload | [ ] |

---

## 6. UI/DISPLAY EDGE CASES

### 6.1 Text Overflow & Long Content
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 6.1.1 | Recipe with 50+ char name | "Mediterranean Herb-Crusted Salmon with Roasted Vegetables and Lemon" | Truncates with ellipsis or wraps cleanly | [ ] |
| 6.1.2 | Ingredient with long name | "Extra virgin cold-pressed organic olive oil" | Wraps or truncates, no horizontal scroll | [ ] |
| 6.1.3 | Recipe with 20+ ingredients | Large complex recipe | Ingredient list scrollable or paginated | [ ] |
| 6.1.4 | Shopping list 100+ items | Full week with varied recipes | List renders performantly, grouped correctly | [ ] |

### 6.2 Print/Export
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 6.2.1 | Print recipes for day | Click print on a day's recipes | All 4 recipes fit on page(s) with readable layout | [ ] |
| 6.2.2 | Print shopping list | Print shopping list with 50+ items | Page breaks between categories, all items visible | [ ] |
| 6.2.3 | Print with checked items | Check some items, print list | Checked items marked or excluded (user preference) | [ ] |

### 6.3 Responsive/Mobile
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 6.3.1 | Week view on mobile | View on 375px width screen | Day tabs scrollable, meal cards stack vertically | [ ] |
| 6.3.2 | Swap panel on mobile | Open swap panel on mobile | Full-screen or bottom sheet, not cut off | [ ] |
| 6.3.3 | Settings form on mobile | Edit member stats on mobile | All fields accessible, keyboard doesn't obscure | [ ] |

---

## 7. SECURITY & INPUT VALIDATION

### 7.1 XSS Prevention
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 7.1.1 | Script in recipe name | Add recipe with name: `<script>alert('xss')</script>` | Escaped, displays as text, no alert | [ ] |
| 7.1.2 | HTML in member name | Set member name to `<b>Bold</b>` | Displays as literal text, not bold | [ ] |
| 7.1.3 | Script in ingredient | Ingredient name with JS injection | Escaped in shopping list | [ ] |

### 7.2 Input Sanitization
| # | Test Case | Steps | Expected Behavior | Pass |
|---|-----------|-------|-------------------|------|
| 7.2.1 | Negative weight input | Enter -80 for weight | Validation error, blocks submission | [ ] |
| 7.2.2 | Non-numeric height | Enter "tall" for height | Validation error, shows number required | [ ] |
| 7.2.3 | SQL injection in search | Search recipes with `'; DROP TABLE--` | Search fails safely, no DB impact | [ ] |
| 7.2.4 | Empty required fields | Submit settings with blank name | Validation error, field highlighted | [ ] |

---

## CRITICAL PATH TESTS (Must Pass Before Ship)

These are the absolute must-pass scenarios combining multiple edge cases:

| # | Critical Scenario | Steps | Expected | Pass |
|---|-------------------|-------|----------|------|
| C1 | First-time user flow | Clear all data, open app fresh, generate week, commit shopping list | Complete flow works, no crashes | [ ] |
| C2 | Household with dietary restrictions | 2 members, one gluten-free, generate week | Only GF recipes appear | [ ] |
| C3 | Full week generation + shopping | Generate 7 days, all slots filled, generate shopping | 28 meals = correct ingredient totals | [ ] |
| C4 | Recipe swap preserves integrity | Swap 3 recipes, regenerate shopping | Shopping list reflects current meals | [ ] |
| C5 | Portion calculation accuracy | Ian + Rhonda, check a 450cal lunch recipe | Ian: 1.79x, Rhonda: 1.44x, Total: 3.23 servings | [ ] |
| C6 | Offline resilience | Go offline, browse meals, go online | No data loss, no crashes | [ ] |
| C7 | Error recovery | Trigger API error, dismiss, try again | Second attempt works, no stuck state | [ ] |
| C8 | Week boundary handling | Navigate to Dec 30 - Jan 5 | Dates correct, generation works | [ ] |

---

## Test Results Summary

| Category | Total | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Empty States | 10 | | | |
| Error States | 15 | | | |
| Boundary Conditions | 25 | | | |
| Data Integrity | 22 | | | |
| Race Conditions | 8 | | | |
| UI/Display | 10 | | | |
| Security | 7 | | | |
| Critical Path | 8 | | | |
| **TOTAL** | **105** | | | |

---

## Notes & Issues Found

| Test # | Issue Description | Severity | Status |
|--------|-------------------|----------|--------|
| | | | |
| | | | |
| | | | |

---

*Generated: December 2025*
