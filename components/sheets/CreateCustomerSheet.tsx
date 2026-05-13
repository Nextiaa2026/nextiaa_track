"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import type { AddressResult } from "@/lib/nominatim";
import { useCreateCustomer } from "@/hooks/useCustomers";
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import { fr } from "@/lib/i18n/fr";

interface CreateCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCustomerSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomerSheetProps) {
  const cs = fr.forms.customerSheet;
  const p = fr.forms.party;
  const ad = fr.forms.address;
  const fc = fr.forms.common;
  const { mutate: createCustomer, isPending } = useCreateCustomer();
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [mapCounty, setMapCounty] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      country: "Cameroon",
    },
  });

  useEffect(() => {
    register("locality");
    register("latitude");
    register("longitude");
  }, [register]);

  const onSubmit = (data: CustomerInput) => {
    const toastId = toast.loading(cs.adding);

    createCustomer(data, {
      onSuccess: () => {
        toast.dismiss(toastId);
        toast.success(cs.success);
        reset();
        setMapCoords(null);
        setMapCounty("");
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (err) => {
        toast.dismiss(toastId);
        toast.error(cs.failTitle, {
          description: err instanceof Error ? err.message : cs.failGeneric,
        });
      },
    });
  };

  const applyGeocode = (r: AddressResult) => {
    setValue("address", r.address, { shouldValidate: true, shouldDirty: true });
    setValue("city", r.city, { shouldValidate: true, shouldDirty: true });
    setValue("state", r.state, { shouldValidate: true, shouldDirty: true });
    setValue("zipCode", r.zipCode, { shouldValidate: true, shouldDirty: true });
    setValue("country", r.country, { shouldValidate: true, shouldDirty: true });
    setValue("locality", r.locality || undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (Number.isFinite(r.latitude)) {
      setValue("latitude", r.latitude, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("latitude", undefined, { shouldDirty: true });
    }
    if (Number.isFinite(r.longitude)) {
      setValue("longitude", r.longitude, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("longitude", undefined, { shouldDirty: true });
    }
    setMapCounty(r.county || "");
    if (Number.isFinite(r.latitude) && Number.isFinite(r.longitude)) {
      setMapCoords({ lat: r.latitude, lon: r.longitude });
    } else {
      setMapCoords(null);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setMapCoords(null);
          setMapCounty("");
        }
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-4xl md:max-w-5xl lg:max-w-6xl"
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-100">
          <SheetTitle className="text-xl font-semibold">
            {cs.title}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground mt-1">
            Gérez les informations de vos clients et partenaires.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <form
            id="customer-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="customer-name">{p.fullName}</FieldLabel>
                <Input
                  id="customer-name"
                  placeholder={fr.forms.shipmentWizard.placeholderNameSender}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && (
                  <FieldError>{errors.name.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-email">{fc.email}</FieldLabel>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder={fr.forms.login.emailPlaceholder}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <FieldError>{errors.email.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-phone">{p.phone}</FieldLabel>
                <Input
                  id="customer-phone"
                  placeholder="+237 6XX XXX XXX"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                {errors.phone && (
                  <FieldError>{errors.phone.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="address-search">{p.addressSearch}</FieldLabel>
                <AddressAutocomplete
                  placeholder={ad.placeholderDetailed}
                  onAddressSelect={applyGeocode}
                />
                <FieldDescription>
                  {ad.customerAutocompleteHint}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-address">{p.streetAddress}</FieldLabel>
                <Input
                  id="customer-address"
                  placeholder={ad.streetExample}
                  aria-invalid={!!errors.address}
                  {...register("address")}
                />
                {errors.address && (
                  <FieldError>{errors.address.message}</FieldError>
                )}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer-city">{p.city}</FieldLabel>
                  <Input
                    id="customer-city"
                    placeholder="Douala"
                    aria-invalid={!!errors.city}
                    {...register("city")}
                  />
                  {errors.city && (
                    <FieldError>{errors.city.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-state">{p.state}</FieldLabel>
                  <Input
                    id="customer-state"
                    placeholder="Littoral"
                    aria-invalid={!!errors.state}
                    {...register("state")}
                  />
                  {errors.state && (
                    <FieldError>{errors.state.message}</FieldError>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="customer-locality">
                  {p.areaNeighbourhood}
                </FieldLabel>
                <Input
                  id="customer-locality"
                  placeholder={p.areaPlaceholder}
                  aria-invalid={!!errors.locality}
                  {...register("locality")}
                />
                {errors.locality && (
                  <FieldError>{errors.locality.message}</FieldError>
                )}
                {mapCounty ? (
                  <FieldDescription>
                    {p.countyDistrictLabel} : {mapCounty}
                  </FieldDescription>
                ) : null}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer-zip">{p.zipCode}</FieldLabel>
                  <Input
                    id="customer-zip"
                    placeholder="00000"
                    aria-invalid={!!errors.zipCode}
                    {...register("zipCode")}
                  />
                  {errors.zipCode && (
                    <FieldError>{errors.zipCode.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-country">{p.country}</FieldLabel>
                  <Input
                    id="customer-country"
                    placeholder="Cameroun"
                    aria-invalid={!!errors.country}
                    {...register("country")}
                  />
                  {errors.country && (
                    <FieldError>{errors.country.message}</FieldError>
                  )}
                </Field>
              </div>

              {mapCoords ? (
                <LocationMapPreview
                  latitude={mapCoords.lat}
                  longitude={mapCoords.lon}
                  height={176}
                />
              ) : null}

              <Field>
                <div className="flex flex-row-reverse justify-start gap-3 w-full">
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none h-11 rounded-xl px-8 font-semibold btn-shiny"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {fc.saving}
                      </>
                    ) : (
                      cs.saveCustomer
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 rounded-xl border-gray-200"
                    onClick={() => {
                      setMapCoords(null);
                      setMapCounty("");
                      onOpenChange(false);
                    }}
                  >
                    {fc.cancel}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
