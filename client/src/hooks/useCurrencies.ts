import { useQuery } from "@tanstack/react-query";
import { type CurrencyWithInventory } from "@shared/schema";

export function useCurrencies() {
  const { 
    data: currencies = [],
    isLoading,
    error,
    isError
  } = useQuery<CurrencyWithInventory[]>({
    queryKey: ['/api/currencies'],
    staleTime: 60000, // 1 minute
  });

  return {
    currencies,
    isLoading,
    error: isError ? error : null
  };
}
