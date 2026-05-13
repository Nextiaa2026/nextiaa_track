"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ActiveShipmentsLeaflet = dynamic(
  () =>
    import("@/components/active-shipments-map-leaflet").then(
      (mod) => mod.ActiveShipmentsMapLeaflet,
    ),
  { ssr: false },
);

export function ActiveShipmentsMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carte des expéditions actives</CardTitle>
        <CardDescription>
          Position des expéditions en attente et en transit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActiveShipmentsLeaflet />
      </CardContent>
    </Card>
  );
}
