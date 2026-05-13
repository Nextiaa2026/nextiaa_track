import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export interface Trip {
  id: number;
  tripNumber: string;
  vesselId: number;
  vessel?: {
    name: string;
    imo: string;
  };
  origin: string;
  destination: string;
  departureDate?: string;
  arrivalDate?: string;
  status: string;
}

export interface CreateTripInput {
  tripNumber: string;
  vesselId: number;
  origin: string;
  destination: string;
  departureDate?: string;
  arrivalDate?: string;
}

export function useTrips(page = 1, pageSize = 10, search = "") {
  return useQuery({
    queryKey: ["trips", page, pageSize, search],
    queryFn: async () => {
      const response = await axios.get(`/api/dashboard/trips?page=${page}&pageSize=${pageSize}&search=${search}`);
      return response.data;
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTripInput) => {
      const response = await axios.post("/api/dashboard/trips", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
    },
    onError: (error: unknown) => {
      const message = (error as any).response?.data?.error || "Erreur lors de la création du voyage";
      toast.error(message);
    },
  });
}
