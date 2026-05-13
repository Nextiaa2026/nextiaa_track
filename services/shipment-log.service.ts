import { apiClient } from "@/lib/axios";
import { ShipmentLogInput } from "@/lib/validations";

export interface ShipmentLog {
  id: number;
  shipmentId: number;
  status: string;
  location?: string;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const shipmentLogService = {
  /**
   * Get all shipment logs with pagination
   */
  getShipmentLogs: async (
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResponse<ShipmentLog>> => {
    const response = await apiClient.get("/api/dashboard/shipment-logs", {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get logs for a specific shipment
   */
  getShipmentLogsByShipmentId: async (
    shipmentId: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResponse<ShipmentLog>> => {
    const response = await apiClient.get(
      `/api/dashboard/shipment-logs?shipmentId=${shipmentId}`,
      {
        params: { page, pageSize },
      },
    );
    return response.data;
  },

  /**
   * Add a new shipment log
   */
  addShipmentLog: async (data: ShipmentLogInput) => {
    const response = await apiClient.post("/api/dashboard/shipment-logs", data);
    return response.data;
  },
};
