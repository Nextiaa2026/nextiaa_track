"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOtpSchema, type VerifyOtpInput } from "@/lib/validations";
import { useVerifyOtp, useForgotPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot, 
  InputOTPSeparator 
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthCard, AuthLogo } from "@/components/auth/AuthComponents";

function VerifyOtpForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const email = searchParams.get("email");
  const type = searchParams.get("type") as "signup" | "forgot-password";

  const [isLoading, setIsLoading] = useState(false);
  const verifyOtpMutation = useVerifyOtp();
  const forgotPasswordMutation = useForgotPassword();

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: email || "",
      type: type || "signup",
      otp: "",
    },
  });

  useEffect(() => {
    if (!email || !type) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    setValue("email", email);
    setValue("type", type);
  }, [email, type, locale, router, setValue]);

  const onSubmit = async (data: VerifyOtpInput) => {
    setIsLoading(true);
    try {
      await verifyOtpMutation.mutateAsync(data);
      toast.success("Verification successful!");
      
      if (type === "signup") {
        router.push(`/${locale}/auth/login`);
      } else {
        router.push(`/${locale}/auth/reset-password?email=${email}&otp=${data.otp}`);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid or expired OTP";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      toast.success("A new OTP has been sent to your email.");
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  if (!email || !type) return null;

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Verify Your Email</h1>
        <p className="text-sm text-gray-500 mt-1">
          We&apos;ve sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-3 flex flex-col items-center">
          <Label className="text-sm font-medium text-gray-700 w-full text-center">One-Time Password</Label>
          <Controller
            control={control}
            name="otp"
            render={({ field }) => (
              <InputOTP
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="size-12 text-lg" />
                  <InputOTPSlot index={1} className="size-12 text-lg" />
                  <InputOTPSlot index={2} className="size-12 text-lg" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={3} className="size-12 text-lg" />
                  <InputOTPSlot index={4} className="size-12 text-lg" />
                  <InputOTPSlot index={5} className="size-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
          {errors.otp && (
            <p className="text-xs text-red-500 mt-1 text-center">{errors.otp.message}</p>
          )}
        </div>

        <Button disabled={isLoading} className="w-full h-11 text-sm font-medium">
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Verify Code"}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="text-blue-600 font-semibold hover:underline"
            >
              Resend
            </button>
          </p>
        </div>
      </form>
    </>
  );
}

export default function AuthVerifyOtpPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="size-8 animate-spin text-primary/50" />
        </div>
      }>
        <VerifyOtpForm />
      </Suspense>
    </AuthCard>
  );
}
