import { useSession, signIn, signOut } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  type LoginInput, 
  type SignupInput, 
  type VerifyOtpInput, 
  type ForgotPasswordInput, 
  type ResetPasswordInput 
} from "@/lib/validations";
import { apiClient } from "@/lib/axios";

export const useCurrentUser = () => {
  const { data: session, status } = useSession();
  return {
    data: session?.user,
    isLoading: status === "loading",
    status,
  };
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async (data: SignupInput) => {
      const response = await apiClient.post("/api/auth/signup", data);
      return response.data;
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: VerifyOtpInput) => {
      const response = await apiClient.post("/api/auth/verify-otp", data);
      return response.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const response = await apiClient.post("/api/auth/forgot-password", data);
      return response.data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const response = await apiClient.post("/api/auth/reset-password", data);
      return response.data;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await signOut({ callbackUrl: "/login" });
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
