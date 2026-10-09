"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, messageOf } from "@/lib/api-client";
import { loginSchema, type LoginInput } from "@/lib/validation";

export function LoginForm({ sessionExpired }: { sessionExpired: boolean }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signIn = useMutation({
    mutationFn: (values: LoginInput) => api<{ ok: true }>("/auth/login", { method: "POST", body: values }),
    onSuccess: () => {
      /* refresh() re-runs the server layouts so they see the new cookies. */
      router.replace("/dashboard");
      router.refresh();
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => signIn.mutate(values))} noValidate>
      <FieldGroup>
        {sessionExpired && !signIn.isError && (
          <Alert>
            <AlertDescription>Your session expired. Please sign in again.</AlertDescription>
          </Alert>
        )}

        {signIn.isError && (
          <Alert variant="destructive">
            <AlertDescription>{messageOf(signIn.error, "Could not sign you in")}</AlertDescription>
          </Alert>
        )}

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

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Button type="submit" size="lg" disabled={signIn.isPending}>
          {signIn.isPending && <Spinner />}
          Sign in
        </Button>
      </FieldGroup>
    </form>
  );
}
