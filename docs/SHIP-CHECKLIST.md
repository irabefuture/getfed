# Ship Checklist - Adaptive Meal Builder

**Created:** 8 December 2025  
**Ship Date:** Friday 12 December 2025 (mid-afternoon)  
**Purpose:** Orchestration guide for shipping MVP with AI agents

---

## How to Use This Checklist

You are the **orchestrator**. Each step tells you:
1. **What** needs to happen
2. **Which agent** to use
3. **What prompt** to give them
4. **What output** to expect
5. **What decision** you make based on output

Work through sequentially. Check boxes as you complete. If an agent gives you something that needs action, you decide: fix now, fix later, or skip.

---

## Pre-Flight: Workspace Setup

Before starting each session:

```bash
cd ~/Documents/agent-workspace/adaptive-meal-builder
```

**Agent tabs ready:**
- [ ] @tech-developer - for fixes and code changes
- [ ] @code-reviewer - for code quality checks
- [ ] @qa-tester - for systematic testing
- [ ] @mobile-reviewer - for responsive testing
- [ ] @scope-guardian - for scope decisions
- [ ] @ship-checklist - for pre-production verification

---

## Phase 1: Technical Validation

### 1.1 Mobile Responsiveness Testing

**You do:** Start the dev server
```bash
npm run dev
```

**You do:** Open http://localhost:3000 on your phone (same network)
- Find your Mac's IP: System Settings → Network → Wi-Fi → Details → IP Address
- On phone: http://[YOUR-IP]:3000

**You do:** Work through each screen, note issues

| Screen | Test | Issue Found? |
|--------|------|--------------|
| Week View | Days visible and tappable? | |
| Week View | Meal cards readable? | |
| Week View | Generate button accessible? | |
| Meal Detail | Recipe expands correctly? | |
| Meal Detail | Ingredients list readable? | |
| Recipe Swap | Panel opens on mobile? | |
| Recipe Swap | Search/filter usable? | |
| Recipe Swap | Cards tappable? | |
| Shopping List | List displays correctly? | |
| Shopping List | Checkboxes tappable? | |
| Settings | Form fields usable? | |
| Recipes Browser | Grid/list works? | |
| Recipes Browser | Filters work? | |

**→ Agent: @mobile-reviewer**

Prompt:
```
I've tested mobile responsiveness on the Adaptive Meal Builder. Here are the issues I found:

[PASTE YOUR ISSUES HERE]

For each issue:
1. Classify as CRITICAL (blocks usage), HIGH (frustrating), or LOW (cosmetic)
2. Suggest the likely fix (which file, what CSS change)
3. Estimate fix time

Format as a table I can work through.
```

**Output expected:** Prioritised issue table with fix suggestions

**Your decision:** Which issues to fix before ship vs document for later

---

### 1.2 Edge Case Testing

**→ Agent: @qa-tester**

Prompt:
```
I need to test edge cases for Adaptive Meal Builder before shipping. The app has:
- Week view with meal slots (4 meals per day × 7 days)
- AI-powered meal plan generation
- Recipe swap functionality
- Shopping list generation
- User settings (body stats for macro calculation)

Generate a systematic edge case test checklist covering:
1. Empty states (no data scenarios)
2. Error states (what happens when things fail)
3. Boundary conditions (extreme inputs)
4. Data integrity (missing/malformed data)

Format as a checklist I can work through manually, with expected behavior for each case.
```

**Output expected:** Comprehensive test checklist

**You do:** Work through the checklist on localhost, note failures

**→ Agent: @qa-tester** (follow-up)

Prompt:
```
I ran through the edge case tests. Here are the failures:

[PASTE YOUR FAILURES]

For each failure:
1. Is this CRITICAL (app crashes/unusable) or GRACEFUL-FAIL-NEEDED (should show message instead)?
2. What's the fix approach?
```

**Output expected:** Prioritised fix list

---

### 1.3 Performance Check

**You do:** Time these operations with a stopwatch

| Operation | Time | Acceptable? |
|-----------|------|-------------|
| Initial page load (cold) | | <3s good, <5s okay |
| Navigate between views | | <1s |
| Generate week (API call) | | <30s (user knows it's AI) |
| Open recipe swap panel | | <1s |
| Generate shopping list | | <2s |
| Recipe browser load | | <3s |

**Your decision:** Any showstoppers? Document for later or fix now?

---

## Phase 2: User Testing with Rhonda

### 2.1 Preparation

**→ Agent: @qa-tester**

Prompt:
```
I'm doing user testing with Rhonda (my partner, non-technical user) for the Adaptive Meal Builder. She'll be one of the two actual users.

Create a user testing script with:
1. Brief intro (what to say to her)
2. 5 task-based tests (things to ask her to do, without telling her how)
3. Observation prompts (what to watch for)
4. Feedback questions (what to ask after)

Keep it casual - this is a kitchen-table test, not a formal study.
```

**Output expected:** Testing script

**You do:** Run the session with Rhonda, take notes

---

### 2.2 Feedback Processing

**→ Agent: @scope-guardian**

Prompt:
```
Rhonda tested the Adaptive Meal Builder. Here's her feedback:

[PASTE YOUR NOTES]

Categorise each item:
1. CRITICAL - Blocks her from using the app
2. HIGH - Significantly frustrating, should fix before ship
3. MEDIUM - Would improve experience, could be post-ship
4. LOW - Nice to have, definitely post-ship
5. OUT OF SCOPE - Feature request for future version

Be ruthless. We ship Friday. Only CRITICAL and HIGH get fixed.
```

**Output expected:** Prioritised feedback with scope recommendations

**Your decision:** Final call on what gets fixed

---

## Phase 3: Issue Resolution

### 3.1 Critical Fixes

**→ Agent: @tech-developer**

For each CRITICAL issue:

Prompt:
```
Fix needed for Adaptive Meal Builder:

**Issue:** [DESCRIBE THE PROBLEM]
**Where it happens:** [WHICH SCREEN/COMPONENT]
**Expected behavior:** [WHAT SHOULD HAPPEN]

The project is at: ~/Documents/agent-workspace/adaptive-meal-builder

Find the relevant file and implement the fix. Explain what you changed and why.
```

**You do:** Test the fix, confirm it works

**You do:** Commit after each fix
```bash
git add .
git commit -m "Fix: [brief description of what was fixed]"
```

---

### 3.2 High Priority Fixes

Same process as 3.1, but only if time permits after CRITICAL fixes done.

---

### 3.3 Document Backlog

**You do:** Create/update backlog file

```bash
# Create if doesn't exist
touch docs/BACKLOG.md
```

**→ Agent: @tech-developer**

Prompt:
```
Add these items to the post-ship backlog in docs/BACKLOG.md:

[PASTE MEDIUM/LOW/OUT-OF-SCOPE ITEMS]

Format as a markdown list with brief descriptions. Don't elaborate - just capture for later.
```

---

## Phase 4: UI Polish (Timeboxed)

**⚠️ TIMEBOX: Maximum 2 hours total for this phase**

**→ Agent: @scope-guardian**

Prompt:
```
I have 2 hours maximum for UI polish before shipping Adaptive Meal Builder.

Here are things that bother me or Rhonda mentioned:

[LIST YOUR POLISH ITEMS]

1. Which 3-5 items would have the highest impact for lowest effort?
2. Which should I skip entirely?

Be brutal. This is a 2-user personal app shipping in [X] days.
```

**Output expected:** Focused polish list

**→ Agent: @tech-developer**

For each approved polish item:
```
UI polish for Adaptive Meal Builder:

**Change:** [WHAT TO CHANGE]
**Where:** [WHICH COMPONENT]
**Current:** [WHAT IT LOOKS LIKE NOW]
**Desired:** [WHAT IT SHOULD LOOK LIKE]

Make the change. Keep it simple.
```

**You do:** Verify each change, commit
```bash
git add .
git commit -m "Polish: [brief description]"
```

---

## Phase 5: Pre-Production Checklist

**→ Agent: @code-reviewer**

Prompt:
```
Pre-production code review for Adaptive Meal Builder.

Project: ~/Documents/agent-workspace/adaptive-meal-builder

Check for:
1. Any console.log statements that should be removed
2. Hardcoded localhost URLs that should be relative
3. API keys or secrets exposed in client-side code
4. TODO comments that indicate incomplete work
5. Error handling - are errors caught and displayed gracefully?

Report findings as a checklist with file locations.
```

**Output expected:** Issue list with locations

**→ Agent: @tech-developer**

Fix any issues found.

---

### 5.1 Build Verification

**You do:**
```bash
npm run build
```

**Expected:** Build succeeds with no errors

**If errors:** 
```
→ Agent: @tech-developer

Build failed with this error:

[PASTE ERROR]

Fix it.
```

---

### 5.2 Environment Check

**You do:** Verify Vercel environment variables

1. Go to: https://vercel.com → Your project → Settings → Environment Variables
2. Confirm these exist for Production:
   - [ ] `ANTHROPIC_API_KEY`
   - [ ] `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Phase 6: Deploy to Production

### 6.1 Final Documentation Update

**→ Agent: @tech-developer**

Prompt:
```
Update PROJECT-STATUS.md for Adaptive Meal Builder:

- Status: Shipped
- Ship date: [TODAY'S DATE]
- Summary of what was completed
- Known issues / backlog reference
- How to run locally for future development

Keep it concise.
```

---

### 6.2 Final Commit and Push

**You do:**
```bash
git add .
git commit -m "Ship: Adaptive Meal Builder v1.0 - [DATE]"
git push origin main
```

**You do:** Watch Vercel build
- Go to: https://vercel.com → Your project → Deployments
- Wait for build to complete (usually 1-2 minutes)

---

### 6.3 Production Verification

**You do:** Test on production URL

| Test | Pass? |
|------|-------|
| Site loads at https://adaptive-meal-builder.vercel.app | |
| Can switch users | |
| Can generate a meal plan | |
| Can swap a recipe | |
| Shopping list generates correctly | |
| Works on phone (production URL) | |

**If anything fails:** 
```
→ Agent: @tech-developer

Production issue:
[DESCRIBE WHAT'S BROKEN]

This works on localhost but not production. Diagnose and fix.
```

---

## Phase 7: Post-Ship

### 7.1 Learning Capture

**→ Agent: @session-closer** (or do yourself)

Prompt:
```
The Adaptive Meal Builder shipped today. Help me capture learnings.

What happened during the project:
[BRIEF SUMMARY OF THE BUILD - key decisions, pivots, bugs, surprises]

Structure a retrospective covering:
1. What took longer than expected?
2. What went smoother than expected?
3. What would I do differently next time?
4. What new concepts/skills are now solid?
5. What's still fuzzy and needs more practice?

Format for adding to LEARNING-REFERENCE.md
```

**You do:** Add to LEARNING-REFERENCE.md

---

### 7.2 Final Commit

```bash
git add .
git commit -m "Post-ship: Documentation and retrospective"
git push origin main
```

---

## Quick Reference: Agent Roles

| Agent | Use For |
|-------|---------|
| @tech-developer | Writing/fixing code, file changes |
| @code-reviewer | Quality checks, finding problems |
| @qa-tester | Test planning, systematic testing |
| @mobile-reviewer | Responsive design issues |
| @scope-guardian | Prioritisation, scope decisions |
| @ship-checklist | Pre-production verification |
| @session-closer | End-of-session documentation |

---

## Session End Protocol

At end of each session:

1. **Commit your work:**
```bash
git add .
git commit -m "Day [X] Session [Y]: [what was accomplished]"
```

2. **Update PROJECT-STATUS.md** with current state

3. **Note where you stopped** so next session can resume

---

*This checklist is your orchestration guide. You direct, agents execute, you decide.*
