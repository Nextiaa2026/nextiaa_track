import { apiClient } from "@/lib/axios";
import {
  ShipmentInput,
  ShipmentLogInput,
  ShipmentPatchInput,
} from "@/lib/validations";

export interface Shipment {
  id: number;
  trackingNumber: string;
  shipmentType: "international" | "local";
  itemName: string;
  itemWeight: string;
  status: string;
  vesselId?: number | null;
  sender: { id: number; name: string; email: string; city: string };
  receiver: { id: number; name: string; email: string; city: string };
  vessel?: { id: number; name: string; imo: string; type: string } | null;
  vesselName?: string;
  vesselImo?: string;
  createdAt: string;
}

export interface ShipmentDetail extends Shipment {
  itemDescription: string;
  itemImage: string;
  itemDimensions: string;
  vesselName?: string;
  vesselImo?: string;
  shippingCost: number;
  estimatedDelivery?: string;
  vesselId?: number | null;
  vessel?: {
    id: number;
    name: string;
    imo: string;
    type: string;
  } | null;
  sender: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  logs: ShipmentLog[];
}

export interface ShipmentLog {
  id: number;
  shipmentId: number;
  status: string;
  location: string;
  address?: string;
  message: string;
  timestamp: string;
  shipment?: {
    trackingNumber: string;
    itemName: string;
  };
}

export interface TrackingResult {
  trackingNumber: string;
  status: string;
  itemName: string;
  itemDescription: string;
  itemImage: string;
  vesselName?: string;
  vesselImo?: string;
  sender: {
    name: string;
    email: string;
    phone: string;
  };
  receiver: {
    name: string;
    email: string;
    phone: string;
  };
  logs: Array<{
    id: number;
    status: string;
    location: string;
    message: string;
    timestamp: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  failedShipments: number;
  totalLogs: number;
  clientTrackingViews: number;
  resendEmailsSent: number;
  resendEmailFailures: number;
  deliverySuccessRate: number;
}

export interface Vessel {
  id: number;
  name: string;
  imo: string;
  type: string;
  status: "pending" | "in_transit" | "delivered" | "failed";
  lastKnownLat?: number | null;
  lastKnownLon?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VesselUpdateInput
  extends Partial<
    Pick<
      Vessel,
      "name" | "imo" | "type" | "status" | "lastKnownLat" | "lastKnownLon" | "isActive"
    >
  > {
  notifyRecipients?: boolean;
}

export interface ActiveShipmentMarker {
  shipmentId: number;
  trackingNumber: string;
  status: string;
  itemName: string;
  vesselName?: string | null;
  latitude: number;
  longitude: number;
}

export interface ShipmentReceipt {
  receiptNumber: string;
  issuedAt: string;
  shipment: {
    id: number;
    trackingNumber: string;
    itemName: string;
    itemWeight: string;
    status: string;
    createdAt: string;
    shippingCost: number;
  };
  sender: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  receiver: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  shipmentId: number;
  senderId: number;
  receiverId: number;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  issuedAt: string;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  shipment?: Shipment;
  sender?: {
    id: number;
    name: string;
    email: string;
    city: string;
  };
  receiver?: {
    id: number;
    name: string;
    email: string;
    city: string;
  };
}

// Shipment endpoints
export const shipmentService = {
  // Get all shipments with pagination
  getShipments: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = "",
    startDate?: string,
    endDate?: string,
  ): Promise<PaginatedResponse<Shipment>> => {
    const response = await apiClient.get("/api/dashboard/shipments", {
      params: { page, pageSize, search, startDate, endDate },
    });
    return response.data;
  },

  // Get single shipment
  getShipment: async (id: number): Promise<ShipmentDetail> => {
    const response = await apiClient.get(`/api/dashboard/shipments/${id}`);
    return response.data.shipment;
  },

  // Create shipment
  createShipment: async (data: ShipmentInput): Promise<Shipment> => {
    const response = await apiClient.post("/api/dashboard/shipments", data);
    return response.data.shipment;
  },

  // Track shipment (public)
  trackShipment: async (trackingNumber: string): Promise<TrackingResult> => {
    const response = await apiClient.post("/api/track", { trackingNumber });
    return response.data;
  },

  // Update shipment
  updateShipment: async (
    id: number,
    data: ShipmentPatchInput,
  ): Promise<ShipmentDetail> => {
    const response = await apiClient.patch(
      `/api/dashboard/shipments/${id}`,
      data,
    );
    return response.data.shipment;
  },

  // Delete shipment
  deleteShipment: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/dashboard/shipments/${id}`);
  },

  // Add shipment log
  addShipmentLog: async (data: ShipmentLogInput) => {
    const response = await apiClient.post("/api/dashboard/shipment-logs", data);
    return response.data.log;
  },

  // Get all shipment logs with pagination
  getLogs: async (
    page: number = 1,
    pageSize: number = 10,
    shipmentId?: number,
    startDate?: string,
    endDate?: string,
    status?: string,
    search?: string,
  ): Promise<PaginatedResponse<ShipmentLog>> => {
    const response = await apiClient.get("/api/dashboard/shipment-logs", {
      params: { page, pageSize, shipmentId, startDate, endDate, status, search },
    });
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get("/api/dashboard/stats");
    return response.data;
  },

  getVessels: async (
    page: number = 1,
    pageSize: number = 50,
    search: string = "",
  ): Promise<PaginatedResponse<Vessel>> => {
    const response = await apiClient.get("/api/dashboard/vessels", {
      params: { page, pageSize, search },
    });
    return response.data;
  },

  createVessel: async (
    data: Pick<Vessel, "name" | "imo" | "type"> & {
      status?: Vessel["status"];
      lastKnownLat?: number;
      lastKnownLon?: number;
      isActive?: boolean;
    },
  ): Promise<Vessel> => {
    const response = await apiClient.post("/api/dashboard/vessels", data);
    return response.data.vessel;
  },

  updateVessel: async (
    id: number,
    data: VesselUpdateInput,
  ): Promise<Vessel> => {
    const response = await apiClient.patch(`/api/dashboard/vessels/${id}`, data);
    return response.data.vessel;
  },

  deleteVessel: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/dashboard/vessels/${id}`);
  },

  cleanupOperationalData: async (): Promise<void> => {
    await apiClient.post("/api/dashboard/system/cleanup");
  },

  getActiveShipmentsMap: async (): Promise<ActiveShipmentMarker[]> => {
    const response = await apiClient.get("/api/dashboard/shipments/active-map");
    return response.data.data;
  },

  createReceipt: async (shipmentId: number): Promise<ShipmentReceipt> => {
    const response = await apiClient.post(`/api/dashboard/shipments/${shipmentId}/receipt`);
    return response.data.receipt;
  },

  getInvoices: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = "",
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get("/api/dashboard/invoices", {
      params: { page, pageSize, search, status, startDate, endDate },
    });
    return response.data;
  },
};
