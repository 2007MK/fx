import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ResetConfirmModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ResetConfirmModal({ open, onClose }: ResetConfirmModalProps) {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const response = await apiRequest("POST", "/api/reset", {});
      
      if (response.ok) {
        toast({
          title: "Inventory Reset",
          description: "Your inventory has been reset successfully",
        });
        
        // Refresh all data
        await queryClient.invalidateQueries({ queryKey: ['/api/currencies'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/stats/today'] });
        
        onClose();
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Inventory</AlertDialogTitle>
          <AlertDialogDescription>
            This action will reset all your inventory to zero and clear all transaction history.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleReset}
            disabled={isResetting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isResetting ? "Resetting..." : "Reset Everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
