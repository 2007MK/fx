import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlusCircle } from "lucide-react";

interface AddCurrencyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddCurrencyModal({ open, onClose }: AddCurrencyModalProps) {
  const { toast } = useToast();
  
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCode("");
    setName("");
    setCountry("");
    setRate("");
  };

  const handleClose = () => {
    onClose();
    // Wait for the animation to complete before resetting the form
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async () => {
    if (!code || !name || !country || !rate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const rateValue = parseFloat(rate);
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
      const response = await apiRequest("POST", "/api/currencies", {
        code: code.toUpperCase(),
        name,
        country,
        currentRate: rateValue,
      });

      if (response.ok) {
        toast({
          title: "Currency Added",
          description: `${name} (${code.toUpperCase()}) has been added to your inventory`,
        });
        
        // Refresh currencies
        await queryClient.invalidateQueries({ queryKey: ['/api/currencies'] });
        
        handleClose();
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Failed to Add Currency",
        description: errMsg.includes('already exists') 
          ? "Currency code already exists" 
          : errMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center">
            <div className="mr-4 h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <PlusCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <DialogTitle>Add New Currency</DialogTitle>
              <DialogDescription>
                Add a new currency to your inventory tracker.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="currency-code">Currency Code</Label>
              <Input
                id="currency-code"
                placeholder="e.g. AUD"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-name">Currency Name</Label>
              <Input
                id="currency-name"
                placeholder="e.g. Australian Dollar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-country">Country/Region</Label>
              <Input
                id="currency-country"
                placeholder="e.g. Australia"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-rate">Initial Exchange Rate</Label>
              <Input
                id="initial-rate"
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Currency"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
