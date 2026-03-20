// BMI Category classification
const getBmiCategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
};

// Recommended exercise minutes based on goal and BMI
const getRecommendedExerciseMin = (goal: string, bmi: number): number => {
    if (goal === 'cut' || bmi >= 30) return 60;
    if (goal === 'cut' || bmi >= 25) return 45;
    if (goal === 'bulk') return 30;
    return 30; // maintain
};

export const calcMacros = (user: any) => {
    // Validate required fields
    if (!user.weight_kg || !user.height_cm || !user.age) {
        // Return default values if profile incomplete
        return {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 65,
            bmr: 0,
            tdee: 2000,
            bmi: 0,
            bmiCategory: 'Unknown',
            recommendedExerciseMin: 30,
        };
    }

    const activity_map: { [key: string]: number } = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extreme: 1.9
    };
    const factor = activity_map[user.activity_level] || 1.2;

    // Calculate BMI
    const heightM = user.height_cm / 100;
    const bmi = user.weight_kg / (heightM * heightM);
    const bmiCategory = getBmiCategory(bmi);

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (user.gender === 'M') { // Male
        bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5;
    } else { // Female or Other (default to female formula)
        bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161;
    }

    const tdee = bmr * factor;

    // Recommended exercise minutes
    const recommendedExerciseMin = getRecommendedExerciseMin(user.goal || 'maintain', bmi);

    // Adjust for goal
    let target: number;
    let protein: number;
    let fatPercent: number;
    if (user.goal === 'cut') {
        target = tdee - 300;
        protein = 2.0 * user.weight_kg;
        fatPercent = 0.26;
    } else if (user.goal === 'bulk') {
        target = tdee + 300;
        protein = 1.8 * user.weight_kg;
        fatPercent = 0.22;
    } else { // maintain
        target = tdee;
        protein = 1.8 * user.weight_kg;
        fatPercent = 0.24;
    }

    const fat_cals = target * fatPercent;
    const fat_g = fat_cals / 9;
    const protein_cals = protein * 4;
    const carbs_cals = target - (protein_cals + fat_cals);
    const carbs_g = Math.max(0, carbs_cals / 4);

    return {
        calories: Math.round(target),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs_g * 10) / 10,
        fat: Math.round(fat_g * 10) / 10,
        bmr: Math.round(bmr * 10) / 10,
        tdee: Math.round(tdee * 10) / 10,
        bmi: Math.round(bmi * 10) / 10,
        bmiCategory,
        recommendedExerciseMin,
    };
}