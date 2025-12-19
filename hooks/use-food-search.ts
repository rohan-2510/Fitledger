import { useCallback, useState } from 'react';

export interface FoodResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  source?: 'USDA' | 'Gemini';
}

const DATASET_NAME = "adarshzolekar/foods-nutrition-dataset";

export const useFoodSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFoods = useCallback(async (query: string): Promise<FoodResult[]> => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);

    try {
      // The Hugging Face Dataset Server search endpoint
      const API_URL = `https://datasets-server.huggingface.co/search?dataset=${DATASET_NAME}&config=default&split=train&query=${encodeURIComponent(query)}`;
      
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Map Hugging Face rows to your FoodItem format
      // Column names: Food Items, Energy kcal, Carbs, Protein(g), Fat(g)
      return data.rows.map((item: any, index: number) => ({
        id: `usda_${Date.now()}_${index}`,
        name: item.row['Food Items'] || item.row.food_item || '',
        calories: Number(item.row['Energy kcal'] || 0),
        protein: Number(item.row['Protein(g)'] || 0),
        carbs: Number(item.row['Carbs'] || 0),
        fat: Number(item.row['Fat(g)'] || 0),
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