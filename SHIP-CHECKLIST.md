# Adaptive Meal Builder - Updated Ship Checklist

**Last Updated:** Tuesday 9 December 2025, 1:30 PM  
**Ship Date:** Friday 12 December 2025

---

## Phase 1: Technical Validation ✅ MOSTLY COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| **1.1 Mobile Responsiveness** | ✅ Done | Day 8-9 extensive testing on iPhone 13 |
| Swipe left → Swap/Add | ✅ Done | Gmail-style two-stage swipe |
| Swipe right → Recipe | ✅ Done | Same pattern |
| Recipe picker full screen | ✅ Done | No grey backdrop |
| Recipe overlay layout | ✅ Done | Fixed header, scroll content, bottom close |
| Screen shifting bug | ✅ Done | Viewport lock, touchcancel handler |
| Keyboard auto-focus | ✅ Done | Fixed focus management |
| **1.2 Edge Case Testing** | 🔄 Partial | |
| Empty slots - Add works | ✅ Done | Swipe to add |
| Generate AI fills partial days | ✅ Done | Fixed 9 Dec |
| Empty shopping list | ❓ Not tested | |
| Error states (API fails) | ❓ Not tested | |
| Long recipe names | ❓ Not tested | |
| **1.3 Performance Check** | ❓ Not done | |
| Page load times | ❓ | |
| API response times | ❓ | |

---

## Phase 2: User Testing with Rhonda ❌ NOT STARTED

| Task | Status |
|------|--------|
| Observation session | ❌ Scheduled |
| Task-based testing | ❌ |
| Feedback capture | ❌ |
| Prioritisation | ❌ |

---

## Phase 3: Issue Resolution 🔄 IN PROGRESS

| Issue | Status |
|-------|--------|
| Swipe gestures | ✅ Done |
| Recipe picker UX | ✅ Done |
| Recipe overlay layout | ✅ Done |
| Print recipe blank | ✅ Done |
| Print breaks overlay bottom | ✅ Done |
| Recipe picker differentiation | ✅ Done |
| Wake Lock for cooking | ✅ Done |
| IP address sanitisation | ✅ Done |

---

## Phase 4: UI Polish ❌ NOT STARTED (TIMEBOXED)

| Task | Status |
|------|--------|
| Consistency pass | ❌ |
| Spacing patterns | ❌ |
| Typography hierarchy | ❌ |

---

## Phase 5: Pre-Production Checklist ❌ NOT STARTED

| Task | Status |
|------|--------|
| Production API keys in Vercel | ❓ |
| Supabase connection correct | ❓ |
| Error messages user-friendly | ❓ |
| No credentials in client code | ❓ |
| `npm run build` succeeds | ❓ |

---

## Phase 6: Deploy to Production ❌ FRIDAY

| Task | Status |
|------|--------|
| Final commit | ❌ |
| Push to main | ❌ |
| Vercel deploy | ❌ |
| Production verification | ❌ |

---

## Phase 7: Post-Ship ❌ AFTER FRIDAY

| Task | Status |
|------|--------|
| Retrospective | ❌ |
| Documentation update | ❌ |
| Backlog captured | ❌ |

---

## Other Pages Still To Review

| Page | Status |
|------|--------|
| **Planner** | 🔄 Final check after current fixes |
| **Recipes browser** | ❌ Not tested this session |
| **Shopping list** | ❌ Not tested this session |
| **Family settings** | ❌ Not tested |
| **App settings** | ❌ Not tested |

---

## Post-Ship: Commercial Readiness (If Going Public)

| Category | Task | Priority |
|----------|------|----------|
| **Auth & Security** | Supabase Auth (login/signup/OAuth) | Critical |
| | Row Level Security (data isolation) | Critical |
| | Password reset flow | Critical |
| | Session management | Critical |
| **Payments** | Stripe or LemonSqueezy integration | Critical |
| | Subscription tiers (free/paid) | Critical |
| | Payment webhooks | Critical |
| | Invoice/receipt emails | High |
| **Multi-tenancy** | User-specific meal plans | Critical |
| | User-specific shopping lists | Critical |
| | User profiles (not just Ian + Rhonda) | Critical |
| **Onboarding** | New user flow (body stats, goals) | High |
| | Diet preference selection | High |
| | Tutorial/first-run experience | Medium |
| **Legal** | Privacy policy | Critical |
| | Terms of service | Critical |
| | Cookie consent (if needed) | Medium |
| **Recipe IP** | Licensing for Galveston Diet recipes | Critical |
| | Or: Replace with original/licensed recipes | Critical |
| **Analytics** | Usage tracking (Plausible/PostHog) | Medium |
| | Error monitoring (Sentry) | High |
| **Marketing** | Landing page | High |
| | Email capture | High |
| | Paid ads creative | Medium |
| **Scale** | Database optimisation | Medium |
| | API rate limiting | Medium |
| | CDN for assets | Low |

---

## Session Progress Log

### Day 9 Session 1 (Morning)
- Swipe left → Swap/Add (Gmail-style)
- Swipe right → Recipe overlay
- Recipe picker full screen
- Code review fixes (touchcancel, touch-action CSS)
- Search focus bug fixed
- Wake Lock implemented

### Day 9 Session 2 (Afternoon)
- Generate AI partial days fixed
- Print recipe fixed
- Print overlay bottom section fixed
- Recipe picker differentiation
- Final Planner walkthrough (pending)
- Other pages review (pending)

---

*Update this file as tasks complete*
