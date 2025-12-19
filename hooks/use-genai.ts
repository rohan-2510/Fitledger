import { GoogleGenAI } from '@google/genai';
import React, { useCallback, useState } from 'react';

export const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = React.useRef<number | null>(null);

  const debouncedCallback = React.useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback;
};

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  name?: string;
  quantity?: string;
}

interface UseGenAIResult {
  generateNutrition: (foodQuery: string) => Promise<NutritionData | null>;
  isLoading: boolean;
  error: string | null;
}

const genAI = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
});

export const useGenAI = (): UseGenAIResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNutrition = useCallback(async (foodQuery: string): Promise<NutritionData | null> => {
    if (!foodQuery.trim()) {
      setError('Please provide a food query');
      return null;
    }

    // Check if API key is available
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      setError('AI service not configured. Please contact support.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get API key from environment variables or constants
    //   const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

      // Create prompt for nutrition data
      const prompt = `You are a nutrition expert. For the food item "${foodQuery}", provide the nutritional information in JSON format only. 
      Return a valid JSON object with the following structure:
      {
        "calories": <number>,
        "protein": <number in grams>,
        "carbs": <number in grams>,
        "fat": <number in grams>,
        "name": "<food name>",
        "quantity": "<quantity description>"
      }
      
      Make sure all values are numbers (not strings). Return ONLY the JSON object, no additional text or markdown formatting.`;

      // Generate content using Gemini
      const result = await genAI.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
      const response = result.text;

      if (!response) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON from response (handle cases where response might have markdown or extra text)
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract JSON object if there's extra text
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      const nutritionData: NutritionData = JSON.parse(jsonString);

      // Validate response structure
      if (
        typeof nutritionData.calories === 'number' &&
        typeof nutritionData.protein === 'number' &&
        typeof nutritionData.carbs === 'number' &&
        typeof nutritionData.fat === 'number'
      ) {
        return {
          calories: Math.round(nutritionData.calories),
          protein: Math.round(nutritionData.protein * 10) / 10,
          carbs: Math.round(nutritionData.carbs * 10) / 10,
          fat: Math.round(nutritionData.fat * 10) / 10,
          name: nutritionData.name || foodQuery,
          quantity: nutritionData.quantity,
        };
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate nutrition data';
      setError(errorMessage);
      console.error('Error generating nutrition with Gemini:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateNutrition,
    isLoading,
    error,
  };
};


// import { GoogleGenAI, Type } from '@google/genai'; // Updated import
// import React, { useCallback, useState } from 'react';

// export const useDebounce = (callback: Function, delay: number) => {
//   const timeoutRef = React.useRef<number | null>(null);

//   const debouncedCallback = React.useCallback(
//     (...args: any[]) => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current);
//       }
//       timeoutRef.current = setTimeout(() => {
//         callback(...args);
//       }, delay);
//     },
//     [callback, delay]
//   );

//   return debouncedCallback;
// };

// export interface UseGenAIResult {
//   generateNutrition: (foodQuery: string) => Promise<NutritionData | null>;
//   isLoading: boolean;
//   error: string | null;
// }

// const genAI = new GoogleGenAI({
//   apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
// });

// export interface NutritionData {
//   calories: number;
//   protein: number;
//   carbs: number;
//   fat: number;
//   name?: string;
//   quantity?: string;
// }

// // Define the Schema for Structured Output
// const nutritionSchema = {
//   type: Type.OBJECT,
//   properties: {
//     calories: { type: Type.NUMBER },
//     protein: { type: Type.NUMBER },
//     carbs: { type: Type.NUMBER },
//     fat: { type: Type.NUMBER },
//     name: { type: Type.STRING },
//     quantity: { type: Type.STRING },
//   },
//   required: ['calories', 'protein', 'carbs', 'fat'],
// };

// // Initialize with the new Gemini Client
// const client = new GoogleGenAI({
//   apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
// });

// export const useGenAI = (): UseGenAIResult => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const generateNutrition = useCallback(async (foodQuery: string): Promise<NutritionData | null> => {
//     if (!foodQuery.trim()) {
//       setError('Please provide a food query');
//       return null;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       const result = await client.models.generateContent({
//         model: 'gemini-2.0-flash',
//         contents: `Provide nutritional info for: ${foodQuery}`,
//         config: {
//           // This tells Gemini to return strict JSON
//           responseMimeType: 'application/json',
//           responseSchema: nutritionSchema,
//           systemInstruction: 'You are a nutrition expert. Always return precise numeric values.',
//         }
//       });

//       // No more manual parsing or regex! 
//       // The new SDK provides a 'parsed' property if a schema was used.
//       const nutritionData = (result as any).parsed as NutritionData;

//       return {
//         calories: Math.round(nutritionData.calories),
//         protein: Math.round(nutritionData.protein * 10) / 10,
//         carbs: Math.round(nutritionData.carbs * 10) / 10,
//         fat: Math.round(nutritionData.fat * 10) / 10,
//         name: nutritionData.name || foodQuery,
//         quantity: nutritionData.quantity,
//       };

//     } catch (err: any) {
//       setError(err.message || 'Failed to generate nutrition data');
//       console.error('Gemini API Error:', err);
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   return { generateNutrition, isLoading, error };
// };