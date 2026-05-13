/**
 * Email Service
 *
 * Handles all email notifications for the shipment management system.
 * Currently configured for Resend, but can be adapted for other providers.
 *
 * Supported email types:
 * - Shipment created notification
 * - Shipment status update notification
 * - Delivery confirmation
 * - Failed delivery notification
 */

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface ShipmentCreatedEmail {
  recipient: EmailRecipient;
  trackingNumber: string;
  itemName: string;
  senderName: string;
  receiverName: string;
  estimatedDelivery?: string;
}

export interface ShipmentPacketEmail extends ShipmentCreatedEmail {
  status: string;
  statusSummary: string;
  receiptHtml: string;
  invoiceHtml: string;
}

export interface ShipmentStatusUpdateEmail {
  recipient: EmailRecipient;
  trackingNumber: string;
  status: string;
  location?: string;
  message: string;
}

export interface DeliveryConfirmationEmail {
  recipient: EmailRecipient;
  trackingNumber: string;
  itemName: string;
  deliveryDate: string;
}

export interface VesselStatusUpdateEmail {
  recipient: EmailRecipient;
  trackingNumber: string;
  vesselName: string;
  previousStatus: string;
  newStatus: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInfoRows(
  rows: Array<{ label: string; value: string | undefined }>,
): string {
  return rows
    .filter((row) => row.value && row.value.trim() !== "")
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0; color:#64748b; font-size:13px; width:170px;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0; color:#0f172a; font-size:13px; font-weight:600;">${escapeHtml(row.value ?? "")}</td>
        </tr>
      `,
    )
    .join("");
}

function renderEmailLayout(params: {
  previewText: string;
  title: string;
  greetingName: string;
  intro: string;
  statusBadge?: string;
  rows: Array<{ label: string; value: string | undefined }>;
  highlightMessage?: string;
  sectionsHtml?: string;
  ctaLabel?: string;
  ctaHref?: string;
}): string {
  const badge = params.statusBadge
    ? `<span style="display:inline-block; margin-bottom:12px; padding:6px 10px; border-radius:9999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:600;">${escapeHtml(params.statusBadge)}</span>`
    : "";
  const highlight = params.highlightMessage
    ? `<div style="margin-top:16px; border:1px solid #e2e8f0; background:#f8fafc; border-radius:10px; padding:12px 14px; color:#334155; font-size:13px; line-height:1.55;">${escapeHtml(params.highlightMessage)}</div>`
    : "";
  const cta =
    params.ctaLabel && params.ctaHref
      ? `<div style="margin-top:20px;">
          <a href="${escapeHtml(params.ctaHref)}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; font-size:13px; padding:10px 16px; border-radius:8px;">
            ${escapeHtml(params.ctaLabel)}
          </a>
        </div>`
      : "";

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(params.title)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f1f5f9; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(params.previewText)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:18px 22px; background:linear-gradient(90deg,#1d4ed8,#2563eb); color:#ffffff;">
                <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.9;">Nexiaa Track</div>
                <div style="margin-top:6px; font-size:20px; font-weight:700;">${escapeHtml(params.title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px;">
                ${badge}
                <p style="margin:0; color:#0f172a; font-size:14px; line-height:1.6;">Bonjour ${escapeHtml(params.greetingName)},</p>
                <p style="margin:10px 0 0; color:#334155; font-size:14px; line-height:1.65;">${escapeHtml(params.intro)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px; border-top:1px solid #e2e8f0;">
                  ${renderInfoRows(params.rows)}
                </table>
                ${highlight}
                ${params.sectionsHtml ?? ""}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px; background:#f8fafc; border-top:1px solid #e2e8f0; color:#64748b; font-size:12px; line-height:1.5;">
                Cet e-mail a été envoyé automatiquement par Nexiaa Track.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

function sanitizeEmailFragment(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");
}

function buildDocumentSection(title: string, bodyHtml: string): string {
  return `
    <div style="margin-top:18px;">
      <div style="margin-bottom:8px; color:#0f172a; font-size:13px; font-weight:700;">${escapeHtml(title)}</div>
      <div style="border:1px solid #e2e8f0; border-radius:10px; background:#ffffff; overflow:hidden;">
        <div style="max-height:260px; overflow:auto; padding:12px;">
          ${sanitizeEmailFragment(bodyHtml)}
        </div>
      </div>
    </div>
  `;
}

function generateShipmentCreatedTemplate(data: ShipmentCreatedEmail): string {
  return renderEmailLayout({
    previewText: `Expédition ${data.trackingNumber} créée`,
    title: "Expédition créée",
    greetingName: data.recipient.name,
    intro: "Votre expédition a bien été enregistrée. Vous trouverez les informations essentielles ci-dessous.",
    statusBadge: "Nouveau",
    rows: [
      { label: "Numéro de suivi", value: data.trackingNumber },
      { label: "Article", value: data.itemName },
      { label: "Expéditeur", value: data.senderName },
      { label: "Destinataire", value: data.receiverName },
      { label: "Livraison estimée", value: data.estimatedDelivery },
    ],
  });
}

function generateStatusUpdateTemplate(data: ShipmentStatusUpdateEmail): string {
  return renderEmailLayout({
    previewText: `Mise à jour du statut ${data.trackingNumber}`,
    title: "Mise à jour du statut",
    greetingName: data.recipient.name,
    intro: "Le statut de votre expédition a évolué.",
    statusBadge: data.status,
    rows: [
      { label: "Numéro de suivi", value: data.trackingNumber },
      { label: "Nouveau statut", value: data.status },
      { label: "Localisation", value: data.location },
    ],
    highlightMessage: data.message,
  });
}

function generateDeliveryConfirmationTemplate(
  data: DeliveryConfirmationEmail,
): string {
  return renderEmailLayout({
    previewText: `Livraison confirmée ${data.trackingNumber}`,
    title: "Livraison confirmée",
    greetingName: data.recipient.name,
    intro: "Bonne nouvelle, votre expédition a été livrée avec succès.",
    statusBadge: "Livré",
    rows: [
      { label: "Numéro de suivi", value: data.trackingNumber },
      { label: "Article", value: data.itemName },
      { label: "Date de livraison", value: data.deliveryDate },
    ],
  });
}

function generateFailedDeliveryTemplate(
  data: ShipmentStatusUpdateEmail,
): string {
  return renderEmailLayout({
    previewText: `Échec de livraison ${data.trackingNumber}`,
    title: "Échec de livraison",
    greetingName: data.recipient.name,
    intro: "La livraison n'a pas pu être finalisée. Veuillez consulter le détail ci-dessous.",
    statusBadge: "Échec",
    rows: [
      { label: "Numéro de suivi", value: data.trackingNumber },
      { label: "Statut", value: data.status },
      { label: "Localisation", value: data.location },
    ],
    highlightMessage: data.message,
  });
}

function generateVesselStatusUpdateTemplate(data: VesselStatusUpdateEmail): string {
  return renderEmailLayout({
    previewText: `Transport ${data.vesselName} mis à jour`,
    title: "Mise à jour du transport",
    greetingName: data.recipient.name,
    intro: "Le statut du transport associé à votre expédition a changé.",
    statusBadge: `${data.previousStatus} -> ${data.newStatus}`,
    rows: [
      { label: "Numéro de suivi", value: data.trackingNumber },
      { label: "Transport", value: data.vesselName },
      { label: "Ancien statut", value: data.previousStatus },
      { label: "Nouveau statut", value: data.newStatus },
    ],
    highlightMessage: data.message,
  });
}

export const emailService = {
  /**
   * Send shipment created notification
   * Sent to both sender and receiver when a shipment is created
   */
  sendShipmentCreatedEmail: async (data: ShipmentCreatedEmail) => {
    try {
      const html = generateShipmentCreatedTemplate(data);
      console.log("Email would be sent:", {
        to: data.recipient.email,
        subject: `Votre expédition ${data.trackingNumber} a été créée`,
        htmlPreview: html,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send shipment created email:", error);
      throw error;
    }
  },

  /**
   * Send shipment packet email
   * Includes receipt, invoice, and status summary in one email.
   */
  sendShipmentPacketEmail: async (data: ShipmentPacketEmail) => {
    try {
      const html = renderEmailLayout({
        previewText: `Dossier complet ${data.trackingNumber}`,
        title: "Dossier d'expédition complet",
        greetingName: data.recipient.name,
        intro: "Vous trouverez dans cet e-mail le récapitulatif de votre expédition, avec les éléments de reçu et facture.",
        statusBadge: data.status,
        rows: [
          { label: "Numéro de suivi", value: data.trackingNumber },
          { label: "Article", value: data.itemName },
          { label: "Expéditeur", value: data.senderName },
          { label: "Destinataire", value: data.receiverName },
          { label: "Livraison estimée", value: data.estimatedDelivery },
        ],
        highlightMessage: data.statusSummary,
        sectionsHtml:
          buildDocumentSection("Aperçu du reçu", data.receiptHtml) +
          buildDocumentSection("Aperçu de la facture", data.invoiceHtml),
      });
      console.log("Shipment packet email would be sent:", {
        to: data.recipient.email,
        subject: `Expédition ${data.trackingNumber} : reçu, facture et statut`,
        hasReceiptHtml: Boolean(data.receiptHtml),
        hasInvoiceHtml: Boolean(data.invoiceHtml),
        htmlPreview: html,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send shipment packet email:", error);
      throw error;
    }
  },

  /**
   * Send shipment status update notification
   * Sent to both sender and receiver when shipment status changes
   */
  sendShipmentStatusUpdateEmail: async (data: ShipmentStatusUpdateEmail) => {
    try {
      const html = generateStatusUpdateTemplate(data);
      console.log("Email would be sent:", {
        to: data.recipient.email,
        subject: `Mise à jour du statut de l'expédition ${data.trackingNumber}`,
        htmlPreview: html,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send status update email:", error);
      throw error;
    }
  },

  /**
   * Send delivery confirmation email
   * Sent when shipment is successfully delivered
   */
  sendDeliveryConfirmationEmail: async (data: DeliveryConfirmationEmail) => {
    try {
      const html = generateDeliveryConfirmationTemplate(data);
      console.log("Email would be sent:", {
        to: data.recipient.email,
        subject: `Livraison confirmée pour ${data.trackingNumber}`,
        htmlPreview: html,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send delivery confirmation email:", error);
      throw error;
    }
  },

  /**
   * Send failed delivery notification
   * Sent when delivery fails
   */
  sendFailedDeliveryEmail: async (data: ShipmentStatusUpdateEmail) => {
    try {
      const html = generateFailedDeliveryTemplate(data);
      console.log("Email would be sent:", {
        to: data.recipient.email,
        subject: `Échec de la livraison pour ${data.trackingNumber}`,
        htmlPreview: html,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send failed delivery email:", error);
      throw error;
    }
  },

  /**
   * Send vessel status change notification
   * Sent to sender and receiver of linked open shipments.
   */
  sendVesselStatusUpdateEmail: async (data: VesselStatusUpdateEmail) => {
    try {
      const html = generateVesselStatusUpdateTemplate(data);
      console.log("Vessel status update email would be sent:", {
        to: data.recipient.email,
        subject: `Mise à jour du transport ${data.vesselName} pour ${data.trackingNumber}`,
        from: data.previousStatus,
        toStatus: data.newStatus,
        htmlPreview: html,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send vessel status update email:", error);
      throw error;
    }
  },
};
