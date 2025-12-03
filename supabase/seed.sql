-- Adaptive Meal Builder - Seed Data
-- Phase 2.1: Insert user profiles + pantry staples
-- Run this AFTER schema.sql
-- Date: 3 December 2025

-- ============================================
-- INSERT USER PROFILES
-- ============================================

INSERT INTO users (name, gender, date_of_birth, height_cm, current_weight_kg, target_weight_kg, activity_level, goal, current_phase, eating_window_start, eating_window_end)
VALUES 
    ('Ian', 'male', '1968-09-20', 182, 94.8, 88, 'moderate', 'lose', 'phase1', '12:00', '20:00'),
    ('Rhonda', 'female', '1974-05-30', 175, 84.5, 80, 'moderate', 'lose', 'phase1', '12:00', '20:00');

-- ============================================
-- INSERT COMMON PANTRY STAPLES
-- Items to hide from shopping list (always in stock)
-- Using actual ingredient IDs from ingredients table
-- ============================================

INSERT INTO pantry_staples (ingredient_id)
VALUES 
    -- Oils (always have these)
    ('oil_001'),      -- Olive oil, extra virgin
    ('oil_002'),      -- Avocado oil
    ('oil_003'),      -- Coconut oil
    
    -- Alliums (usually have these)
    ('allium_001'),   -- Garlic
    ('allium_002'),   -- Onion, brown
    
    -- Spices and herbs
    ('spice_001'),    -- Turmeric
    ('spice_002'),    -- Ginger, fresh
    ('spice_003'),    -- Cinnamon
    ('spice_004'),    -- Black pepper
    
    -- Condiments commonly stocked
    ('condiment_002'), -- Balsamic vinegar
    ('condiment_003'), -- Apple cider vinegar
    ('condiment_006'), -- Tamari
    
    -- Citrus
    ('fruit_010'),    -- Lemon
    
    -- Broths
    ('other_003')     -- Bone broth, chicken
ON CONFLICT (ingredient_id) DO NOTHING;

-- Note: Items like salt, paprika, cumin, oregano, rosemary, basil, thyme
-- are NOT in the ingredients database (negligible macros) so can't be 
-- added to pantry_staples. The shopping list will only show items 
-- that ARE in ingredients table anyway.

-- ============================================
-- VERIFY CREATION
-- ============================================

-- Check users created
SELECT id, name, current_phase, goal, current_weight_kg, target_weight_kg FROM users;

-- Check pantry staples with ingredient names
SELECT ps.id, i.name as ingredient_name 
FROM pantry_staples ps
JOIN ingredients i ON ps.ingredient_id = i.id
ORDER BY i.name;
