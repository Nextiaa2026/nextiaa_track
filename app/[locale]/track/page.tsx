"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackingSchema, type TrackingInput } from "@/lib/validations";
import { useTrackShipment } from "@/hooks/useShipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const TrackingMap = dynamic(
  () => import("@/components/tracking-map").then((mod) => mod.TrackingMap),
  { ssr: false },
);

export default function TrackingPage() {
  const t = useTranslations("tracking");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasSearched, setHasSearched] = useState(false);
  const { mutate: trackShipment, isPending, error } = useTrackShipment();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackingInput>({
    resolver: zodResolver(trackingSchema),
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const onSubmit = (data: TrackingInput) => {
    setHasSearched(true);
    trackShipment(data.trackingNumber, {
      onSuccess: () => undefined,
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="absolute inset-0 z-0">
        <TrackingMap markerPosition={null} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pt-8">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {t("brandTitle")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t("publicSubtitle")}
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm"
        >
          <div className="flex gap-2">
            <Input
              placeholder={t("inputPlaceholder")}
              {...register("trackingNumber")}
              className="h-11 flex-1 bg-white text-base"
            />
            <Button
              type="submit"
              disabled={isPending}
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label={t("searchButtonAria")}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </div>
          {errors.trackingNumber ? (
            <p className="mt-2 text-sm text-red-600">
              {errors.trackingNumber.message}
            </p>
          ) : null}
          {hasSearched && error ? (
            <p className="mt-2 text-sm text-red-600">
              {error instanceof Error ? error.message : t("notFound")}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
