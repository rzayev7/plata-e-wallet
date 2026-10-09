import { z } from "zod";

import { CURRENCIES } from "@/types/api";
import { parseAmountToMinor } from "@/lib/money";

/*
 * Shared between the browser forms and the Next route handlers, so a request
 * forged past the UI is validated again on the server before it reaches Spring.
 */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    email: z.email("Enter a valid email address"),
    /*
     * The backend puts no constraint on rawPassword at all — an empty password
     * is currently accepted. Until it does, this is the only gate.
     */
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const createAccountSchema = z.object({
  currency: z.enum(CURRENCIES),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

/** A typed amount, validated as a decimal string and carried as minor units. */
export const amountSchema = z
  .string()
  .min(1, "Enter an amount")
  .refine((value) => parseAmountToMinor(value) !== null, {
    message: "Enter an amount greater than zero, with at most 2 decimals",
  });

export const moneyMovementSchema = z.object({
  amount: amountSchema,
});

export type MoneyMovementInput = z.infer<typeof moneyMovementSchema>;

export const transferSchema = z.object({
  destinationAccountId: z.uuid("Enter the recipient's account ID"),
  amount: amountSchema,
});

export type TransferInput = z.infer<typeof transferSchema>;
