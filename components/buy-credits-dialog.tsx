"use client";

import * as React from "react";
import { useAddCredits } from "@/hooks/useSubscriptions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon, CreditCardIcon } from "@hugeicons/core-free-icons";

const CREDIT_PACKS = [
  { amount: 50, price: 9, label: "Starter" },
  { amount: 200, price: 29, label: "Pro", popular: true },
  { amount: 1000, price: 99, label: "Enterprise" },
];

export function BuyCreditsDialog() {
  const [open, setOpen] = React.useState(false);
  const { mutate: buyCredits, isPending } = useAddCredits();

  const handleBuy = (amount: number) => {
    buyCredits({ amount }, {
      onSuccess: (data) => {
        toast.success(data.message);
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-shiny gap-2">
          <HugeiconsIcon icon={ZapIcon} size={18} strokeWidth={2} />
          Acheter des crédits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <HugeiconsIcon icon={ZapIcon} size={24} className="text-primary" />
            Recharger vos crédits
          </DialogTitle>
          <DialogDescription>
            Choisissez un pack de crédits pour continuer à gérer vos expéditions sans interruption.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.amount}
              onClick={() => handleBuy(pack.amount)}
              disabled={isPending}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                pack.popular 
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Populaire
                </span>
              )}
              <div className="text-2xl font-bold text-primary">+{pack.amount}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-tight mb-2">Crédits</div>
              <div className="text-lg font-semibold">{pack.price}€</div>
              <Button 
                variant={pack.popular ? "default" : "outline"} 
                size="sm" 
                className="mt-3 w-full text-[10px]"
                disabled={isPending}
              >
                {isPending ? "Attente..." : "Choisir"}
              </Button>
            </button>
          ))}
        </div>

        <DialogFooter className="sm:justify-start">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <HugeiconsIcon icon={CreditCardIcon} size={14} />
            Paiement sécurisé par Stripe (Simulation)
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
