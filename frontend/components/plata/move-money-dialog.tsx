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
import { useDeposit, useWithdraw } from "@/hooks/use-accounts";
import { messageOf } from "@/lib/api-client";
import { formatMinor, parseAmountToMinor } from "@/lib/money";
import { moneyMovementSchema, type MoneyMovementInput } from "@/lib/validation";
import type { Account } from "@/types/api";

export type MoveMoneyAction = "deposit" | "withdraw";

const COPY = {
  deposit: {
    title: "Add money",
    description: "Top this account up.",
    submit: "Deposit",
  },
  withdraw: {
    title: "Withdraw money",
    description: "Take money out of this account.",
    submit: "Withdraw",
  },
} as const;

interface MoveMoneyDialogProps {
  account: Account;
  action: MoveMoneyAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveMoneyDialog({ account, action, open, onOpenChange }: MoveMoneyDialogProps) {
  const copy = COPY[action];
  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const mutation = action === "deposit" ? deposit : withdraw;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MoneyMovementInput>({
    resolver: zodResolver(moneyMovementSchema),
    defaultValues: { amount: "" },
  });

  function onSubmit(values: MoneyMovementInput) {
    const amount = parseAmountToMinor(values.amount);
    if (amount === null) {
      return;
    }

    /*
     * The balance is already on screen, so catch an over-withdrawal here rather
     * than round-tripping for a 409 whose message quotes raw minor units.
     * The backend still enforces it — this is convenience, not the rule.
     */
    if (action === "withdraw" && amount > account.balanceMinor) {
      setError("amount", {
        message: `Not enough funds. Available: ${formatMinor(account.balanceMinor, account.currency)}`,
      });
      return;
    }

    /* The backend takes minor units: 5.00 goes over the wire as 500. */
    mutation.mutate(
      { accountId: account.id, amount },
      {
        onSuccess: () => {
          toast.success(`${copy.submit} of ${formatMinor(amount, account.currency)} completed`);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>{messageOf(mutation.error)}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={Boolean(errors.amount)}>
              <FieldLabel htmlFor={`${action}-amount`}>Amount ({account.currency})</FieldLabel>
              <Input
                id={`${action}-amount`}
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

          {/* Inside the form, so Enter in the amount field submits. */}
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
