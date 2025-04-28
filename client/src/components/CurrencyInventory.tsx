import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencies } from "@/hooks/useCurrencies";
import { formatCurrency, formatPercentage } from "@/utils/currency";
import { PlusCircle, MinusCircle } from "lucide-react";
import { type Currency } from "@shared/schema";

interface CurrencyInventoryProps {
  onQuickBuy: (currency: Currency) => void;
  onQuickSell: (currency: Currency) => void;
}

export default function CurrencyInventory({ onQuickBuy, onQuickSell }: CurrencyInventoryProps) {
  const { isLoading, currencies, error } = useCurrencies();

  // Helper function to calculate profit/loss percentage
  const calculateProfitLossPercentage = (currency: Currency) => {
    if (!currency.inventory) return 0;
    
    const currentRate = Number(currency.currentRate);
    const avgBuyPrice = Number(currency.inventory.avgBuyPrice);
    
    if (avgBuyPrice === 0) return 0;
    
    return ((currentRate - avgBuyPrice) / avgBuyPrice) * 100;
  };

  if (error) {
    return (
      <div className="px-4 mt-8 sm:px-0">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-400">
            Error loading currencies: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-8 sm:px-0">
      <h2 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100 mb-4">
        Currency Inventory
      </h2>
      
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-slate-200 dark:border-slate-700 sm:rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Currency
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Available Stock
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Avg. Buy Price
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Current Rate
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Profit/Loss
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoading ? (
                    Array(4).fill(0).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="ml-4">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-32 mt-1" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                          <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full ml-2" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    currencies.map((currency) => {
                      const profitLossPercentage = calculateProfitLossPercentage(currency);
                      const isProfit = profitLossPercentage >= 0;
                      
                      return (
                        <TableRow key={currency.id}>
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                {currency.code}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {currency.name}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {currency.country}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium font-mono">
                              {currency.inventory ? formatCurrency(currency.inventory.amount, currency.code, false) : '0.00'}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium font-mono">
                              {currency.inventory ? Number(currency.inventory.avgBuyPrice).toFixed(4) : '0.0000'}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium font-mono">
                              {Number(currency.currentRate).toFixed(4)}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                            <Badge variant={isProfit ? "success" : "destructive"} className="ml-auto">
                              {isProfit ? '+' : ''}{formatPercentage(profitLossPercentage)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-2"
                              onClick={() => onQuickBuy(currency)}
                            >
                              <PlusCircle className="h-5 w-5" />
                              <span className="sr-only">Buy {currency.code}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              onClick={() => onQuickSell(currency)}
                              disabled={!currency.inventory || Number(currency.inventory.amount) <= 0}
                            >
                              <MinusCircle className="h-5 w-5" />
                              <span className="sr-only">Sell {currency.code}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
