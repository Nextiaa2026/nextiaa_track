import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentLogService } from "@/services/shipment-log.service";
import { ShipmentLogInput } from "@/lib/validations";

export const useShipmentLogs = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ["shipmentLogs", page, pageSize],
    queryFn: () => shipmentLogService.getShipmentLogs(page, pageSize),
  });
};

export const useShipmentLogsByShipmentId = (
  shipmentId: number,
  page: number = 1,
  pageSize: number = 10,
) => {
  return useQuery({
    queryKey: ["shipmentLogs", shipmentId, page, pageSize],
    queryFn: () =>
      shipmentLogService.getShipmentLogsByShipmentId(
        shipmentId,
        page,
        pageSize,
      ),
    enabled: !!shipmentId,
  });
};

export const useAddShipmentLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShipmentLogInput) =>
      shipmentLogService.addShipmentLog(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shipmentLogs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["shipment", variables.shipmentId],
      });
    },
  });
};
