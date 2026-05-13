import { apiClient } from "@/lib/axios";

export interface SubscriptionStats {
  balance: number;
  planName: string;
  planId: number | null;
  status: string;
  nextRefresh: string | null;
  recentTransactions: Array<{
    id: number;
    amount: number;
    reason: string;
    description: string;
    createdAt: string;
  }>;
}

export const subscriptionService = {
  getStats: async (): Promise<SubscriptionStats> => {
    const response = await apiClient.get("/api/dashboard/subscriptions/stats");
    return response.data;
  },

  addCredits: async (amount: number, reason?: string): Promise<{ success: boolean; newBalance: number; message: string }> => {
    const response = await apiClient.post("/api/dashboard/credits/add", { amount, reason });
    return response.data;
  },
};
