import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/utils/currency";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { type Currency } from "@shared/schema";

interface SellModalProps {
  open: boolean;
  onClose: () => void;
  initialCurrency: Currency | null;
}

export default function SellModal({ open, onClose, initialCurrency }: SellModalProps) {
  const { currencies, isLoading } = useCurrencies();
  const { toast } = useToast();
  
  const [currencyId, setCurrencyId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [availableAmount, setAvailableAmount] = useState<number>(0);
  const [avgBuyPrice, setAvgBuyPrice] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected currency info
  useEffect(() => {
    if (currencyId) {
      const selectedCurrency = currencies.find(c => c.id.toString() === currencyId);
      if (selectedCurrency) {
        setRate(selectedCurrency.currentRate.toString());
        setAvailableAmount(selectedCurrency.inventory ? Number(selectedCurrency.inventory.amount) : 0);
        setAvgBuyPrice(selectedCurrency.inventory ? Number(selectedCurrency.inventory.avgBuyPrice) : 0);
      }
    }
  }, [currencyId, currencies]);

  // Set the initial currency if provided
  useEffect(() => {
    if (initialCurrency) {
      setCurrencyId(initialCurrency.id.toString());
    }
  }, [initialCurrency, open]);

  // Update the total and profit when amount or rate changes
  useEffect(() => {
    const amountValue = parseFloat(amount) || 0;
    const rateValue = parseFloat(rate) || 0;
    const totalValue = amountValue * rateValue;
    setTotal(totalValue.toFixed(2));
    
    // Calculate profit
    const profitValue = amountValue * (rateValue - avgBuyPrice);
    setProfit(profitValue);
  }, [amount, rate, avgBuyPrice]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setAmount("");
        setRate("");
        setTotal("");
        setNotes("");
        setProfit(0);
        if (!initialCurrency) {
          setCurrencyId("");
        }
      }, 300);
    }
  }, [open, initialCurrency]);

  const handleSubmit = async () => {
    if (!currencyId || !amount || !rate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    const rateValue = parseFloat(rate);
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be a positive number",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: "Invalid Rate",
        description: "Rate must be a positive number",
        variant: "destructive",
      });
      return;
    }

    if (amountValue > availableAmount) {
      toast({
        title: "Insufficient Stock",
        description: `You only have ${formatCurrency(availableAmount, "Unknown", false)} units available`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/transactions/sell", {
        currencyId: parseInt(currencyId),
        amount: amountValue,
        rate: rateValue,
        total: parseFloat(total),
        notes: notes.trim() || undefined
      });

      if (response.ok) {
        toast({
          title: "Sale Completed",
          description: `Successfully sold ${amount} units of currency`,
        });
        
        // Refresh data
        await queryClient.invalidateQueries({ queryKey: ['/api/currencies'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/stats/today'] });
        
        onClose();
      }
    } catch (error) {
      toast({
        title: "Sale Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const profitLossDisplay = () => {
    if (profit === 0) return null;
    
    const Icon = profit > 0 ? TrendingUp : TrendingDown;
    const textColor = profit > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    
    return (
      <div className={`mt-1 flex items-center text-xs ${textColor}`}>
        <Icon className="h-3 w-3 mr-1" />
        {profit > 0 ? 'Profit:' : 'Loss:'} {formatCurrency(Math.abs(profit), 'USD')}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center">
            <div className="mr-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle>Sell Currency</DialogTitle>
              <DialogDescription>
                Enter the details for your sale transaction.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sell-currency">Currency</Label>
              <Select
                value={currencyId}
                onValueChange={setCurrencyId}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger id="sell-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies
                    .filter(c => c.inventory && Number(c.inventory.amount) > 0)
                    .map((currency) => (
                      <SelectItem key={currency.id} value={currency.id.toString()}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sell-amount">Amount</Label>
              <Input
                id="sell-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
              {availableAmount > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Available: {formatCurrency(availableAmount, "Unknown", false)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sell-rate">Rate</Label>
              <Input
                id="sell-rate"
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={isSubmitting}
              />
              {avgBuyPrice > 0 && (
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>Avg. Buy: {avgBuyPrice.toFixed(4)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sell-total">Total (USD)</Label>
              <Input
                id="sell-total"
                type="text"
                value={total}
                readOnly
                className="bg-slate-50 dark:bg-slate-800"
              />
              {profitLossDisplay()}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sell-notes">Notes (optional)</Label>
            <Textarea
              id="sell-notes"
              placeholder="Add any notes about this transaction"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || availableAmount <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Processing..." : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
