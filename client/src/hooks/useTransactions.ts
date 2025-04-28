import { useQuery } from "@tanstack/react-query";
import { type Transaction } from "@shared/schema";

export function useTransactions() {
  const { 
    data: transactions = [],
    isLoading,
    error,
    isError
  } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    staleTime: 60000, // 1 minute
  });

  return {
    transactions,
    isLoading,
    error: isError ? error : null
  };
}
