import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  ShipmentCreatedEmail,
  ShipmentStatusUpdateEmail,
  DeliveryConfirmationEmail,
} from "@/services/email.service";

export const useSendEmail = () => {
  return useMutation({
    mutationFn: async (payload: {
      type: string;
      data:
        | ShipmentCreatedEmail
        | ShipmentStatusUpdateEmail
        | DeliveryConfirmationEmail;
    }) => {
      const response = await apiClient.post("/api/emails/send", payload);
      return response.data;
    },
  });
};

export const useSendShipmentCreatedEmail = () => {
  const { mutate, ...rest } = useSendEmail();

  return {
    sendEmail: (data: ShipmentCreatedEmail) => {
      mutate({ type: "shipment_created", data });
    },
    ...rest,
  };
};

export const useSendStatusUpdateEmail = () => {
  const { mutate, ...rest } = useSendEmail();

  return {
    sendEmail: (data: ShipmentStatusUpdateEmail) => {
      mutate({ type: "status_update", data });
    },
    ...rest,
  };
};

export const useSendDeliveryConfirmationEmail = () => {
  const { mutate, ...rest } = useSendEmail();

  return {
    sendEmail: (data: DeliveryConfirmationEmail) => {
      mutate({ type: "delivery_confirmed", data });
    },
    ...rest,
  };
};

export const useSendFailedDeliveryEmail = () => {
  const { mutate, ...rest } = useSendEmail();

  return {
    sendEmail: (data: ShipmentStatusUpdateEmail) => {
      mutate({ type: "delivery_failed", data });
    },
    ...rest,
  };
};
