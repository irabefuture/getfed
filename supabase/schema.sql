-- Adaptive Meal Builder - Database Schema
-- Phase 2.2: Household Model
-- Run this in Supabase SQL Editor
-- Date: 5 December 2025
--
-- MIGRATION: Added households and household_members tables
-- Existing users table now links to households

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
-- 2. HOUSEHOLDS TABLE (NEW)
-- Each household shares meal plans but members have individual nutrition
-- ============================================

CREATE TABLE IF NOT EXISTS households (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE households IS 'Household groups - couples/families share meal plans';

-- ============================================
-- 3. HOUSEHOLD MEMBERS TABLE (NEW)
-- Individual nutrition profiles within a household
-- ============================================

CREATE TABLE IF NOT EXISTS household_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,

    -- Physical attributes for nutrition calculation
    current_weight_kg float8 NOT NULL,
    target_weight_kg float8 NOT NULL,
    height_cm float8 NOT NULL,
    age int NOT NULL,
    sex text NOT NULL CHECK (sex IN ('male', 'female')),
    activity_level text NOT NULL DEFAULT 'sedentary' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),

    -- Galveston Diet phase (1=strictest, 3=maintenance)
    current_phase int NOT NULL DEFAULT 1 CHECK (current_phase IN (1, 2, 3)),

    -- Dietary restrictions (used for recipe filtering)
    dietary_restrictions jsonb NOT NULL DEFAULT '{"dairy_free": false, "gluten_free": false, "nut_free": false, "vegetarian": false, "vegan": false}',

    -- Calculated targets (stored for performance, recalculated on profile update)
    daily_calories int,
    daily_protein int,
    daily_fat int,
    daily_carbs int,

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE household_members IS 'Individual nutrition profiles within a household';
COMMENT ON COLUMN household_members.is_primary IS 'True for account owner, false for partner/dependents';
COMMENT ON COLUMN household_members.dietary_restrictions IS 'JSON with dairy_free, gluten_free, nut_free, vegetarian, vegan flags';

CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);

-- ============================================
-- 4. USERS TABLE (UPDATED)
-- Login accounts - now linked to households
-- Profile data moved to household_members for multi-person support
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,

    -- Link to household (nullable for migration, should be set after household creation)
    household_id uuid REFERENCES households(id) ON DELETE SET NULL,

    -- Legacy fields (kept for backward compatibility during migration)
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

COMMENT ON TABLE users IS 'Login accounts - linked to households for multi-person meal planning';
COMMENT ON COLUMN users.household_id IS 'Reference to household for shared meal planning';

CREATE INDEX IF NOT EXISTS idx_users_household ON users(household_id);

-- ============================================
-- 5. PREFERENCES TABLE
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
-- 6. PANTRY STAPLES TABLE
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
-- 7. PLANNED MEALS TABLE
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
-- 8. MEAL LOGS TABLE
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
-- 9. SAVED MEALS TABLE
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
-- 10. USEFUL INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_planned_meals_date ON planned_meals(date);
CREATE INDEX IF NOT EXISTS idx_planned_meals_status ON planned_meals(status);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON preferences(user_id);

-- ============================================
-- 11. MIGRATION: Create households for existing users
-- Run this AFTER creating the new tables
-- ============================================

-- Migration function to create household from existing user
-- Usage: SELECT migrate_user_to_household('user-uuid-here');

CREATE OR REPLACE FUNCTION migrate_user_to_household(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
    v_household_id uuid;
    v_user RECORD;
BEGIN
    -- Get user data
    SELECT * INTO v_user FROM users WHERE id = p_user_id;

    IF v_user IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    -- Create household
    INSERT INTO households (name)
    VALUES (v_user.name || ' Household')
    RETURNING id INTO v_household_id;

    -- Create household member from user profile
    INSERT INTO household_members (
        household_id, name, is_primary,
        current_weight_kg, target_weight_kg, height_cm,
        age, sex, activity_level, current_phase,
        daily_calories, daily_protein, daily_fat, daily_carbs
    )
    VALUES (
        v_household_id,
        v_user.name,
        true,
        v_user.current_weight_kg,
        v_user.target_weight_kg,
        v_user.height_cm,
        EXTRACT(YEAR FROM AGE(v_user.date_of_birth))::int,
        v_user.gender,
        v_user.activity_level,
        CASE v_user.current_phase
            WHEN 'phase1' THEN 1
            WHEN 'phase2' THEN 2
            WHEN 'phase3' THEN 3
            ELSE 1
        END,
        NULL, NULL, NULL, NULL  -- Targets calculated in app
    );

    -- Link user to household
    UPDATE users SET household_id = v_household_id WHERE id = p_user_id;

    RETURN v_household_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. SEED DATA: Harris Household
-- Ian and Rhonda test data
-- ============================================

-- Create Harris Household with both members
-- Uncomment and run after tables are created

/*
-- Create household
INSERT INTO households (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Harris Household');

-- Ian (primary)
INSERT INTO household_members (
    household_id, name, is_primary,
    current_weight_kg, target_weight_kg, height_cm,
    age, sex, activity_level, current_phase,
    daily_calories, daily_protein, daily_fat, daily_carbs
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Ian', true,
    94.8, 88.0, 180,
    57, 'male', 'sedentary', 1,
    2299, 115, 179, 57
);

-- Rhonda
INSERT INTO household_members (
    household_id, name, is_primary,
    current_weight_kg, target_weight_kg, height_cm,
    age, sex, activity_level, current_phase,
    daily_calories, daily_protein, daily_fat, daily_carbs
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Rhonda', false,
    84.5, 80.0, 165,
    55, 'female', 'sedentary', 1,
    1850, 93, 144, 46
);

-- Link existing Ian user to household (if exists)
-- UPDATE users SET household_id = '11111111-1111-1111-1111-111111111111' WHERE name = 'Ian';
*/

-- ============================================
-- DONE!
-- Schema now supports household meal planning
-- ============================================
