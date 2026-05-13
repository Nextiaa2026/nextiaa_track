"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShipment, useDeleteShipment, useCreateReceipt } from "@/hooks/useShipments";
import { AddShipmentLogSheet } from "@/components/sheets/AddShipmentLogSheet";
import { CreateShipmentSheet } from "@/components/sheets/CreateShipmentSheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getStatusColor, getStatusDisplay } from "@/lib/utils/shipment";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageIcon,
  TruckIcon,
  Calendar01Icon,
  CargoShipIcon,
  UserIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import type { ShipmentReceipt } from "@/services/shipment.service";

type OverviewStatRow = {
  label: string;
  value: string;
  icon: typeof Calendar01Icon;
  color: string;
};

function ShipmentOverviewTable({
  overviewStats,
}: {
  overviewStats: OverviewStatRow[];
}) {
  const [overviewSelection, setOverviewSelection] = useState<
    Record<number, boolean>
  >({});

  const overviewSelectedCount = overviewStats.filter(
    (_, i) => overviewSelection[i],
  ).length;
  const overviewAllSelected =
    overviewStats.length > 0 &&
    overviewSelectedCount === overviewStats.length;
  const overviewSomeSelected =
    overviewSelectedCount > 0 && !overviewAllSelected;

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Shipment Intelligence Overview
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/5">
              <th className="w-12 px-4 py-3 align-middle">
                <div className="flex justify-center">
                  <Checkbox
                    checked={
                      overviewAllSelected
                        ? true
                        : overviewSomeSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) => {
                      const next = !!checked;
                      setOverviewSelection(
                        Object.fromEntries(
                          overviewStats.map((_, i) => [i, next]),
                        ),
                      );
                    }}
                    aria-label="Select all overview rows"
                    className="border-gray-300"
                  />
                </div>
              </th>
              <th className="px-6 py-3 font-normal text-muted-foreground">
                Metric
              </th>
              <th className="px-6 py-3 font-normal text-muted-foreground">
                Value
              </th>
              <th className="px-6 py-3 font-normal text-muted-foreground">
                Indicator
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {overviewStats.map((stat, i) => (
              <tr key={i} className="transition-colors hover:bg-muted/5">
                <td className="px-4 py-4 align-middle">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={!!overviewSelection[i]}
                      onCheckedChange={(checked) =>
                        setOverviewSelection((prev) => ({
                          ...prev,
                          [i]: !!checked,
                        }))
                      }
                      aria-label={`Select ${stat.label}`}
                      className="border-gray-300"
                    />
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-normal text-muted-foreground">
                  {stat.label}
                </td>
                <td className="px-6 py-4 font-normal text-foreground">
                  {stat.value}
                </td>
                <td className="px-6 py-4">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg bg-muted/10",
                      stat.color,
                    )}
                  >
                    <HugeiconsIcon icon={stat.icon} size={16} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = parseInt(params.id as string);
  const { data: shipment, isLoading, error } = useShipment(shipmentId);
  const { mutate: deleteShipment, isPending: isDeleting } = useDeleteShipment();
  const { mutateAsync: createReceipt, isPending: isCreatingReceipt } = useCreateReceipt();
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [editWizardOpen, setEditWizardOpen] = useState(false);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<ShipmentReceipt | null>(null);

  const overviewStats = useMemo<OverviewStatRow[]>(() => {
    if (!shipment) return [];
    return [
      {
        label: "Estimated Delivery",
        value: shipment.estimatedDelivery
          ? new Date(shipment.estimatedDelivery).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "Not scheduled",
        icon: Calendar01Icon,
        color: "text-blue-600",
      },
      {
        label: "Vessel / Carrier",
        value: shipment.vesselName || "Standard Freight",
        icon: CargoShipIcon,
        color: "text-indigo-600",
      },
      {
        label: "Cargo Weight",
        value: shipment.itemWeight || "N/A",
        icon: PackageIcon,
        color: "text-amber-600",
      },
      {
        label: "Shipping Fee",
        value: `$${(shipment.shippingCost / 100).toFixed(2)}`,
        icon: TruckIcon,
        color: "text-emerald-600",
      },
      {
        label: "Vessel IMO",
        value: shipment.vesselImo || "N/A",
        icon: CargoShipIcon,
        color: "text-slate-600",
      },
      {
        label: "Dimensions",
        value: shipment.itemDimensions || "Standard",
        icon: PackageIcon,
        color: "text-cyan-600",
      },
      {
        label: "Shipment Type",
        value: shipment.shipmentType || "international",
        icon: TruckIcon,
        color: "text-violet-600",
      },
    ];
  }, [shipment]);

  const printReceipt = (receipt: ShipmentReceipt) => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            .receipt { border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; }
            .header { padding: 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
            .title { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
            .meta { margin: 2px 0; font-size: 13px; color: #4b5563; }
            .section { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
            .section:last-child { border-bottom: 0; }
            .section h3 { margin: 0 0 10px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
            .row { display: flex; margin: 6px 0; font-size: 14px; }
            .label { width: 170px; color: #6b7280; }
            .value { font-weight: 600; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1 class="title">Shipment Receipt</h1>
              <p class="meta">Receipt #: ${receipt.receiptNumber}</p>
              <p class="meta">Issued: ${new Date(receipt.issuedAt).toLocaleString()}</p>
            </div>
            <div class="section">
              <h3>Shipment</h3>
              <div class="row"><div class="label">Tracking Number</div><div class="value">${receipt.shipment.trackingNumber}</div></div>
              <div class="row"><div class="label">Item</div><div class="value">${receipt.shipment.itemName}</div></div>
              <div class="row"><div class="label">Status</div><div class="value">${receipt.shipment.status}</div></div>
              <div class="row"><div class="label">Shipping Cost</div><div class="value">$${(receipt.shipment.shippingCost / 100).toFixed(2)}</div></div>
            </div>
            <div class="section">
              <h3>Sender</h3>
              <div class="row"><div class="label">Name</div><div class="value">${receipt.sender.name}</div></div>
              <div class="row"><div class="label">Email</div><div class="value">${receipt.sender.email}</div></div>
              <div class="row"><div class="label">Phone</div><div class="value">${receipt.sender.phone}</div></div>
              <div class="row"><div class="label">Address</div><div class="value">${receipt.sender.address}, ${receipt.sender.city}, ${receipt.sender.country}</div></div>
            </div>
            <div class="section">
              <h3>Receiver</h3>
              <div class="row"><div class="label">Name</div><div class="value">${receipt.receiver.name}</div></div>
              <div class="row"><div class="label">Email</div><div class="value">${receipt.receiver.email}</div></div>
              <div class="row"><div class="label">Phone</div><div class="value">${receipt.receiver.phone}</div></div>
              <div class="row"><div class="label">Address</div><div class="value">${receipt.receiver.address}, ${receipt.receiver.city}, ${receipt.receiver.country}</div></div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error("Unable to open print window");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const onCreateReceipt = async () => {
    try {
      const receipt = await createReceipt(shipmentId);
      setReceiptPreview(receipt);
      setReceiptPreviewOpen(true);
      toast.success("Receipt preview ready");
    } catch {
      toast.error("Failed to create receipt");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Gathering shipment intelligence…
        </p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="mx-auto max-w-2xl pt-20">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={PackageIcon} size={24} />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Shipment not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t retrieve the details for this tracking number.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push("/dashboard/shipments")}
          >
            Return to list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header & Actions */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {shipment.trackingNumber}
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm",
                getStatusColor(shipment.status)
              )}
            >
              {getStatusDisplay(shipment.status)}
            </span>
          </div>
          <p className="text-muted-foreground">
            {shipment.itemName} • Registered on{" "}
            {new Date(shipment.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-border bg-background px-4 hover:bg-muted"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-border bg-background px-4 hover:bg-muted"
            onClick={() => setEditWizardOpen(true)}
          >
            Edit details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-border bg-background px-4 hover:bg-muted"
            disabled={isCreatingReceipt}
            onClick={() => void onCreateReceipt()}
          >
            {isCreatingReceipt ? "Creating receipt..." : "Create receipt"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-10 px-4"
            disabled={isDeleting}
            onClick={() => {
              if (confirm("Permanently delete this shipment?")) {
                deleteShipment(shipmentId, {
                  onSuccess: () => {
                    toast.success("Shipment deleted successfully");
                    router.push("/dashboard/shipments");
                  },
                });
              }
            }}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      <ShipmentOverviewTable
        key={shipmentId}
        overviewStats={overviewStats}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Journey Visualizer */}
          <Card className="overflow-hidden border-border bg-card">
            <div className="border-b border-border bg-muted/20 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Logistics Route
              </h3>
            </div>
            <div className="p-8">
              <div className="relative flex items-center justify-between">
                {/* Visual Line */}
                <div className="absolute left-[20px] right-[20px] top-[24px] h-0.5 border-t-2 border-dashed border-muted-foreground/20" />

                {/* From */}
                <div className="relative z-10 flex flex-col items-center gap-3 bg-card px-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-sm">
                    <HugeiconsIcon icon={Location01Icon} size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">
                      {shipment.sender.city}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                      {shipment.sender.country}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="relative z-10 rounded-full bg-muted/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
                  {getStatusDisplay(shipment.status)}
                </div>

                {/* To */}
                <div className="relative z-10 flex flex-col items-center gap-3 bg-card px-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-muted-foreground/20 bg-muted/5 text-muted-foreground">
                    <HugeiconsIcon icon={Location01Icon} size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">
                      {shipment.receiver.city}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                      {shipment.receiver.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tracking History */}
          <Card className="border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Activity Logs
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
                onClick={() => setLogSheetOpen(true)}
              >
                <Plus size={14} />
                Add Entry
              </Button>
            </div>
            <div className="px-8 py-10">
              <div className="space-y-0">
                {shipment.logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-4 h-12 w-12 rounded-full bg-muted/10 p-3 text-muted-foreground/30">
                      <HugeiconsIcon icon={TruckIcon} size={24} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No activity logs recorded yet.
                    </p>
                  </div>
                ) : (
                  shipment.logs.map((log, index) => (
                    <div key={log.id} className="group relative flex gap-6 pb-10 last:pb-0">
                      {/* Vertical Line */}
                      {index < shipment.logs.length - 1 && (
                        <div className="absolute left-[9px] top-[26px] h-[calc(100%-16px)] w-[2px] bg-border group-hover:bg-primary/20 transition-colors" />
                      )}

                      {/* Dot */}
                      <div className={cn(
                        "relative z-10 mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        index === 0 ? "border-primary bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" : "border-border bg-background group-hover:border-primary/40"
                      )}>
                        {index === 0 && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-bold tracking-tight",
                            index === 0 ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {getStatusDisplay(log.status)}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground tabular-nums">
                            {new Date(log.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-muted/5 p-4 transition-colors group-hover:bg-muted/10">
                          {log.location && (
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary/80">
                              {log.location}
                            </p>
                          )}
                          <p className="text-xs/relaxed text-muted-foreground">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Party Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="border-border bg-card">
              <div className="border-b border-border bg-muted/20 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <HugeiconsIcon icon={UserIcon} size={12} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Sender
                  </h3>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {shipment.sender.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.sender.email}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/5 p-3">
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={Location01Icon} size={14} className="mt-0.5 text-muted-foreground/60" />
                    <p className="text-[11px]/relaxed text-muted-foreground">
                      {shipment.sender.address}, {shipment.sender.city}, {shipment.sender.country}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card">
              <div className="border-b border-border bg-muted/20 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <HugeiconsIcon icon={UserIcon} size={12} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Receiver
                  </h3>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {shipment.receiver.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.receiver.email}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/5 p-3">
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={Location01Icon} size={14} className="mt-0.5 text-muted-foreground/60" />
                    <p className="text-[11px]/relaxed text-muted-foreground">
                      {shipment.receiver.address}, {shipment.receiver.city}, {shipment.receiver.country}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>

      <AddShipmentLogSheet
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
        shipmentId={shipmentId}
      />

      <CreateShipmentSheet
        open={editWizardOpen}
        onOpenChange={setEditWizardOpen}
        mode="edit"
        shipmentId={shipmentId}
      />

      <Sheet open={receiptPreviewOpen} onOpenChange={setReceiptPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Receipt preview</SheetTitle>
            <SheetDescription>
              Review the HTML receipt design, then print via browser.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-4">
            <div className="rounded-xl border bg-white">
              {receiptPreview ? (
                <>
                  <div className="border-b bg-muted/20 px-4 py-3">
                    <h3 className="text-lg font-bold">Shipment Receipt</h3>
                    <p className="text-xs text-muted-foreground">#{receiptPreview.receiptNumber}</p>
                  </div>
                  <div className="space-y-4 p-4 text-sm">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipment</p>
                      <p><span className="font-medium">Tracking:</span> {receiptPreview.shipment.trackingNumber}</p>
                      <p><span className="font-medium">Item:</span> {receiptPreview.shipment.itemName}</p>
                      <p><span className="font-medium">Status:</span> {receiptPreview.shipment.status}</p>
                      <p><span className="font-medium">Shipping Cost:</span> ${(receiptPreview.shipment.shippingCost / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sender</p>
                      <p>{receiptPreview.sender.name} ({receiptPreview.sender.email})</p>
                      <p>{receiptPreview.sender.phone}</p>
                      <p>{receiptPreview.sender.address}, {receiptPreview.sender.city}, {receiptPreview.sender.country}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receiver</p>
                      <p>{receiptPreview.receiver.name} ({receiptPreview.receiver.email})</p>
                      <p>{receiptPreview.receiver.phone}</p>
                      <p>{receiptPreview.receiver.address}, {receiptPreview.receiver.city}, {receiptPreview.receiver.country}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Issued: {new Date(receiptPreview.issuedAt).toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">No receipt generated yet.</div>
              )}
            </div>
          </div>

          <SheetFooter className="mt-auto">
            <Button
              disabled={!receiptPreview}
              onClick={() => {
                if (!receiptPreview) return;
                printReceipt(receiptPreview);
                toast.success("Print dialog opened");
              }}
            >
              Print receipt
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
