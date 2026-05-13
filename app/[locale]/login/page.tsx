"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AuthCard, AuthLogo, GoogleIcon, Divider } from "@/components/auth/AuthComponents";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthLoginPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthLogo />
      <div className="text-center mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Login</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter your details to login.</p>
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Password</Label>
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password")}
              className={`h-11 text-sm pr-9 ${errors.password ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button disabled={isLoading} className="w-full h-11 text-sm font-medium">
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Login"}
        </Button>
      </form>

      <Divider />

      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={() => signIn("google", { callbackUrl: `/${locale}/dashboard` })}
          className="w-full h-11 text-sm font-medium gap-2"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href={`/${locale}/auth/signup`} className="text-blue-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
