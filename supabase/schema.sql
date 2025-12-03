-- Adaptive Meal Builder - Database Schema
-- Phase 2.1: Create all tables
-- Run this in Supabase SQL Editor
-- Date: 3 December 2025

-- ============================================
-- 1. EXPAND INGREDIENTS TABLE
-- Add shopping unit columns for shopping list conversion
-- ============================================

ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS shopping_unit text DEFAULT 'g',
ADD COLUMN IF NOT EXISTS shopping_unit_grams float8 DEFAULT 100;

COMMENT ON COLUMN ingredients.shopping_unit IS 'Unit for shopping list: g, piece, head, bunch, fillet, etc.';
COMMENT ON COLUMN ingredients.shopping_unit_grams IS 'Grams per shopping unit (e.g., 150 for a salmon fillet)';

-- ============================================
-- 2. USERS TABLE
-- Profile data - calorie/macro targets are CALCULATED not stored
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    gender text NOT NULL CHECK (gender IN ('male', 'female')),
    date_of_birth date NOT NULL,
    height_cm float8 NOT NULL,
    current_weight_kg float8 NOT NULL,
    target_weight_kg float8 NOT NULL,
    activity_level text NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    goal text NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain')),
    current_phase text NOT NULL DEFAULT 'phase1' CHECK (current_phase IN ('phase1', 'phase2', 'phase3')),
    eating_window_start time NOT NULL DEFAULT '12:00',
    eating_window_end time NOT NULL DEFAULT '20:00',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE users IS 'User profiles - macros calculated from these values, not stored';

-- ============================================
-- 3. PREFERENCES TABLE
-- User ingredient preferences (love/like/dislike/never)
-- ============================================

CREATE TABLE IF NOT EXISTS preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id text NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    rating text NOT NULL CHECK (rating IN ('love', 'like', 'dislike', 'never')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, ingredient_id)
);

COMMENT ON TABLE preferences IS 'User preferences for ingredients - used by AI to personalise suggestions';

-- ============================================
-- 4. PANTRY STAPLES TABLE
-- Items to hide from shopping list (always in stock)
-- ============================================

CREATE TABLE IF NOT EXISTS pantry_staples (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id text NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(ingredient_id)
);

COMMENT ON TABLE pantry_staples IS 'Ingredients always in stock - hidden from shopping list';

-- ============================================
-- 5. PLANNED MEALS TABLE
-- The meal plan - what's cooking on which days
-- ============================================

CREATE TABLE IF NOT EXISTS planned_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    name text NOT NULL,
    cooking_serves int NOT NULL DEFAULT 2,
    prep_time_mins int,
    cook_time_mins int,
    instructions text,
    ingredients_json jsonb NOT NULL DEFAULT '[]',
    protein_g float8 NOT NULL,
    fat_g float8 NOT NULL,
    carbs_g float8 NOT NULL,
    calories int NOT NULL,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'cooked', 'skipped', 'rescheduled')),
    source text DEFAULT 'ai_generated' CHECK (source IN ('ai_generated', 'recipe_book', 'user_created')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(date, meal_type)
);

COMMENT ON TABLE planned_meals IS 'Meal plan - macros are per serve';
COMMENT ON COLUMN planned_meals.ingredients_json IS 'Array of {ingredient_id, quantity_g, name}';
COMMENT ON COLUMN planned_meals.cooking_serves IS 'How many portions cooked (usually 2)';

-- ============================================
-- 6. MEAL LOGS TABLE
-- Individual portion logging per person
-- ============================================

CREATE TABLE IF NOT EXISTS meal_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    planned_meal_id uuid REFERENCES planned_meals(id) ON DELETE SET NULL,
    date date NOT NULL,
    meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    name text NOT NULL,
    servings float8 NOT NULL DEFAULT 1,
    protein_g float8 NOT NULL,
    fat_g float8 NOT NULL,
    carbs_g float8 NOT NULL,
    calories int NOT NULL,
    rating text CHECK (rating IN ('thumbs_up', 'thumbs_down')),
    rating_reason text,
    off_plan boolean NOT NULL DEFAULT false,
    off_plan_estimate text CHECK (off_plan_estimate IN ('high_carb', 'high_fat', 'balanced')),
    created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE meal_logs IS 'What each person actually ate - servings can be 0.5, 1, 1.5, etc.';
COMMENT ON COLUMN meal_logs.servings IS 'Portion multiplier - 1 = standard serve, 1.5 = larger portion';
COMMENT ON COLUMN meal_logs.off_plan IS 'True if not from planned_meals (ate something else)';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_logs_planned_meal ON meal_logs(planned_meal_id);

-- ============================================
-- 7. SAVED MEALS TABLE
-- Templates for quick-add (e.g., "Ian's smoothie")
-- ============================================

CREATE TABLE IF NOT EXISTS saved_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    ingredients_json jsonb NOT NULL DEFAULT '[]',
    protein_g float8 NOT NULL,
    fat_g float8 NOT NULL,
    carbs_g float8 NOT NULL,
    calories int NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE saved_meals IS 'Saved meal templates for quick logging';
COMMENT ON COLUMN saved_meals.is_default IS 'Show at top of quick-add list';

-- ============================================
-- 8. USEFUL INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_planned_meals_date ON planned_meals(date);
CREATE INDEX IF NOT EXISTS idx_planned_meals_status ON planned_meals(status);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON preferences(user_id);

-- ============================================
-- DONE!
-- Next: Insert Ian + Rhonda user profiles
-- ============================================
