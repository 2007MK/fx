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
import { ShoppingCart } from "lucide-react";
import { type Currency } from "@shared/schema";

interface BuyModalProps {
  open: boolean;
  onClose: () => void;
  initialCurrency: Currency | null;
}

export default function BuyModal({ open, onClose, initialCurrency }: BuyModalProps) {
  const { currencies, isLoading } = useCurrencies();
  const { toast } = useToast();
  
  const [currencyId, setCurrencyId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update the total when amount or rate changes
  useEffect(() => {
    const amountValue = parseFloat(amount) || 0;
    const rateValue = parseFloat(rate) || 0;
    setTotal((amountValue * rateValue).toFixed(2));
  }, [amount, rate]);

  // Set the initial currency if provided
  useEffect(() => {
    if (initialCurrency) {
      setCurrencyId(initialCurrency.id.toString());
      setRate(initialCurrency.currentRate.toString());
    }
  }, [initialCurrency, open]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setAmount("");
        setRate("");
        setTotal("");
        setNotes("");
        if (!initialCurrency) {
          setCurrencyId("");
        }
      }, 300);
    }
  }, [open, initialCurrency]);

  const handleCurrencyChange = (value: string) => {
    setCurrencyId(value);
    const selectedCurrency = currencies.find(c => c.id.toString() === value);
    if (selectedCurrency) {
      setRate(selectedCurrency.currentRate.toString());
    }
  };

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

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/transactions/buy", {
        currencyId: parseInt(currencyId),
        amount: amountValue,
        rate: rateValue,
        total: parseFloat(total),
        notes: notes.trim() || undefined
      });

      if (response.ok) {
        toast({
          title: "Purchase Completed",
          description: `Successfully purchased ${amount} units of currency`,
        });
        
        // Refresh data
        await queryClient.invalidateQueries({ queryKey: ['/api/currencies'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/stats/today'] });
        
        onClose();
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center">
            <div className="mr-4 h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <DialogTitle>Buy Currency</DialogTitle>
              <DialogDescription>
                Enter the details for your purchase transaction.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={currencyId}
                onValueChange={handleCurrencyChange}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total (INR)</Label>
              <Input
                id="total"
                type="text"
                value={total}
                readOnly
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
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
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary">
            {isSubmitting ? "Processing..." : "Complete Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
