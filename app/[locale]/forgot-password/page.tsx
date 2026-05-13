"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthCard, AuthLogo } from "@/components/auth/AuthComponents";
import { useForgotPassword } from "@/hooks/useAuth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";

export default function AuthForgotPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      toast.success("OTP sent to your email");
      router.push(`/${locale}/auth/verify-otp?email=${data.email}&type=forgot-password`);
    } catch (err: unknown) {
      toast.error("Failed to send reset instructions");
    }
  };

  const isLoading = forgotPasswordMutation.isPending;

  return (
    <AuthCard>
      <AuthLogo />
      <div className="text-center mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Forgot Password</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Enter your email to receive a 6-digit verification code.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            className={`h-11 text-sm ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <Button disabled={isLoading} className="w-full h-11 text-sm font-medium">
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Send Code"}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link 
          href={`/${locale}/auth/login`} 
          className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1"
        >
          ← Back to Login
        </Link>
      </div>
    </AuthCard>
  );
}
