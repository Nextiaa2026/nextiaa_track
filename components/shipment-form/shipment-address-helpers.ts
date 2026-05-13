import type { FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";
import type { AddressResult } from "@/lib/nominatim";

/**
 * Generic `T` matches the form (e.g. `ShipmentFormValues` or `ShipmentInput`) so
 * `setValue` from `useForm` is accepted without `UseFormSetValue` variance errors.
 */
export function setPartyAddressFromGeocode<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  party: "sender" | "receiver",
  addr: AddressResult,
) {
  const p = `${party}.` as const;
  setValue(
    `${p}address` as Path<T>,
    addr.address as PathValue<T, Path<T>>,
    { shouldValidate: true, shouldDirty: true },
  );
  setValue(
    `${p}city` as Path<T>,
    addr.city as PathValue<T, Path<T>>,
    { shouldValidate: true, shouldDirty: true },
  );
  setValue(
    `${p}state` as Path<T>,
    addr.state as PathValue<T, Path<T>>,
    { shouldValidate: true, shouldDirty: true },
  );
  setValue(
    `${p}zipCode` as Path<T>,
    addr.zipCode as PathValue<T, Path<T>>,
    { shouldValidate: true, shouldDirty: true },
  );
  setValue(
    `${p}country` as Path<T>,
    addr.country as PathValue<T, Path<T>>,
    { shouldValidate: true, shouldDirty: true },
  );
  setValue(
    `${p}locality` as Path<T>,
    (addr.locality || undefined) as unknown as PathValue<T, Path<T>>,
    {
      shouldValidate: true,
      shouldDirty: true,
    },
  );
  setValue(
    `${p}latitude` as Path<T>,
    (Number.isFinite(addr.latitude) ? addr.latitude : undefined) as unknown as PathValue<
      T,
      Path<T>
    >,
    { shouldValidate: true, shouldDirty: true },
  );
  setValue(
    `${p}longitude` as Path<T>,
    (Number.isFinite(addr.longitude) ? addr.longitude : undefined) as unknown as PathValue<
      T,
      Path<T>
    >,
    { shouldValidate: true, shouldDirty: true },
  );
}
