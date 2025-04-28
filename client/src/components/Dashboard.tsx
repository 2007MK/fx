import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { TrendingUp, Receipt, Package2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { isLoading: isLoadingCurrencies, currencies } = useCurrencies();
  const { isLoading: isLoadingTransactions, transactions } = useTransactions();

  // Get today's stats
  const { data: todayStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats/today'],
  });

  // Calculate total inventory value
  const totalInventoryValue = currencies.reduce((total, currency) => {
    if (currency.inventory) {
      return total + Number(currency.inventory.amount) * Number(currency.currentRate);
    }
    return total;
  }, 0);

  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format last updated time
  const lastUpdated = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="px-4 py-2 sm:px-0">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Profit Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                  Today's Profit
                </div>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <div className="text-lg font-medium text-green-700 dark:text-green-500 font-mono">
                    {formatCurrency(todayStats?.profit || 0, 'USD')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3">
            <div className="text-sm">
              <span className="font-medium text-primary-600 hover:text-primary-500 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{currentDate}</span>
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Transactions Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3">
                <Receipt className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                  Total Transactions
                </div>
                {isLoadingTransactions ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <div className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    {transactions.length}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3">
            <div className="text-sm">
              <span className="font-medium text-primary-600 hover:text-primary-500 flex items-center">
                View all transactions 
                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Inventory Value Card */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-md p-3">
                <Package2 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                  Total Inventory Value
                </div>
                {isLoadingCurrencies ? (
                  <Skeleton className="h-7 w-32 mt-1" />
                ) : (
                  <div className="text-lg font-medium text-slate-900 dark:text-slate-100 font-mono">
                    {formatCurrency(totalInventoryValue, 'USD')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3">
            <div className="text-sm flex justify-between w-full">
              <div className="text-slate-600 dark:text-slate-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last updated: {lastUpdated}
              </div>
              <button className="text-primary-600 dark:text-primary-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Report
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
