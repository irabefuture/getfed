// Calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Activity level multipliers for TDEE
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
}

// Galveston Diet phase ratios
const phaseRatios = {
  phase1: { fat: 0.70, protein: 0.20, carbs: 0.10 },
  phase2: { fat: 0.50, protein: 0.20, carbs: 0.30 },
  phase3: { fat: 0.40, protein: 0.20, carbs: 0.40 }
}

// Main calculation function
export function calculateNutritionTargets(user) {
  const age = calculateAge(user.date_of_birth)
  
  // BMR using Mifflin-St Jeor formula
  let bmr
  if (user.gender === 'male') {
    bmr = (10 * user.current_weight_kg) + (6.25 * user.height_cm) - (5 * age) + 5
  } else {
    bmr = (10 * user.current_weight_kg) + (6.25 * user.height_cm) - (5 * age) - 161
  }
  
  // TDEE = BMR × activity multiplier
  const tdee = bmr * activityMultipliers[user.activity_level]
  
  // Adjust for goal
  let calories
  if (user.goal === 'lose') {
    calories = tdee - 500
  } else if (user.goal === 'gain') {
    calories = tdee + 300
  } else {
    calories = tdee
  }
  
  // Calculate macros from phase ratios
  const ratios = phaseRatios[user.current_phase]
  const protein = Math.round((calories * ratios.protein) / 4)
  const fat = Math.round((calories * ratios.fat) / 9)
  const carbs = Math.round((calories * ratios.carbs) / 4)
  
  return {
    dailyCalories: Math.round(calories),
    protein,
    fat,
    carbs
  }
}
