import { apiClient } from "@/lib/axios";

export interface ShipsGoWebhook {
  event: string;
  shipmentId: string;
  status: string;
  location?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ShipsGoTrackingUpdate {
  trackingNumber: string;
  status: string;
  location: string;
  message: string;
  timestamp: string;
}

/**
 * ShipsGo Integration Service
 *
 * This service handles integration with ShipsGo API for automated tracking updates.
 * Currently, logs are manually entered by admins, but this service is structured
 * to easily support automated updates from ShipsGo webhooks in the future.
 *
 * Future enhancements:
 * - Webhook endpoint to receive real-time updates from ShipsGo
 * - Automatic log creation from ShipsGo events
 * - Sync historical tracking data
 */

export const shipsGoService = {
  /**
   * Process webhook from ShipsGo
   * Called when ShipsGo sends tracking updates
   */
  processWebhook: async (webhook: ShipsGoWebhook) => {
    const response = await apiClient.post(
      "/api/integrations/shipsgo/webhook",
      webhook,
    );
    return response.data;
  },

  /**
   * Sync tracking data from ShipsGo for a specific shipment
   * Can be called manually to pull latest data
   */
  syncTrackingData: async (trackingNumber: string) => {
    const response = await apiClient.post("/api/integrations/shipsgo/sync", {
      trackingNumber,
    });
    return response.data;
  },

  /**
   * Get ShipsGo tracking status
   * Fetch current status from ShipsGo API
   */
  getTrackingStatus: async (trackingNumber: string) => {
    const response = await apiClient.get(
      `/api/integrations/shipsgo/tracking/${trackingNumber}`,
    );
    return response.data;
  },

  /**
   * Create shipment in ShipsGo
   * When a shipment is created, optionally push to ShipsGo
   */
  createShipment: async (shipmentData: {
    trackingNumber: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    receiverName: string;
    receiverEmail: string;
    receiverPhone: string;
    itemName: string;
    itemWeight?: string;
    itemDimensions?: string;
  }) => {
    const response = await apiClient.post(
      "/api/integrations/shipsgo/shipments",
      shipmentData,
    );
    return response.data;
  },
};
