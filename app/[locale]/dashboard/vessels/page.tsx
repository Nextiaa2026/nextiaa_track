"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCleanupOperationalData,
  useCreateVessel,
  useDeleteVessel,
  useVessels,
} from "@/hooks/useShipments";
import { Vessel } from "@/services/shipment.service";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Ship, Plane, Train } from "lucide-react";
import { useTranslations } from "next-intl";

const DEFAULT_VESSEL_TYPES = ["ship", "plane", "train"] as const;

function vesselTypeMeta(type: string): { icon: React.ElementType; label: string } {
  const normalized = type.toLowerCase();
  if (normalized.includes("plane") || normalized.includes("air")) {
    return { icon: Plane, label: type };
  }
  if (normalized.includes("train") || normalized.includes("rail")) {
    return { icon: Train, label: type };
  }
  return { icon: Ship, label: type };
}

export default function VesselsPage() {
  const t = useTranslations("pages.vessels");
  const tc = useTranslations("forms.common");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [imo, setImo] = useState("");
  const [type, setType] = useState("ship");
  const [customType, setCustomType] = useState("");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useVessels(page, pageSize, search);
  const { mutateAsync: createVessel, isPending: isCreating } =
    useCreateVessel();
  const { mutate: deleteVessel } = useDeleteVessel();
  const { mutate: cleanupData, isPending: isCleaning } =
    useCleanupOperationalData();

  const vesselTypeOptions = useMemo(() => {
    const existing = (data?.data ?? [])
      .map((v) => v.type)
      .filter(Boolean)
      .map((v) => v.toLowerCase());
    return Array.from(new Set([...DEFAULT_VESSEL_TYPES, ...existing]));
  }, [data]);

  const columns = useMemo<ColumnDef<Vessel>[]>(
    () => [
      { accessorKey: "name", header: "Nom" },
      { accessorKey: "imo", header: "IMO" },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const meta = vesselTypeMeta(row.original.type);
          const Icon = meta.icon;
          return (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-black capitalize">{meta.label}</span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="text-red-600 font-medium"
                onClick={() => {
                  if (!confirm("Supprimer ce navire ?")) return;
                  deleteVessel(row.original.id, {
                    onSuccess: () => toast.success("Navire supprimé"),
                    onError: () => toast.error("Échec suppression navire"),
                  });
                }}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [deleteVessel],
  );

  const onCreate = async () => {
    const finalType = type === "__custom__" ? customType.trim() : type.trim();
    if (!name.trim() || !imo.trim() || !finalType) {
      toast.error("Nom, IMO et type requis");
      return;
    }
    try {
      await createVessel({
        name: name.trim(),
        imo: imo.trim(),
        type: finalType,
      });
      setName("");
      setImo("");
      setType("ship");
      setCustomType("");
      setCustomType("");
      setCreateSheetOpen(false);
      toast.success("Navire créé");
    } catch {
      toast.error("Échec de création du navire");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        pageCount={data?.totalPages ?? 1}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        searchQuery={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={t("searchPlaceholder")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateSheetOpen(true)}
              className="h-10 rounded-lg px-4 font-medium"
            >
              {t("addButton")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-lg px-3 border-gray-200">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  {tc("more")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem
                  className="text-red-600 font-medium"
                  disabled={isCleaning}
                  onClick={() => {
                    if (
                      !confirm(
                        "Confirmer la suppression de toutes les données opérationnelles ?",
                      )
                    )
                      return;
                    cleanupData(undefined, {
                      onSuccess: () =>
                        toast.success("Données supprimées (admin conservé)"),
                      onError: () => toast.error("Échec du nettoyage"),
                    });
                  }}
                >
                  Supprimer toutes les données (hors admin)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full max-h-dvh w-full flex-col gap-0 border-l border-white/5 bg-background p-0 sm:max-w-2xl"
        >
          <SheetHeader className="px-6 py-5 border-b border-white/5 bg-muted/20">
            <SheetTitle className="text-2xl font-bold tracking-tight">
              Créer un navire
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground/70">
              Renseignez les informations pour enregistrer un nouveau navire.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Nom du navire</label>
               <Input
                 placeholder={t("namePlaceholder")}
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="h-11 rounded-lg border-gray-200"
               />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">IMO</label>
               <Input
                 placeholder={t("imoPlaceholder")}
                 value={imo}
                 onChange={(e) => setImo(e.target.value)}
                 className="h-11 rounded-lg border-gray-200"
               />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Type de transport</label>
               <Select value={type} onValueChange={setType}>
                 <SelectTrigger className="h-11 rounded-lg border-gray-200">
                   <SelectValue placeholder="Type de navire" />
                 </SelectTrigger>
                 <SelectContent>
                   {vesselTypeOptions.map((opt) => (
                     <SelectItem key={opt} value={opt}>
                       {opt}
                     </SelectItem>
                   ))}
                   <SelectItem value="__custom__">Personnalisé…</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            {type === "__custom__" ? (
              <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Type personnalisé</label>
                 <Input
                   placeholder={t("customTypePlaceholder")}
                   value={customType}
                   onChange={(e) => setCustomType(e.target.value)}
                   className="h-11 rounded-lg border-gray-200"
                 />
              </div>
            ) : null}
          </div>

          <SheetFooter className="p-6 border-t border-white/5 bg-muted/20 flex-row-reverse justify-start gap-3">
            <Button onClick={() => void onCreate()} disabled={isCreating} className="h-11 rounded-xl px-8 font-semibold btn-shiny">
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                tc("save")
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCreateSheetOpen(false)}
              disabled={isCreating}
              className="h-11 rounded-xl border-white/10"
            >
              {tc("cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
