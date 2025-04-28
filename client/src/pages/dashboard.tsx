import { useState } from "react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import CurrencyInventory from "@/components/CurrencyInventory";
import RecentTransactions from "@/components/RecentTransactions";
import BuyModal from "@/components/modals/BuyModal";
import SellModal from "@/components/modals/SellModal";
import AddCurrencyModal from "@/components/modals/AddCurrencyModal";
import ResetConfirmModal from "@/components/modals/ResetConfirmModal";
import { Button } from "@/components/ui/button";
import { PlusCircle, DollarSign } from "lucide-react";
import { type Currency } from "@shared/schema";

export default function DashboardPage() {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [addCurrencyModalOpen, setAddCurrencyModalOpen] = useState(false);
  const [resetConfirmModalOpen, setResetConfirmModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  const handleOpenBuyModal = (currency?: Currency) => {
    if (currency) {
      setSelectedCurrency(currency);
    } else {
      setSelectedCurrency(null);
    }
    setBuyModalOpen(true);
  };

  const handleOpenSellModal = (currency?: Currency) => {
    if (currency) {
      setSelectedCurrency(currency);
    } else {
      setSelectedCurrency(null);
    }
    setSellModalOpen(true);
  };

  const handleAddNewCurrency = () => {
    setAddCurrencyModalOpen(true);
  };

  const handleResetInventory = () => {
    setResetConfirmModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      <Header 
        onAddNewCurrency={handleAddNewCurrency} 
        onResetInventory={handleResetInventory} 
      />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Dashboard />

          <div className="px-4 mt-5 sm:px-0">
            <div className="flex flex-wrap gap-3">
              <Button 
                size="lg" 
                onClick={() => handleOpenBuyModal()}
                className="bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                BUY
              </Button>
              <Button 
                size="lg" 
                onClick={() => handleOpenSellModal()}
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                SELL
              </Button>
            </div>
          </div>

          <CurrencyInventory 
            onQuickBuy={handleOpenBuyModal}
            onQuickSell={handleOpenSellModal}
          />

          <RecentTransactions />
        </div>
      </main>

      <footer className="bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <span className="text-slate-400 text-sm">Version 1.0.0</span>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Forex Inventory Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <BuyModal 
        open={buyModalOpen} 
        onClose={() => setBuyModalOpen(false)} 
        initialCurrency={selectedCurrency}
      />
      
      <SellModal 
        open={sellModalOpen} 
        onClose={() => setSellModalOpen(false)} 
        initialCurrency={selectedCurrency}
      />
      
      <AddCurrencyModal 
        open={addCurrencyModalOpen} 
        onClose={() => setAddCurrencyModalOpen(false)} 
      />
      
      <ResetConfirmModal 
        open={resetConfirmModalOpen} 
        onClose={() => setResetConfirmModalOpen(false)} 
      />
    </div>
  );
}
