import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";

export const useSubscriptionStats = () => {
  return useQuery({
    queryKey: ["subscription-stats"],
    queryFn: () => subscriptionService.getStats(),
  });
};

export const useAddCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason?: string }) =>
      subscriptionService.addCredits(amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
    },
  });
};
