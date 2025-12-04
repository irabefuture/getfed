# Component Structure - Adaptive Meal Builder

**Created:** Day 4 Session 1 (4 December 2025)
**Purpose:** Detailed breakdown of UI components for revised app structure

---

## App Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APP SHELL                                    │
├──────────────┬──────────────────────────────────────────────────────┤
│   SIDEBAR    │                 MAIN CONTENT                         │
│   (fixed)    │                 (scrollable)                         │
│              │                                                       │
│  240px       │              flex-1                                  │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── Layout
│   ├── Sidebar
│   │   ├── UserSelector (existing)
│   │   ├── NavItem: This Week
│   │   ├── NavItem: Next Week
│   │   ├── NavItem: Shopping List
│   │   └── NavItem: Settings
│   │
│   └── MainContent
│       ├── WeekView (default route)
│       │   ├── WeekHeader
│       │   │   ├── WeekTitle ("This Week: Dec 2-8")
│       │   │   └── GenerateButton (with serving selector)
│       │   ├── DayStrip (Mon-Sun navigation)
│       │   └── DayDetail
│       │       ├── DayHeader ("Thursday 5 December")
│       │       ├── MealCard (Lunch)
│       │       ├── MealCard (Afternoon Snack)
│       │       ├── MealCard (Dinner)
│       │       ├── MealCard (Evening Snack)
│       │       └── DayTotals
│       │
│       └── ShoppingListView (route: /shopping)
│           ├── ShoppingHeader
│           ├── ShoppingSection (grouped by category)
│           └── ShoppingItem (checkbox + name + quantity)
```

---

## Component Details

### 1. Sidebar (revised from existing)

**File:** `src/components/Sidebar.jsx` (update existing)

**Changes needed:**
- Remove ingredient browser link
- Add: This Week, Next Week, Shopping List, Settings
- Keep: UserSelector at top
- Remove: Macro display (move to WeekView)

```jsx
// Navigation items
const navItems = [
  { id: 'this-week', label: 'This Week', icon: '📅', route: '/' },
  { id: 'next-week', label: 'Next Week', icon: '📅', route: '/next-week' },
  { id: 'shopping', label: 'Shopping List', icon: '🛒', route: '/shopping' },
  { id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' },
];
```

---

### 2. WeekView (new component)

**File:** `src/components/WeekView.jsx`

**Props:**
- `weekOffset`: 0 for this week, 1 for next week

**State:**
- `selectedDay`: which day is expanded (default: today or Monday)
- `meals`: array of meals for the week from database
- `isGenerating`: boolean for loading state

**Subcomponents:**

#### 2a. WeekHeader
```jsx
<WeekHeader>
  <WeekTitle>This Week: Dec 2-8</WeekTitle>
  <GenerateButton 
    servings={servings}
    onServingsChange={setServings}
    onGenerate={handleGenerate}
    isGenerating={isGenerating}
  />
</WeekHeader>
```

#### 2b. DayStrip
```jsx
<DayStrip>
  {daysOfWeek.map(day => (
    <DayTab 
      key={day.date}
      date={day.date}
      label={day.label}  // "Mon 2"
      isToday={day.isToday}
      isSelected={selectedDay === day.date}
      hasPlans={day.mealCount > 0}
      isComplete={day.mealCount === 4}
      onClick={() => setSelectedDay(day.date)}
    />
  ))}
</DayStrip>
```

#### 2c. DayDetail
```jsx
<DayDetail date={selectedDay}>
  <DayHeader date={selectedDay} />
  {['lunch', 'afternoon_snack', 'dinner', 'evening_snack'].map(slot => (
    <MealCard 
      key={slot}
      slot={slot}
      meal={getMealForSlot(selectedDay, slot)}
      onPlusOne={handlePlusOne}
      onComplete={handleComplete}
      onExpand={handleExpand}
    />
  ))}
  <DayTotals meals={getMealsForDay(selectedDay)} target={userMacros} />
</DayDetail>
```

---

### 3. MealCard (new component)

**File:** `src/components/MealCard.jsx`

**Props:**
- `slot`: 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'
- `meal`: meal object or null if empty
- `onPlusOne`: callback to double servings
- `onComplete`: callback to mark done
- `onExpand`: callback to show recipe

**States:**
- Empty (no meal assigned)
- Collapsed (showing summary)
- Expanded (showing full recipe)
- Complete (marked as done)

```jsx
// Collapsed state
<div className="meal-card">
  <div className="meal-header">
    <span className="meal-slot-icon">🥗</span>
    <span className="meal-slot-name">LUNCH</span>
    <div className="meal-actions">
      <button onClick={onPlusOne}>+1</button>
      <button onClick={onComplete}>✓</button>
    </div>
  </div>
  <h3 className="meal-title">{meal.name}</h3>
  <div className="meal-macros">
    {meal.calories} cal • {meal.protein}g P • {meal.fat}g F • {meal.carbs}g C
  </div>
  <button onClick={onExpand}>View Recipe ▼</button>
</div>

// Expanded state adds:
<div className="meal-recipe">
  <h4>Ingredients ({meal.servings} serving{meal.servings > 1 ? 's' : ''})</h4>
  <ul>
    {meal.ingredients.map(ing => (
      <li key={ing.name}>{ing.quantity} {ing.unit} {ing.name}</li>
    ))}
  </ul>
  <h4>Instructions</h4>
  <ol>
    {meal.instructions.map((step, i) => (
      <li key={i}>{step}</li>
    ))}
  </ol>
</div>
```

---

### 4. GenerateButton (new component)

**File:** `src/components/GenerateButton.jsx`

**Props:**
- `servings`: current serving size (1, 2, or 4)
- `onServingsChange`: callback
- `onGenerate`: callback to trigger generation
- `isGenerating`: boolean

```jsx
<div className="generate-controls">
  <select value={servings} onChange={e => onServingsChange(Number(e.target.value))}>
    <option value={1}>1 serving</option>
    <option value={2}>2 servings</option>
    <option value={4}>4 servings</option>
  </select>
  <button 
    onClick={onGenerate} 
    disabled={isGenerating}
    className="generate-button"
  >
    {isGenerating ? 'Generating...' : 'Generate Week'}
  </button>
</div>
```

---

### 5. ShoppingListView (new component)

**File:** `src/components/ShoppingListView.jsx`

**Props:** none (gets week from context/route)

**State:**
- `items`: array of shopping items grouped by category
- `checkedItems`: set of item IDs that are "have it"

```jsx
<div className="shopping-list">
  <ShoppingHeader>
    <h2>Shopping List: This Week</h2>
    <div className="shopping-actions">
      <button onClick={regenerate}>Regenerate</button>
      <button onClick={print}>Print</button>
      <button onClick={sendToReminders}>Send to Reminders</button>
    </div>
  </ShoppingHeader>
  
  {categories.map(category => (
    <ShoppingSection key={category.name} title={category.name}>
      {category.items.map(item => (
        <ShoppingItem
          key={item.id}
          item={item}
          checked={checkedItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </ShoppingSection>
  ))}
</div>
```

---

### 6. DayTotals (new component)

**File:** `src/components/DayTotals.jsx`

**Props:**
- `meals`: array of meals for the day
- `target`: user's daily macro targets

```jsx
<div className="day-totals">
  <MacroBar label="Calories" current={totals.calories} target={target.calories} />
  <MacroBar label="Protein" current={totals.protein} target={target.protein} unit="g" />
  <MacroBar label="Fat" current={totals.fat} target={target.fat} unit="g" />
  <MacroBar label="Carbs" current={totals.carbs} target={target.carbs} unit="g" />
</div>
```

---

## Database Integration Points

### Meals Table Usage:
- `WeekView` fetches meals for date range on load
- `GenerateButton` calls API, inserts generated meals
- `MealCard` updates `completed` status
- `MealCard` "+1" updates `servings` field

### Week Management:
- Week determined by: `getWeekStart(date)` utility function
- This Week = week containing today
- Next Week = week starting Monday after this week
- Week rollover: automatic based on date (no manual archive needed)

---

## File Creation Order (for Day 4 Session 2)

1. **Update Sidebar.jsx** - new navigation structure
2. **Create WeekView.jsx** - main week display
3. **Create DayStrip.jsx** - day navigation tabs
4. **Create MealCard.jsx** - individual meal display
5. **Create GenerateButton.jsx** - generation controls
6. **Create DayTotals.jsx** - macro progress bars
7. **Create ShoppingListView.jsx** - shopping list page
8. **Update routing** - add routes for different views
9. **Connect to database** - fetch/save meals

---

## Styling Approach

Using Tailwind CSS (already configured). Key design tokens:

```css
/* Colors - warm, food-friendly palette */
--primary: emerald-600      /* Main actions */
--secondary: amber-500      /* Accents, warnings */
--surface: white            /* Card backgrounds */
--background: gray-50       /* Page background */
--text: gray-900            /* Primary text */
--text-muted: gray-500      /* Secondary text */

/* Spacing */
--card-padding: p-4         /* 16px */
--section-gap: space-y-4    /* 16px between cards */
--sidebar-width: w-60       /* 240px */
```

---

## Notes for Implementation

1. **Mobile considerations:** Sidebar should collapse to hamburger menu on mobile (Phase 2)
2. **Loading states:** Show skeleton cards while fetching/generating
3. **Error handling:** Toast notifications for API failures
4. **Offline:** Not in MVP, but structure should support later
5. **Recipe expansion:** Consider modal vs inline expansion
