import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentService } from "@/services/shipment.service";
import {
  ShipmentInput,
  ShipmentLogInput,
  ShipmentPatchInput,
} from "@/lib/validations";

export const useShipments = (
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  startDate?: string,
  endDate?: string,
) => {
  return useQuery({
    queryKey: ["shipments", page, pageSize, search, startDate, endDate],
    queryFn: () => shipmentService.getShipments(page, pageSize, search, startDate, endDate),
  });
};

export const useShipment = (
  id: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shipmentService.getShipment(id),
    enabled: options?.enabled ?? !!id,
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShipmentInput) => shipmentService.createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

export const useTrackShipment = () => {
  return useMutation({
    mutationFn: (trackingNumber: string) =>
      shipmentService.trackShipment(trackingNumber),
  });
};

export const useAddShipmentLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShipmentLogInput) =>
      shipmentService.addShipmentLog(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shipment", variables.shipmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["active-shipments-map"] });
    },
  });
};
export const useUpdateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShipmentPatchInput }) =>
      shipmentService.updateShipment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      queryClient.invalidateQueries({ queryKey: ["shipment-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["active-shipments-map"] });
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => shipmentService.deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

export const useShipmentLogs = (
  page: number = 1,
  pageSize: number = 10,
  shipmentId?: number,
  startDate?: string,
  endDate?: string,
  status?: string,
  search?: string,
) => {
  return useQuery({
    queryKey: ["shipment-logs", page, pageSize, shipmentId, startDate, endDate, status, search],
    queryFn: () =>
      shipmentService.getLogs(
        page,
        pageSize,
        shipmentId,
        startDate,
        endDate,
        status,
        search,
      ),
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => shipmentService.getDashboardStats(),
  });
};

export const useVessels = (
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
) => {
  return useQuery({
    queryKey: ["vessels", page, pageSize, search],
    queryFn: () => shipmentService.getVessels(page, pageSize, search),
  });
};

export const useCreateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.createVessel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
};

export const useUpdateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof shipmentService.updateVessel>[1] }) =>
      shipmentService.updateVessel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
};

export const useDeleteVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shipmentService.deleteVessel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["active-shipments-map"] });
    },
  });
};

export const useCleanupOperationalData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => shipmentService.cleanupOperationalData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useActiveShipmentsMap = () => {
  return useQuery({
    queryKey: ["active-shipments-map"],
    queryFn: () => shipmentService.getActiveShipmentsMap(),
    refetchInterval: 60000,
  });
};

export const useCreateReceipt = () => {
  return useMutation({
    mutationFn: (shipmentId: number) => shipmentService.createReceipt(shipmentId),
  });
};

export const useInvoices = (
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  status?: string,
  startDate?: string,
  endDate?: string,
) => {
  return useQuery({
    queryKey: ["invoices", page, pageSize, search, status, startDate, endDate],
    queryFn: () =>
      shipmentService.getInvoices(
        page,
        pageSize,
        search,
        status,
        startDate,
        endDate,
      ),
  });
};
