"use client";

import * as React from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVessels } from "@/hooks/useShipments";
import { useCreateTrip } from "@/hooks/useTrips";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ZapIcon,
} from "@hugeicons/core-free-icons";

const tripSchema = z.object({
  tripNumber: z.string().min(1, "Trip number is required"),
  vesselId: z.string().min(1, "Vessel is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  departureDate: z.string().optional(),
  arrivalDate: z.string().optional(),
  status: z.enum(["pending", "in_transit", "arrived", "completed"]).default("pending"),
});

type TripFormValues = z.infer<typeof tripSchema>;

interface CreateTripSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTripSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateTripSheetProps) {
  const { data: vesselsData } = useVessels(1, 100);
  const vessels = vesselsData?.data || [];

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      tripNumber: "",
      vesselId: "",
      origin: "",
      destination: "",
      departureDate: "",
      arrivalDate: "",
      status: "pending",
    },
  });

  // Generate trip number when sheet opens
  React.useEffect(() => {
    if (open) {
      form.setValue(
        "tripNumber",
        `TRP-${Math.floor(1000 + Math.random() * 9000)}`,
      );
    }
  }, [open, form]);

  const { mutate: createTrip, isPending } = useCreateTrip();

  function onSubmit(values: TripFormValues) {
    createTrip(
      {
        ...values,
        vesselId: parseInt(values.vesselId),
      },
      {
        onSuccess: () => {
          toast.success("Voyage créé avec succès");
          onSuccess?.();
          onOpenChange(false);
          form.reset();
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-dvh w-full flex-col gap-0 border-l border-white/5 bg-background p-0 sm:max-w-2xl"
      >
        <SheetHeader className="px-6 py-5 border-b border-white/5 bg-muted/20">
          <SheetTitle className="text-2xl font-bold tracking-tight">
            Planifier un voyage
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground/70">
            Enregistrez un nouveau voyage pour suivre vos expéditions.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="tripNumber"
                render={({ field }: { field: ControllerRenderProps<TripFormValues, "tripNumber"> }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold text-muted-foreground">
                        Numéro de voyage
                      </FormLabel>
                      <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        Généré auto
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className="h-11 rounded-xl bg-gray-50/50 font-mono text-xs cursor-default focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vesselId"
                render={({ field }: { field: ControllerRenderProps<TripFormValues, "vesselId"> }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">
                      Navire
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Sélectionner un navire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {vessels.map((v) => (
                          <SelectItem key={v.id} value={v.id.toString()}>
                            {v.name} ({v.imo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }: { field: ControllerRenderProps<TripFormValues, "origin"> }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Origine
                    </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Marseille"
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }: { field: ControllerRenderProps<TripFormValues, "destination"> }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Destination
                    </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Casablanca"
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }: { field: ControllerRenderProps<TripFormValues, "departureDate"> }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Départ
                    </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalDate"
                  render={({ field }: { field: ControllerRenderProps<TripFormValues, "arrivalDate"> }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Arrivée
                    </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }: { field: ControllerRenderProps<TripFormValues, "status"> }) => (
                  <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground">
                    Statut du voyage
                  </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pending">En attente (Pending)</SelectItem>
                        <SelectItem value="in_transit">En transit (In Transit)</SelectItem>
                        <SelectItem value="arrived">Arrivé (Arrived)</SelectItem>
                        <SelectItem value="completed">Terminé (Completed)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className="p-6 border-t border-white/5 bg-muted/20 flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
            <HugeiconsIcon
              icon={ZapIcon}
              size={12}
              className="text-amber-500"
            />
            La création d&apos;un voyage déduira 3 crédits de votre compte.
          </div>
          <div className="flex flex-row-reverse justify-start gap-3 w-full">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending}
              className="flex-1 sm:flex-none h-11 rounded-xl px-8 font-semibold btn-shiny"
            >
              {isPending ? "Planification..." : "Planifier le voyage"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-11 rounded-xl border-white/10"
            >
              Annuler
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
