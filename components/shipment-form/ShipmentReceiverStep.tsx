"use client";

import { useFormContext } from "react-hook-form";
import type { ShipmentFormValues } from "@/lib/validations";
import type { Customer } from "@/services/customer.service";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { setPartyAddressFromGeocode } from "./shipment-address-helpers";
import type { ShipmentDetail } from "@/services/shipment.service";
import { CustomerCombobox } from "./CustomerCombobox";
import { Controller } from "react-hook-form";
import { fr } from "@/lib/i18n/fr";

type Props = {
  isEdit: boolean;
  existingShipment: ShipmentDetail | undefined;
  customers: Customer[];
  receiverMode: "existing" | "new";
  onReceiverModeChange: (m: "existing" | "new") => void;
  mapPreview: { lat: number; lon: number } | null;
  onMapPreviewChange: (v: { lat: number; lon: number } | null) => void;
};

export function ShipmentReceiverStep({
  isEdit,
  existingShipment,
  customers,
  receiverMode,
  onReceiverModeChange,
  mapPreview,
  onMapPreviewChange,
}: Props) {
  const p = fr.forms.party;
  const ad = fr.forms.address;
  const sw = fr.forms.shipmentWizard;
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();

  if (isEdit && existingShipment) {
    return (
      <Card className="border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {p.editCardReceiver}
        </p>
        <p className="mt-2 font-semibold text-foreground">
          {existingShipment.receiver.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {existingShipment.receiver.email}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {existingShipment.receiver.phone}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {existingShipment.receiver.address}, {existingShipment.receiver.city}
        </p>
      </Card>
    );
  }

  return (
    <FieldGroup className="gap-6">
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
        <button
          type="button"
          className={cn(
            "rounded-md px-4 py-2 text-xs font-semibold transition-colors",
            receiverMode === "existing"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
          onClick={() => {
            onReceiverModeChange("existing");
            onMapPreviewChange(null);
          }}
        >
          {p.existingCustomer}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-4 py-2 text-xs font-semibold transition-colors",
            receiverMode === "new"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
          onClick={() => {
            onReceiverModeChange("new");
            onMapPreviewChange(null);
          }}
        >
          {p.newProfile}
        </button>
      </div>

      {receiverMode === "existing" ? (
        <Field data-invalid={!!errors.receiverId}>
          <FieldLabel htmlFor="receiver-customer">Destinataire</FieldLabel>
          <Controller
            control={control}
            name="receiverId"
            render={({ field }) => (
              <CustomerCombobox
                customers={customers}
                value={field.value}
                onSelect={(id) => {
                  field.onChange(id);
                }}
                placeholder={sw.placeholderReceiver}
                error={!!errors.receiverId}
              />
            )}
          />
          {errors.receiverId && (
            <FieldError>{errors.receiverId.message}</FieldError>
          )}
          {errors.receiver?.message &&
            typeof errors.receiver.message === "string" && (
              <FieldError>{errors.receiver.message}</FieldError>
            )}
        </Field>
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 md:grid-cols-2 md:p-6">
          <Field data-invalid={!!errors.receiver?.name}>
            <FieldLabel htmlFor="receiver-name">{p.fullName}</FieldLabel>
            <Input
              id="receiver-name"
              placeholder={sw.placeholderNameReceiver}
              aria-invalid={!!errors.receiver?.name}
              {...register("receiver.name")}
            />
            {errors.receiver?.name && (
              <FieldError>{errors.receiver.name.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.receiver?.email}>
            <FieldLabel htmlFor="receiver-email">{fr.forms.common.email}</FieldLabel>
            <Input
              id="receiver-email"
              type="email"
              placeholder={fr.forms.login.emailPlaceholder}
              aria-invalid={!!errors.receiver?.email}
              {...register("receiver.email")}
            />
            {errors.receiver?.email && (
              <FieldError>{errors.receiver.email.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.receiver?.phone}>
            <FieldLabel htmlFor="receiver-phone">{p.phone}</FieldLabel>
            <Input
              id="receiver-phone"
              placeholder="+237 …"
              aria-invalid={!!errors.receiver?.phone}
              {...register("receiver.phone")}
            />
            {errors.receiver?.phone && (
              <FieldError>{errors.receiver.phone.message}</FieldError>
            )}
          </Field>

          <Field
            className="md:col-span-2"
            data-invalid={!!errors.receiver?.address}
          >
            <FieldLabel htmlFor="receiver-address-search">
              {p.addressSearch}
            </FieldLabel>
            <AddressAutocomplete
              placeholder={ad.placeholder}
              onAddressSelect={(addr) => {
                setPartyAddressFromGeocode(setValue, "receiver", addr);
                if (
                  Number.isFinite(addr.latitude) &&
                  Number.isFinite(addr.longitude)
                ) {
                  onMapPreviewChange({
                    lat: addr.latitude,
                    lon: addr.longitude,
                  });
                } else {
                  onMapPreviewChange(null);
                }
              }}
            />
            <input type="hidden" {...register("receiver.address")} />
            {errors.receiver?.address && (
              <FieldError>{errors.receiver.address.message}</FieldError>
            )}
            {mapPreview ? (
              <LocationMapPreview
                latitude={mapPreview.lat}
                longitude={mapPreview.lon}
                height={160}
                className="mt-3"
              />
            ) : null}
          </Field>

          <p className="md:col-span-2 -mt-2 text-xs text-muted-foreground">
            {ad.hintPartyMissing}
          </p>
          <Field data-invalid={!!errors.receiver?.city}>
            <FieldLabel htmlFor="receiver-city">{p.city}</FieldLabel>
            <Input
              id="receiver-city"
              placeholder={ad.autofilled}
              aria-invalid={!!errors.receiver?.city}
              {...register("receiver.city")}
            />
            {errors.receiver?.city && (
              <FieldError>{errors.receiver.city.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={!!errors.receiver?.state}>
            <FieldLabel htmlFor="receiver-state">{p.state}</FieldLabel>
            <Input
              id="receiver-state"
              placeholder={ad.statePlaceholder}
              aria-invalid={!!errors.receiver?.state}
              {...register("receiver.state")}
            />
            {errors.receiver?.state && (
              <FieldError>{errors.receiver.state.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={!!errors.receiver?.zipCode}>
            <FieldLabel htmlFor="receiver-zip">{p.zipCode}</FieldLabel>
            <Input
              id="receiver-zip"
              placeholder={ad.zipPlaceholder}
              aria-invalid={!!errors.receiver?.zipCode}
              {...register("receiver.zipCode")}
            />
            {errors.receiver?.zipCode && (
              <FieldError>{errors.receiver.zipCode.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={!!errors.receiver?.country}>
            <FieldLabel htmlFor="receiver-country">{p.country}</FieldLabel>
            <Input
              id="receiver-country"
              placeholder={ad.countryPlaceholder}
              aria-invalid={!!errors.receiver?.country}
              {...register("receiver.country")}
            />
            {errors.receiver?.country && (
              <FieldError>{errors.receiver.country.message}</FieldError>
            )}
          </Field>
        </div>
      )}
    </FieldGroup>
  );
}
