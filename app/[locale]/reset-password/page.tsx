"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";
import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AuthCard, AuthLogo } from "@/components/auth/AuthComponents";

function ResetPasswordForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const email = searchParams.get("email");
  const otp = searchParams.get("otp");

  const [showPassword, setShowPassword] = useState(false);
  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: email || "",
      otp: otp || "",
      password: "",
    },
  });

  useEffect(() => {
    if (!email || !otp) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    setValue("email", email);
    setValue("otp", otp);
  }, [email, otp, locale, router, setValue]);

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      await resetPasswordMutation.mutateAsync(data);
      toast.success("Password reset successfully!");
      router.push(`/${locale}/auth/login`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to reset password";
      toast.error(message);
    }
  };

  const isLoading = resetPasswordMutation.isPending;

  if (!email || !otp) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">New Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            {...register("password")}
            className={`h-11 text-sm pr-10 ${errors.password ? "border-red-500" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button disabled={isLoading} className="w-full h-11 text-sm font-medium">
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Reset Password"}
      </Button>
    </form>
  );
}

export default function AuthResetPasswordPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <div className="text-center mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Reset Password</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter your new password below.</p>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="size-8 animate-spin text-primary/50" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
