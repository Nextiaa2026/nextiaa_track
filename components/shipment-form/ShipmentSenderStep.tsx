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
  senderMode: "existing" | "new";
  onSenderModeChange: (m: "existing" | "new") => void;
  mapPreview: { lat: number; lon: number } | null;
  onMapPreviewChange: (v: { lat: number; lon: number } | null) => void;
};

export function ShipmentSenderStep({
  isEdit,
  existingShipment,
  customers,
  senderMode,
  onSenderModeChange,
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
          {p.editCardSender}
        </p>
        <p className="mt-2 font-semibold text-foreground">
          {existingShipment.sender.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {existingShipment.sender.email}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {existingShipment.sender.phone}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {existingShipment.sender.address}, {existingShipment.sender.city}
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
            senderMode === "existing"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
          onClick={() => {
            onSenderModeChange("existing");
            onMapPreviewChange(null);
          }}
        >
          {p.existingCustomer}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-4 py-2 text-xs font-semibold transition-colors",
            senderMode === "new"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
          onClick={() => {
            onSenderModeChange("new");
            onMapPreviewChange(null);
          }}
        >
          {p.newProfile}
        </button>
      </div>

      {senderMode === "existing" ? (
        <Field data-invalid={!!errors.senderId}>
          <FieldLabel htmlFor="sender-customer">Expéditeur</FieldLabel>
          <Controller
            control={control}
            name="senderId"
            render={({ field }) => (
              <CustomerCombobox
                customers={customers}
                value={field.value}
                onSelect={(id) => {
                  field.onChange(id);
                }}
                placeholder={sw.placeholderSender}
                error={!!errors.senderId}
              />
            )}
          />
          {errors.senderId && (
            <FieldError>{errors.senderId.message}</FieldError>
          )}
          {errors.sender?.message &&
            typeof errors.sender.message === "string" && (
              <FieldError>{errors.sender.message}</FieldError>
            )}
        </Field>
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4 md:grid-cols-2 md:p-6">
          <Field data-invalid={!!errors.sender?.name}>
            <FieldLabel htmlFor="sender-name">{p.fullName}</FieldLabel>
            <Input
              id="sender-name"
              placeholder={sw.placeholderNameSender}
              aria-invalid={!!errors.sender?.name}
              {...register("sender.name")}
            />
            {errors.sender?.name && (
              <FieldError>{errors.sender.name.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.sender?.email}>
            <FieldLabel htmlFor="sender-email">{fr.forms.common.email}</FieldLabel>
            <Input
              id="sender-email"
              type="email"
              placeholder={fr.forms.login.emailPlaceholder}
              aria-invalid={!!errors.sender?.email}
              {...register("sender.email")}
            />
            {errors.sender?.email && (
              <FieldError>{errors.sender.email.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.sender?.phone}>
            <FieldLabel htmlFor="sender-phone">{p.phone}</FieldLabel>
            <Input
              id="sender-phone"
              placeholder="+237 …"
              aria-invalid={!!errors.sender?.phone}
              {...register("sender.phone")}
            />
            {errors.sender?.phone && (
              <FieldError>{errors.sender.phone.message}</FieldError>
            )}
          </Field>

          <Field
            className="md:col-span-2"
            data-invalid={!!errors.sender?.address}
          >
            <FieldLabel htmlFor="sender-address-search">
              {p.addressSearch}
            </FieldLabel>
            <AddressAutocomplete
              placeholder={ad.placeholder}
              onAddressSelect={(addr) => {
                setPartyAddressFromGeocode(setValue, "sender", addr);
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
            <input type="hidden" {...register("sender.address")} />
            {errors.sender?.address && (
              <FieldError>{errors.sender.address.message}</FieldError>
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
          <Field data-invalid={!!errors.sender?.city}>
            <FieldLabel htmlFor="sender-city">{p.city}</FieldLabel>
            <Input
              id="sender-city"
              placeholder={ad.autofilled}
              aria-invalid={!!errors.sender?.city}
              {...register("sender.city")}
            />
            {errors.sender?.city && (
              <FieldError>{errors.sender.city.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={!!errors.sender?.state}>
            <FieldLabel htmlFor="sender-state">{p.state}</FieldLabel>
            <Input
              id="sender-state"
              placeholder={ad.statePlaceholder}
              aria-invalid={!!errors.sender?.state}
              {...register("sender.state")}
            />
            {errors.sender?.state && (
              <FieldError>{errors.sender.state.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={!!errors.sender?.zipCode}>
            <FieldLabel htmlFor="sender-zip">{p.zipCode}</FieldLabel>
            <Input
              id="sender-zip"
              placeholder={ad.zipPlaceholder}
              aria-invalid={!!errors.sender?.zipCode}
              {...register("sender.zipCode")}
            />
            {errors.sender?.zipCode && (
              <FieldError>{errors.sender.zipCode.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={!!errors.sender?.country}>
            <FieldLabel htmlFor="sender-country">{p.country}</FieldLabel>
            <Input
              id="sender-country"
              placeholder={ad.countryPlaceholder}
              aria-invalid={!!errors.sender?.country}
              {...register("sender.country")}
            />
            {errors.sender?.country && (
              <FieldError>{errors.sender.country.message}</FieldError>
            )}
          </Field>
        </div>
      )}
    </FieldGroup>
  );
}
