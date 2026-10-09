"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useTransfer } from "@/hooks/use-accounts";
import { messageOf } from "@/lib/api-client";
import { formatMinor, parseAmountToMinor } from "@/lib/money";
import { transferSchema, type TransferInput } from "@/lib/validation";
import type { Account } from "@/types/api";

interface TransferDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferDialog({ account, open, onOpenChange }: TransferDialogProps) {
  const transfer = useTransfer();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: { destinationAccountId: "", amount: "" },
  });

  function onSubmit(values: TransferInput) {
    const amount = parseAmountToMinor(values.amount);
    if (amount === null) {
      return;
    }

    if (amount > account.balanceMinor) {
      setError("amount", {
        message: `Not enough funds. Available: ${formatMinor(account.balanceMinor, account.currency)}`,
      });
      return;
    }

    if (values.destinationAccountId === account.id) {
      setError("destinationAccountId", { message: "Pick an account other than this one" });
      return;
    }

    transfer.mutate(
      { accountId: account.id, destinationAccountId: values.destinationAccountId, amount },
      {
        onSuccess: () => {
          toast.success(`Sent ${formatMinor(amount, account.currency)}`);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send money</DialogTitle>
          <DialogDescription>
            From your {account.currency} account. Both accounts must hold the same currency.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {transfer.isError && (
              <Alert variant="destructive">
                <AlertDescription>{messageOf(transfer.error)}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={Boolean(errors.destinationAccountId)}>
              <FieldLabel htmlFor="destinationAccountId">Recipient account ID</FieldLabel>
              <Input
                id="destinationAccountId"
                className="font-mono"
                placeholder="00000000-0000-0000-0000-000000000000"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.destinationAccountId)}
                {...register("destinationAccountId")}
              />
              <FieldDescription>
                The API addresses transfers by account UUID. A lookup by email or phone needs a
                backend endpoint that does not exist yet.
              </FieldDescription>
              <FieldError errors={[errors.destinationAccountId]} />
            </Field>

            <Field data-invalid={Boolean(errors.amount)}>
              <FieldLabel htmlFor="transfer-amount">Amount ({account.currency})</FieldLabel>
              <Input
                id="transfer-amount"
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
                aria-invalid={Boolean(errors.amount)}
                {...register("amount")}
              />
              <FieldDescription>
                Available: {formatMinor(account.balanceMinor, account.currency)}
              </FieldDescription>
              <FieldError errors={[errors.amount]} />
            </Field>
          </FieldGroup>

          {/* Inside the form, so Enter in a field submits. */}
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={transfer.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={transfer.isPending}>
              {transfer.isPending && <Spinner />}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
