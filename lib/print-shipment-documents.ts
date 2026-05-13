import type { ShipmentReceipt } from "@/services/shipment.service";
import { getStatusDisplay } from "@/lib/utils/shipment";

function escapeHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReceiptHtml(receipt: ShipmentReceipt): string {
  const r = receipt;
  const date = new Date(r.issuedAt).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Reçu - ${escapeHtml(r.receiptNumber)}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 40px; color: #1f2937; line-height: 1.5; }
            .container { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header { background: #f9fafb; padding: 32px; border-bottom: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; }
            .header-left h1 { margin: 0; font-size: 24px; font-weight: 800; color: #111827; }
            .header-left p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
            .header-right { text-align: right; }
            .header-right .logo { font-size: 20px; font-weight: 900; color: #2563eb; margin-bottom: 8px; }
            
            .content { padding: 32px; }
            .section-title { font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 12px; display: block; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
            
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
            .info-box h4 { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #374151; }
            .info-box p { margin: 2px 0; font-size: 14px; color: #4b5563; }
            
            .shipment-details { background: #f3f4f6; border-radius: 8px; padding: 20px; margin-top: 32px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: 0; }
            .detail-label { color: #6b7280; font-size: 14px; }
            .detail-value { font-weight: 700; font-size: 14px; text-align: right; }
            .price { font-size: 18px; color: #111827; }

            .footer { padding: 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }

            @media print {
              body { padding: 0; }
              .container { border: none; box-shadow: none; width: 100%; max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-left">
                <h1>Reçu d'expédition</h1>
                <p>N° ${escapeHtml(r.receiptNumber)}</p>
                <p>Date d'émission : ${escapeHtml(date)}</p>
              </div>
              <div class="header-right">
                <div class="logo">NTIGI LOGISTICS</div>
                <p style="font-size: 12px; color: #6b7280;">Services de fret consolidé</p>
              </div>
            </div>

            <div class="content">
              <div class="grid">
                <div class="info-box">
                  <span class="section-title">Expéditeur</span>
                  <h4>${escapeHtml(r.sender.name)}</h4>
                  <p>${escapeHtml(r.sender.address)}</p>
                  <p>${escapeHtml(r.sender.city)}, ${escapeHtml(r.sender.country)}</p>
                  <p>${escapeHtml(r.sender.phone)}</p>
                  <p>${escapeHtml(r.sender.email)}</p>
                </div>
                <div class="info-box">
                  <span class="section-title">Destinataire</span>
                  <h4>${escapeHtml(r.receiver.name)}</h4>
                  <p>${escapeHtml(r.receiver.address)}</p>
                  <p>${escapeHtml(r.receiver.city)}, ${escapeHtml(r.receiver.country)}</p>
                  <p>${escapeHtml(r.receiver.phone)}</p>
                  <p>${escapeHtml(r.receiver.email)}</p>
                </div>
              </div>

              <span class="section-title">Détails de l'expédition</span>
              <div class="shipment-details">
                <div class="detail-row">
                  <span class="detail-label">Numéro de suivi</span>
                  <span class="detail-value">${escapeHtml(r.shipment.trackingNumber)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Article / Contenu</span>
                  <span class="detail-value">${escapeHtml(r.shipment.itemName)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Statut</span>
                  <span class="detail-value">${escapeHtml(getStatusDisplay(r.shipment.status))}</span>
                </div>
                <div class="detail-row" style="margin-top: 10px; border-top: 2px solid #d1d5db; padding-top: 16px;">
                  <span class="detail-label" style="font-weight: 800; color: #111827;">Total réglé</span>
                  <span class="detail-value price">${(r.shipment.shippingCost / 100).toFixed(2)} $</span>
                </div>
              </div>
            </div>

            <div class="footer">
              Merci d'avoir choisi NTIGI LOGISTICS pour vos besoins d'expédition.
              <br/>Ceci est un document officiel généré par notre système de suivi.
            </div>
          </div>
        </body>
      </html>
    `;
}

export function buildWaybillHtml(receipt: ShipmentReceipt): string {
  const r = receipt;
  const track = escapeHtml(r.shipment.trackingNumber);
  const date = new Date(r.issuedAt).toLocaleDateString("fr-FR");

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Label - ${track}</title>
        <style>
          @page { size: 100mm 150mm; margin: 0; }
          body { font-family: 'Inter', 'Helvetica', Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; display: flex; justify-content: center; }
          .label-container { width: 400px; border: 2px solid #000; background: #fff; overflow: hidden; }
          
          .label-header { border-bottom: 2px solid #000; padding: 15px; text-align: center; background: #f8fafc; }
          .label-logo { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
          .service-name { font-size: 14px; font-weight: 700; margin-top: 4px; }
          
          .tracking-section { padding: 20px; text-align: center; border-bottom: 2px solid #000; }
          .tracking-label { font-size: 12px; font-weight: 700; margin-bottom: 10px; display: block; }
          .barcode-mock { height: 60px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 6px); width: 80%; margin: 0 auto 8px; }
          .tracking-number { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
          
          .address-section { display: grid; grid-template-columns: 1fr; border-bottom: 2px solid #000; }
          .address-box { padding: 12px; border-bottom: 1px solid #000; }
          .address-box:last-child { border-bottom: 0; }
          .address-title { font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 6px; display: block; color: #666; }
          .address-details { font-size: 13px; line-height: 1.4; }
          .address-details strong { font-size: 15px; text-transform: uppercase; display: block; margin-bottom: 2px; }

          .footer-grid { display: grid; grid-template-columns: 1fr 1fr; height: 80px; }
          .footer-box { padding: 10px; border-right: 1px solid #000; font-size: 11px; display: flex; flex-direction: column; justify-content: center; }
          .footer-box:last-child { border-right: 0; background: #000; color: #fff; text-align: center; }
          .collect-indicator { font-size: 16px; font-weight: 900; }
          
          .terms { padding: 10px; font-size: 8px; text-align: justify; line-height: 1.2; border-top: 1px solid #000; }
          
          @media print {
            body { padding: 0; }
            .label-container { border-width: 3px; width: 100%; height: auto; }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="label-header">
            <div class="label-logo">NTIGI LOGISTICS</div>
            <div class="service-name">CONSOLIDATED SEA FREIGHT SERVICE</div>
          </div>

          <div class="tracking-section">
            <span class="tracking-label">Tracking Number / Numéro de suivi</span>
            <div class="barcode-mock"></div>
            <div class="tracking-number">${track}</div>
          </div>

          <div class="address-section">
            <div class="address-box">
              <span class="address-title">Ship From / Expéditeur</span>
              <div class="address-details">
                <strong>${escapeHtml(r.sender.name)}</strong>
                ${escapeHtml(r.sender.address)}<br/>
                ${escapeHtml(r.sender.city)}, ${escapeHtml(r.sender.country)}<br/>
                ${escapeHtml(r.sender.phone)}
              </div>
            </div>
            <div class="address-box">
              <span class="address-title">Ship To / Destinataire</span>
              <div class="address-details">
                <strong>${escapeHtml(r.receiver.name)}</strong>
                ${escapeHtml(r.receiver.address)}<br/>
                ${escapeHtml(r.receiver.city)}, ${escapeHtml(r.receiver.country)}<br/>
                ${escapeHtml(r.receiver.phone)}
              </div>
            </div>
          </div>

          <div class="footer-grid">
            <div class="footer-box">
              <div><strong>DATE:</strong> ${escapeHtml(date)}</div>
              <div><strong>WEIGHT:</strong> ${escapeHtml(r.shipment.itemWeight || "N/A")}</div>
              <div><strong>ITEM:</strong> ${escapeHtml(r.shipment.itemName)}</div>
            </div>
            <div class="footer-box">
              <div class="collect-indicator">COLLECT (C)</div>
              <div style="font-size: 9px; opacity: 0.8;">SEA LCL CONSOLIDATION</div>
            </div>
          </div>

          <div class="terms">
            TERMS: This document is a valid proof of shipment. Goods are subject to the carrier's standard terms and conditions.
            The consignee must verify the package integrity upon arrival. No claims accepted after 24h of delivery.
          </div>
        </div>
      </body>
    </html>
  `;
}

/** @returns false if pop-up blocked */
export function openPrintHtml(html: string): boolean {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  
  // Give some time for CSS to load before printing
  setTimeout(() => {
    printWindow.print();
  }, 500);
  
  return true;
}
