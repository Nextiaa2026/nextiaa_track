"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shipmentLogSchema, type ShipmentLogInput } from "@/lib/validations";
import { useAddShipmentLog } from "@/hooks/useShipments";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import { fr } from "@/lib/i18n/fr";

interface AddShipmentLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: number;
  onSuccess?: () => void;
}

export function AddShipmentLogSheet({
  open,
  onOpenChange,
  shipmentId,
  onSuccess,
}: AddShipmentLogSheetProps) {
  const sl = fr.forms.shipmentLog;
  const fc = fr.forms.common;
  const [addressPreview, setAddressPreview] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const { mutate: addLog, isPending } = useAddShipmentLog();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ShipmentLogInput>({
    resolver: zodResolver(shipmentLogSchema),
    defaultValues: {
      shipmentId,
    },
  });

  const onSubmit = (data: ShipmentLogInput) => {
    const toastId = toast.loading(sl.processing);

    addLog(data, {
      onSuccess: () => {
        toast.dismiss(toastId);
        toast.success(sl.success);
        reset({ shipmentId });
        setAddressPreview(null);
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (err) => {
        toast.dismiss(toastId);
        toast.error(sl.failTitle, {
          description: err instanceof Error ? err.message : fc.genericError,
        });
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-dvh w-full flex-col overflow-hidden border-none bg-white p-0 shadow-2xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl"
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-100">
          <SheetTitle className="text-xl font-semibold">
            Journal du voyage
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground mt-1">
            {sl.subtitle}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-10 w-full">
          <form
            id="log-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground ml-1">
                {sl.newStatus}
              </label>
              <select
                {...register("status")}
                className="w-full h-12 px-4 rounded-xl border-gray-100 bg-gray-50/50 text-sm font-bold focus:bg-white outline-none transition-all appearance-none"
              >
                <option value="">{sl.statusPlaceholder}</option>
                <option value="pending">{sl.statusPending}</option>
                <option value="in_transit">{sl.statusInTransit}</option>
                <option value="delivered">{sl.statusDelivered}</option>
                <option value="failed">{sl.statusFailed}</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-500 font-bold ml-1">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground ml-1">
                  {sl.checkpointName}
                </label>
                <Input
                  placeholder={sl.checkpointPlaceholder}
                  {...register("location")}
                  className="h-12 rounded-xl bg-gray-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground ml-1">
                  {sl.addressSearch}
                </label>
                <AddressAutocomplete
                  onAddressSelect={(addr) => {
                    setValue("address", addr.displayName);
                    setValue(
                      "location",
                      addr.city || addr.state || sl.transitFallback,
                    );
                    if (
                      Number.isFinite(addr.latitude) &&
                      Number.isFinite(addr.longitude)
                    ) {
                      setAddressPreview({
                        lat: addr.latitude,
                        lon: addr.longitude,
                      });
                    } else {
                      setAddressPreview(null);
                    }
                  }}
                  className="h-12 rounded-xl bg-gray-50/50 focus:bg-white"
                />
                <Input type="hidden" {...register("address")} />
                {addressPreview ? (
                  <LocationMapPreview
                    latitude={addressPreview.lat}
                    longitude={addressPreview.lon}
                    height={152}
                    className="mt-3"
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground ml-1">
                {sl.updateMessage}
              </label>
              <textarea
                placeholder={sl.messagePlaceholder}
                {...register("message")}
                className="w-full px-4 py-3 h-32 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-bold outline-none transition-all resize-none"
              />
              {errors.message && (
                <p className="text-xs text-red-500 font-bold ml-1">
                  {errors.message.message}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="px-8 py-8 border-t border-gray-50 bg-white flex items-center justify-between sticky bottom-0 z-10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 font-bold hover:text-gray-900"
          >
            {fc.cancel}
          </Button>
          <Button
            type="submit"
            form="log-form"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black h-12 px-10 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              sl.postButton
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
