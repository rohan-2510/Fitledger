import { useCallback, useState } from 'react';
import foodsData from '../assets/foods.json';

export interface FoodResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  cholesterol: number;
  calcium: number;
  freesugar: number;
  serving_size?: string;
  source?: 'USDA' | 'Gemini';
}

export const useFoodSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFoods = useCallback(async (query: string): Promise<FoodResult[]> => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);

    try {
      const lowerQuery = query.toLowerCase().trim();

      // Search locally from the embedded JSON data
      const results = foodsData.filter((item: any) =>
        item.name.toLowerCase().includes(lowerQuery)
      );

      return results.map((item: any) => ({
        id: `local_${item.id}`,
        name: item.name,
        calories: item.energy_kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fibre: item.fibre,
        cholesterol: item.cholesterol,
        calcium: item.calcium,
        freesugar: item.freesugar,
        source: 'USDA' as const,
      }));
    } catch (err: any) {
      setError(err.message || 'Search failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { searchFoods, isLoading, error };
};