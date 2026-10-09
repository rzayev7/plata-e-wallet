"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, messageOf } from "@/lib/api-client";
import { registerSchema, type RegisterInput } from "@/lib/validation";

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  const signUp = useMutation({
    mutationFn: (values: RegisterInput) =>
      api<{ ok: true; signedIn: boolean }>("/auth/register", { method: "POST", body: values }),
    onSuccess: (result) => {
      if (result.signedIn) {
        router.replace("/dashboard");
      } else {
        /* The account exists but the follow-up sign-in failed. */
        toast.success("Account created. Please sign in.");
        router.replace("/login");
      }
      router.refresh();
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => signUp.mutate(values))} noValidate>
      <FieldGroup>
        {signUp.isError && (
          <Alert variant="destructive">
            <AlertDescription>{messageOf(signUp.error, "Could not create your account")}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={Boolean(errors.firstName)}>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input id="firstName" autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} {...register("firstName")} />
            <FieldError errors={[errors.firstName]} />
          </Field>

          <Field data-invalid={Boolean(errors.lastName)}>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input id="lastName" autoComplete="family-name" aria-invalid={Boolean(errors.lastName)} {...register("lastName")} />
            <FieldError errors={[errors.lastName]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={Boolean(errors.phoneNumber)}>
          <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
          <Input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+994 50 000 00 00"
            aria-invalid={Boolean(errors.phoneNumber)}
            {...register("phoneNumber")}
          />
          <FieldError errors={[errors.phoneNumber]} />
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <Button type="submit" size="lg" disabled={signUp.isPending}>
          {signUp.isPending && <Spinner />}
          Create account
        </Button>
      </FieldGroup>
    </form>
  );
}
