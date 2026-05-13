"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { ShipmentFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VesselSearchCombobox } from "@/components/shipment-form/vessel-search-combobox";
import { fr } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils";

const SHIPMENT_TYPE_OPTIONS = ["international", "local"] as const;

const SHIPMENT_TYPE_LABEL: Record<
  (typeof SHIPMENT_TYPE_OPTIONS)[number],
  string
> = {
  international: fr.forms.shipmentWizard.shipmentTypeInternational,
  local: fr.forms.shipmentWizard.shipmentTypeLocal,
};

export function ShipmentItemsStep() {
  const it = fr.forms.items;
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Field className="md:col-span-2" data-invalid={!!errors.trackingNumber}>
        <FieldLabel htmlFor="ship-tracking">{it.tracking}</FieldLabel>
        <Input
          id="ship-tracking"
          aria-invalid={!!errors.trackingNumber}
          {...register("trackingNumber")}
        />
        {errors.trackingNumber && (
          <FieldError>{errors.trackingNumber.message}</FieldError>
        )}
      </Field>

      <Field className="md:col-span-2" data-invalid={!!errors.itemName}>
        <FieldLabel htmlFor="ship-item-name">{it.itemTitle}</FieldLabel>
        <Input
          id="ship-item-name"
          placeholder={it.itemTitlePh}
          aria-invalid={!!errors.itemName}
          {...register("itemName")}
        />
        {errors.itemName && (
          <FieldError>{errors.itemName.message}</FieldError>
        )}
      </Field>

      <Field className="md:col-span-2" data-invalid={!!errors.itemDescription}>
        <FieldLabel htmlFor="ship-item-desc">{it.description}</FieldLabel>
        <textarea
          id="ship-item-desc"
          placeholder={it.descriptionPh}
          aria-invalid={!!errors.itemDescription}
          {...register("itemDescription")}
          className="flex min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
        />
        {errors.itemDescription && (
          <FieldError>{errors.itemDescription.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={!!errors.itemWeight}>
        <FieldLabel htmlFor="ship-weight">{it.weight}</FieldLabel>
        <Input
          id="ship-weight"
          placeholder={it.weightPh}
          aria-invalid={!!errors.itemWeight}
          {...register("itemWeight")}
        />
        {errors.itemWeight && (
          <FieldError>{errors.itemWeight.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={!!errors.itemDimensions}>
        <FieldLabel htmlFor="ship-dims">{it.dimensions}</FieldLabel>
        <Input
          id="ship-dims"
          placeholder={it.dimensionsPh}
          aria-invalid={!!errors.itemDimensions}
          {...register("itemDimensions")}
        />
        {errors.itemDimensions && (
          <FieldError>{errors.itemDimensions.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={!!errors.shippingCost}>
        <FieldLabel htmlFor="ship-cost">{it.shippingCents}</FieldLabel>
        <Input
          id="ship-cost"
          type="number"
          placeholder={it.shippingCentsPh}
          aria-invalid={!!errors.shippingCost}
          {...register("shippingCost", { valueAsNumber: true })}
        />
        {errors.shippingCost && (
          <FieldError>{errors.shippingCost.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={!!errors.shipmentType}>
        <FieldLabel htmlFor="ship-shipment-type">{it.shipmentType}</FieldLabel>
        <Controller
          control={control}
          name="shipmentType"
          render={({ field }) => (
            <Select
              value={field.value ?? "international"}
              onValueChange={field.onChange}
            >
              <SelectTrigger 
                id="ship-shipment-type" 
                className={cn(
                  "w-full justify-between h-11 rounded-xl",
                  errors.shipmentType && "border-destructive"
                )}
              >
                <SelectValue placeholder={it.shipmentTypePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {SHIPMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {SHIPMENT_TYPE_LABEL[opt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.shipmentType && (
          <FieldError>{errors.shipmentType.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={!!errors.estimatedDelivery}>
        <FieldLabel htmlFor="ship-delivery">{it.estimatedDelivery}</FieldLabel>
        <Controller
          control={control}
          name="estimatedDelivery"
          render={({ field }) => (
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={it.datePlaceholder}
              className={errors.estimatedDelivery ? "border-destructive" : ""}
            />
          )}
        />
        {errors.estimatedDelivery && (
          <FieldError>{errors.estimatedDelivery.message}</FieldError>
        )}
      </Field>

      <Field className="md:col-span-2" data-invalid={!!errors.vesselId}>
        <FieldLabel htmlFor="vessel-combobox">{it.transport}</FieldLabel>
        <Controller
          control={control}
          name="vesselId"
          render={({ field }) => (
            <VesselSearchCombobox
              id="vessel-combobox"
              value={field.value ?? undefined}
              onChange={(id) => {
                field.onChange(id ?? undefined);
              }}
              error={!!errors.vesselId}
            />
          )}
        />
        {errors.vesselId && (
          <FieldError>{errors.vesselId.message}</FieldError>
        )}
      </Field>
    </div>
  );
}
