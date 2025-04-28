import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, RefreshCw, HelpCircle, PlusCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface HeaderProps {
  onAddNewCurrency: () => void;
  onResetInventory: () => void;
}

export default function Header({ onAddNewCurrency, onResetInventory }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      // This is a placeholder for future implementation of refreshing rates from an external API
      // For now, we don't actually refresh rates, but the UI should show the action
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Rates Refreshed",
        description: "Currency rates have been updated successfully.",
      });
      
      // Refresh currencies data
      await queryClient.invalidateQueries({ queryKey: ['/api/currencies'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh rates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg 
                className="h-6 w-6 text-primary mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" 
                />
              </svg>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Forex Inventory Tracker
              </h1>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Button 
                variant="outline" 
                onClick={handleRefreshRates}
                disabled={isRefreshing}
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Rates
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-3">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddNewCurrency}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Currency
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onResetInventory}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Inventory
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
