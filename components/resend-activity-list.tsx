"use client";

import { formatDistanceToNow } from "date-fns";
import { useShipmentLogs } from "@/hooks/useShipments";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fr } from "@/lib/i18n/fr";

export function ResendActivityList() {
  const { data, isLoading } = useShipmentLogs(
    1,
    6,
    undefined,
    undefined,
    undefined,
    "email_sent,email_failed",
  );

  const logs = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fr.dashboard.resendTitle}</CardTitle>
        <CardDescription>{fr.dashboard.resendDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">{fr.dashboard.loadingResend}</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">{fr.dashboard.noResendLogs}</div>
        ) : (
          logs.map((log) => {
            const isFailed = log.status === "email_failed";
            return (
              <div
                key={log.id}
                className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {log.shipment?.trackingNumber
                      ? `Shipment ${log.shipment.trackingNumber}`
                      : `Shipment #${log.shipmentId}`}
                  </div>
                  <div className="text-xs text-muted-foreground">{log.message}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isFailed ? "destructive" : "secondary"}>
                    {isFailed ? fr.dashboard.failed : fr.dashboard.sent}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
