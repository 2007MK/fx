import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useCurrencies } from "@/hooks/useCurrencies";
import { formatCurrency } from "@/utils/currency";

export default function RecentTransactions() {
  const { isLoading, transactions, error } = useTransactions();
  const { currencies } = useCurrencies();

  // Helper function to get currency code by ID
  const getCurrencyCode = (currencyId: number) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.code : 'Unknown';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="px-4 mt-8 sm:px-0">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-400">
            Error loading transactions: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-8 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
            Recent Transactions
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A list of all recent transactions including currency, amount, rate, and type.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 md:rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800">
                  <TableRow>
                    <TableHead className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 sm:pl-6">
                      Date
                    </TableHead>
                    <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Type
                    </TableHead>
                    <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Currency
                    </TableHead>
                    <TableHead className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Amount
                    </TableHead>
                    <TableHead className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Rate
                    </TableHead>
                    <TableHead className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
                  {isLoading ? (
                    Array(3).fill(0).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm">
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    transactions.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-900 dark:text-slate-100 sm:pl-6">
                          {formatDate(transaction.timestamp.toString())}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm">
                          <Badge 
                            variant={transaction.type === "BUY" ? "outline" : "success"}
                            className={
                              transaction.type === "BUY" 
                                ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" 
                                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-slate-100">
                          {getCurrencyCode(transaction.currencyId)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-right text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(transaction.amount, getCurrencyCode(transaction.currencyId), false)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-right text-slate-900 dark:text-slate-100 font-mono">
                          {Number(transaction.rate).toFixed(4)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-right text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(transaction.total, 'USD')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  
                  {!isLoading && transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        No transactions found. Start by buying some currency.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
