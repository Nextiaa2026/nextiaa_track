import type { ShipmentReceipt } from "@/services/shipment.service";
import { getStatusDisplay } from "@/lib/utils/shipment";

type InvoiceOptions = {
  invoiceNumber?: string;
  issuedAt?: string;
};

function escapeHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildInvoiceHtml(
  receipt: ShipmentReceipt,
  options: InvoiceOptions = {},
): string {
  const issuedAt = options.issuedAt ?? receipt.issuedAt;
  const invoiceNumber =
    options.invoiceNumber ?? `INV-${receipt.receiptNumber.replace(/^RCPT-?/, "")}`;
  const shippingAmount = receipt.shipment.shippingCost / 100;
  const date = new Date(issuedAt).toLocaleString("fr-FR", {
    dateStyle: "medium",
  });

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Facture - ${escapeHtml(invoiceNumber)}</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 40px; color: #1f2937; line-height: 1.5; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
          .header { background: #111827; padding: 40px; color: #fff; display: flex; justify-content: space-between; align-items: flex-start; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
          .header-meta { text-align: right; }
          .header-meta p { margin: 4px 0; font-size: 14px; opacity: 0.8; }
          
          .content { padding: 40px; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .info-box h3 { margin: 0 0 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.1em; }
          .info-box p { margin: 2px 0; font-size: 14px; color: #4b5563; }
          .info-box strong { font-size: 16px; color: #111827; display: block; margin-bottom: 4px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #9ca3af; padding: 12px 0; border-bottom: 2px solid #f3f4f6; }
          td { padding: 20px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .price-col { text-align: right; }
          
          .totals { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; }
          .total-row.grand-total { border-top: 2px solid #111827; margin-top: 12px; padding-top: 20px; font-size: 20px; font-weight: 800; color: #111827; }
          
          .footer { margin-top: 60px; padding-top: 32px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
          
          @media print {
            body { padding: 0; }
            .container { border: none; width: 100%; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1>Facture</h1>
              <p style="margin-top: 8px; opacity: 0.8;">Suivi expédition: ${escapeHtml(receipt.shipment.trackingNumber)}</p>
            </div>
            <div class="header-meta">
              <p>Facture N°: <strong>${escapeHtml(invoiceNumber)}</strong></p>
              <p>Date: ${escapeHtml(date)}</p>
              <p>Statut: ${escapeHtml(getStatusDisplay(receipt.shipment.status))}</p>
            </div>
          </div>

          <div class="content">
            <div class="grid">
              <div class="info-box">
                <h3>Facturé par</h3>
                <strong>NTIGI LOGISTICS</strong>
                <p>${escapeHtml(receipt.sender.name)}</p>
                <p>${escapeHtml(receipt.sender.address)}</p>
                <p>${escapeHtml(receipt.sender.city)}, ${escapeHtml(receipt.sender.country)}</p>
              </div>
              <div class="info-box">
                <h3>Facturé à</h3>
                <strong>${escapeHtml(receipt.receiver.name)}</strong>
                <p>${escapeHtml(receipt.receiver.address)}</p>
                <p>${escapeHtml(receipt.receiver.city)}, ${escapeHtml(receipt.receiver.country)}</p>
                <p>${escapeHtml(receipt.receiver.phone)}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description de l'expédition</th>
                  <th class="price-col">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${escapeHtml(receipt.shipment.itemName)}</div>
                    <div style="font-size: 12px; color: #6b7280;">Transport de fret consolidé - N° de suivi ${escapeHtml(receipt.shipment.trackingNumber)}</div>
                  </td>
                  <td class="price-col">${shippingAmount.toFixed(2)} $</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Sous-total</span>
                <span>${shippingAmount.toFixed(2)} $</span>
              </div>
              <div class="total-row">
                <span>Taxes (0%)</span>
                <span>0.00 $</span>
              </div>
              <div class="total-row grand-total">
                <span>TOTAL</span>
                <span>${shippingAmount.toFixed(2)} $</span>
              </div>
            </div>

            <div class="footer">
              <strong>Conditions de paiement:</strong> Paiement dû à la réception.<br/>
              Merci de votre confiance. Pour toute question, contactez support@ntigi.com
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
