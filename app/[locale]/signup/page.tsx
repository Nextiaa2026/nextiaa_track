"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AuthCard, AuthLogo, GoogleIcon, Divider } from "@/components/auth/AuthComponents";
import { useSignup } from "@/hooks/useAuth";
import { signupSchema, type SignupInput } from "@/lib/validations";

export default function AuthSignupPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const signupMutation = useSignup();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    try {
      await signupMutation.mutateAsync(data);
      toast.success("Account created! Please verify your email.");
      router.push(`/${locale}/auth/verify-otp?email=${data.email}&type=signup`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create account";
      toast.error(message);
    }
  };

  const isLoading = signupMutation.isPending;

  return (
    <AuthCard>
      <AuthLogo />
      <div className="text-center mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Create an account</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter your details to get started.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Full Name</Label>
          <Input
            placeholder="Enter your name"
            {...register("name")}
            className={`h-11 text-sm ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

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

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Sign Up"}
        </Button>
      </form>

      <div className="mt-6 space-y-4">
        <Divider />
        <Button
          variant="outline"
          type="button"
          onClick={() => signIn("google", { callbackUrl: `/${locale}/dashboard` })}
          className="w-full h-11 text-sm font-medium gap-2"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href={`/${locale}/auth/login`} className="text-blue-600 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
