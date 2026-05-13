/**
 * Shipment Utility Functions
 */

/**
 * Generate a unique shipment number
 * Format: SHIP-YYYYMMDD-XXXXX
 */
export function generateShipmentNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `SHIP-${year}${month}${day}-${random}`;
}

/**
 * Generate a unique tracking number
 * Format: TRK-YYYYMMDD-XXXXX
 */
export function generateTrackingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `TRK-${year}${month}${day}-${random}`;
}

/**
 * Validate tracking number format
 */
export function isValidTrackingNumber(trackingNumber: string): boolean {
  const trackingRegex = /^TRK-\d{8}-\d{5}$/;
  return trackingRegex.test(trackingNumber);
}

/**
 * Validate shipment number format
 */
export function isValidShipmentNumber(shipmentNumber: string): boolean {
  const shipmentRegex = /^SHIP-\d{8}-\d{5}$/;
  return shipmentRegex.test(shipmentNumber);
}

/**
 * Format tracking number for display
 */
export function formatTrackingNumber(trackingNumber: string): string {
  return trackingNumber.toUpperCase();
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "in_transit":
      return "bg-blue-100 text-blue-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get status display text
 */
export function getStatusDisplay(status: string): string {
  switch (status) {
    case "pending":
      return "En attente";
    case "in_transit":
      return "En transit";
    case "delivered":
      return "Livré";
    case "failed":
      return "Échoué";
    case "email_sent":
      return "E-mail envoyé";
    case "email_failed":
      return "E-mail en échec";
    case "tracking_viewed":
      return "Suivi consulté";
    default:
      return (
        status.replace("_", " ").charAt(0).toUpperCase() +
        status.replace("_", " ").slice(1)
      );
  }
}

/**
 * Calculate shipping cost display
 */
export function formatShippingCost(costInCents: number): string {
  return `$${(costInCents / 100).toFixed(2)}`;
}
