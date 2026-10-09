"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useCreateAccount } from "@/hooks/use-accounts";
import { messageOf } from "@/lib/api-client";
import { cn } from "cn";
import { CURRENCIES, type Currency } from "@/types/api";

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Currencies the customer already holds — see the uq_account_owner_currency index. */
  takenCurrencies: Currency[];
}

export function CreateAccountDialog({ open, onOpenChange, takenCurrencies }: CreateAccountDialogProps) {
  const available = CURRENCIES.filter((code) => !takenCurrencies.includes(code));
  const [currency, setCurrency] = useState<Currency | null>(available[0] ?? null);
  const createAccount = useCreateAccount();

  function submit() {
    if (!currency) {
      return;
    }
    createAccount.mutate(currency, {
      onSuccess: () => {
        toast.success(`${currency} account opened`);
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open an account</DialogTitle>
          <DialogDescription>
            One account per currency. Currencies you already hold are greyed out.
          </DialogDescription>
        </DialogHeader>

        {createAccount.isError && (
          <Alert variant="destructive">
            <AlertDescription>{messageOf(createAccount.error)}</AlertDescription>
          </Alert>
        )}

        {/* Three options — a segmented control beats a dropdown here. */}
        <Field role="radiogroup" aria-label="Currency">
          <FieldLabel>Currency</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {CURRENCIES.map((code) => {
              const taken = takenCurrencies.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={currency === code}
                  disabled={taken}
                  onClick={() => setCurrency(code)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    currency === code
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground not-disabled:hover:bg-muted/60",
                  )}
                >
                  {code}
                </button>
              );
            })}
          </div>
          <FieldDescription>
            {available.length === 0
              ? "You already hold an account in every supported currency."
              : "New accounts start at a zero balance and are immediately active."}
          </FieldDescription>
        </Field>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createAccount.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createAccount.isPending || !currency}>
            {createAccount.isPending && <Spinner />}
            Open account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
