import { useState } from "react";
import { useLocation } from "wouter";
import { useVerifyPin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";

export default function PinPage() {
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const verifyPin = useVerifyPin({
    mutation: {
      onSuccess: (data) => {
        if (data.success) {
          setLocation("/");
        } else {
          setPin("");
          toast({
            title: "Incorrect PIN",
            description: "Please try again.",
            variant: "destructive"
          });
        }
      },
      onError: () => {
        setPin("");
        toast({
          title: "Error",
          description: "Could not verify PIN. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const handleKeyPress = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin.mutate({ data: { pin: newPin } });
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-12"
      >
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Moon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome Family</h1>
        <p className="text-muted-foreground text-center">Enter your family PIN to access the tracker</p>
      </motion.div>

      <div className="flex gap-4 mb-12" dir="ltr">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="w-4 h-4 rounded-full transition-colors duration-300"
            style={{ 
              backgroundColor: i < pin.length ? 'var(--color-primary)' : 'var(--color-input)'
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]" dir="ltr">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            disabled={verifyPin.isPending}
            className="w-full aspect-square rounded-full bg-card border border-border text-2xl font-medium active:bg-accent transition-colors flex items-center justify-center active:scale-95"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleKeyPress(0)}
          disabled={verifyPin.isPending}
          className="w-full aspect-square rounded-full bg-card border border-border text-2xl font-medium active:bg-accent transition-colors flex items-center justify-center active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={verifyPin.isPending}
          className="w-full aspect-square rounded-full text-lg font-medium active:bg-accent/50 transition-colors flex items-center justify-center text-muted-foreground"
        >
          Delete
        </button>
      </div>
    </div>
  );
}