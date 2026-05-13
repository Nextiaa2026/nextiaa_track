"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  startTransition,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  shipmentSchema,
  wizardItemsSchema,
  wizardReceiverExistingSchema,
  wizardReceiverNewSchema,
  wizardSenderExistingSchema,
  wizardSenderNewSchema,
  type ShipmentFormValues,
  type ShipmentInput,
} from "@/lib/validations";
import { z } from "zod";
import {
  useCreateShipment,
  useUpdateShipment,
  useShipment,
  useCreateReceipt,
  useVessels,
} from "@/hooks/useShipments";
import type { Shipment, ShipmentReceipt } from "@/services/shipment.service";
import {
  buildReceiptHtml,
  buildWaybillHtml,
  openPrintHtml,
} from "@/lib/print-shipment-documents";
import { buildInvoiceHtml } from "@/lib/invoice";
import { useCustomers } from "@/hooks/useCustomers";
import { generateTrackingNumber } from "@/lib/utils/shipment";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShipmentWizardStepper } from "@/components/shipment-form/ShipmentWizardStepper";
import { ShipmentSenderStep } from "@/components/shipment-form/ShipmentSenderStep";
import { ShipmentReceiverStep } from "@/components/shipment-form/ShipmentReceiverStep";
import { ShipmentItemsStep } from "@/components/shipment-form/ShipmentItemsStep";
import {
  wizardStepIndex,
  type WizardStep,
} from "@/components/shipment-form/shipment-wizard-constants";
import { fr } from "@/lib/i18n/fr";

/**
 * Match what we send to the API: in “existing customer” mode the form can still
 * carry a partial `sender` / `receiver` object from RHF defaults. Those objects are
 * validated against full `customerSchema` in `shipmentSchema`, which fails review
 * even though the IDs are valid — with errors only on unmounted steps.
 */
function normalizeShipmentValuesForSchema(
  values: ShipmentFormValues,
  senderMode: "existing" | "new",
  receiverMode: "existing" | "new",
): ShipmentFormValues {
  const next = { ...values };
  if (senderMode === "existing") {
    delete next.sender;
  } else {
    delete next.senderId;
  }
  if (receiverMode === "existing") {
    delete next.receiver;
  } else {
    delete next.receiverId;
  }
  return next;
}

export interface CreateShipmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  shipmentId?: number;
}

export function CreateShipmentSheet({
  open,
  onOpenChange,
  onSuccess,
  mode = "create",
  shipmentId,
}: CreateShipmentSheetProps) {
  const [step, setStep] = useState<WizardStep>("sender");
  const stepRef = useRef<WizardStep>(step);
  stepRef.current = step;

  const { data: customersData } = useCustomers(1, 100);
  const customers = useMemo(() => customersData?.data || [], [customersData]);

  const { data: vesselsForReviewData } = useVessels(1, 100, "");
  const vesselsForReview = useMemo(
    () => vesselsForReviewData?.data ?? [],
    [vesselsForReviewData],
  );

  const { mutate: createShipment, isPending: isCreating } = useCreateShipment();
  const { mutate: updateShipment, isPending: isUpdating } = useUpdateShipment();
  const { mutateAsync: createReceiptMutation, isPending: isReceiptLoading } =
    useCreateReceipt();
  const isPending = isCreating || isUpdating;

  const {
    data: existingShipment,
    isLoading: isLoadingShipment,
    isError: shipmentLoadError,
  } = useShipment(shipmentId ?? 0, {
    enabled: mode === "edit" && !!shipmentId && open,
  });

  const editEnabled = mode === "edit" && !!shipmentId && open;

  const [senderMode, setSenderMode] = useState<"existing" | "new">("existing");
  const [receiverMode, setReceiverMode] = useState<"existing" | "new">("existing");
  const [senderMapPreview, setSenderMapPreview] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [receiverMapPreview, setReceiverMapPreview] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(
    null,
  );
  const [cachedReceipt, setCachedReceipt] = useState<ShipmentReceipt | null>(
    null,
  );
  const [sendCreationEmail, setSendCreationEmail] = useState(false);
  const [createInvoiceAfterCreation, setCreateInvoiceAfterCreation] =
    useState(false);
  const pendingShipmentsListRefresh = useRef(false);

  const methods = useForm<ShipmentFormValues>({
    // No zodResolver: it re-validates the full schema on every keystroke and each
    // setValue from geocode (shouldValidate), causing uncaught ZodErrors. Validation
    // runs in nextStep (wizard schemas) and onSubmit (shipmentSchema.safeParse).
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      trackingNumber: generateTrackingNumber(),
      shipmentType: "international",
      itemName: "",
      itemDescription: "",
      itemWeight: "",
      itemDimensions: "",
      itemImage: "",
      estimatedDelivery: undefined,
    },
  });

  const { handleSubmit, reset, setError, getValues, clearErrors } = methods;
  const watchedValues = methods.watch();

  const applyZodIssuesToForm = useCallback(
    (issues: z.core.$ZodIssue[]) => {
      for (const issue of issues) {
        const path = issue.path.join(".");
        if (path) {
          setError(path as keyof ShipmentFormValues & string, {
            message: issue.message,
          });
        }
      }
    },
    [setError],
  );

  const isEdit = mode === "edit";
  const sw = fr.forms.shipmentWizard;
  const fc = fr.forms.common;

  const closeWizard = useCallback(() => {
    if (pendingShipmentsListRefresh.current && mode === "create") {
      onSuccess?.();
      pendingShipmentsListRefresh.current = false;
    }
    setCreatedShipment(null);
    setCachedReceipt(null);
    setStep("sender");
    setSenderMapPreview(null);
    setReceiverMapPreview(null);
    onOpenChange(false);
  }, [onOpenChange, onSuccess, mode]);

  const handleSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) onOpenChange(true);
      else closeWizard();
    },
    [onOpenChange, closeWizard],
  );

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      startTransition(() => {
        pendingShipmentsListRefresh.current = false;
        setCreatedShipment(null);
        setCachedReceipt(null);
        setSendCreationEmail(false);
        setCreateInvoiceAfterCreation(false);
        reset({
          trackingNumber: generateTrackingNumber(),
          shipmentType: "international",
          itemName: "",
          itemDescription: "",
          itemWeight: "",
          itemDimensions: "",
          itemImage: "",
        });
        setSenderMode("existing");
        setReceiverMode("existing");
        setSenderMapPreview(null);
        setReceiverMapPreview(null);
        setStep("sender");
      });
    }
  }, [open, mode, reset]);

  useEffect(() => {
    if (!open || mode !== "edit" || !existingShipment) return;
    startTransition(() => {
      reset({
        trackingNumber: existingShipment.trackingNumber,
        shipmentType: existingShipment.shipmentType ?? "international",
        senderId: existingShipment.sender.id,
        receiverId: existingShipment.receiver.id,
        vesselId: existingShipment.vesselId ?? undefined,
        itemName: existingShipment.itemName,
        itemDescription: existingShipment.itemDescription ?? "",
        itemWeight: existingShipment.itemWeight ?? "",
        itemDimensions: existingShipment.itemDimensions ?? "",
        itemImage: existingShipment.itemImage ?? "",
        shippingCost: existingShipment.shippingCost,
        estimatedDelivery: existingShipment.estimatedDelivery ? new Date(existingShipment.estimatedDelivery) : undefined,
      });
      setStep("sender");
    });
  }, [open, mode, existingShipment, reset]);

  const nextStep = () => {
    if (isEdit) {
      if (step === "sender" || step === "receiver") {
        setStep(step === "sender" ? "receiver" : "items");
      }
      return;
    }

    // Do not use trigger(): zodResolver always validates the full schema and would
    // require receiver on the sender step and full nested customers on partial input.
    if (step === "sender") {
      if (senderMode === "existing") {
        const parsed = wizardSenderExistingSchema.safeParse({
          senderId: getValues("senderId"),
        });
        if (!parsed.success) {
          applyZodIssuesToForm(parsed.error.issues);
          return;
        }
      } else {
        const parsed = wizardSenderNewSchema.safeParse({
          sender: getValues("sender"),
        });
        if (!parsed.success) {
          applyZodIssuesToForm(parsed.error.issues);
          return;
        }
      }
      clearErrors();
      setStep("receiver");
      return;
    }

    if (step === "receiver") {
      if (receiverMode === "existing") {
        const parsed = wizardReceiverExistingSchema.safeParse({
          receiverId: getValues("receiverId"),
        });
        if (!parsed.success) {
          applyZodIssuesToForm(parsed.error.issues);
          return;
        }
      } else {
        const parsed = wizardReceiverNewSchema.safeParse({
          receiver: getValues("receiver"),
        });
        if (!parsed.success) {
          applyZodIssuesToForm(parsed.error.issues);
          return;
        }
      }
      clearErrors();
      setStep("items");
      return;
    }

    if (step === "items") {
      const parsed = wizardItemsSchema.safeParse(getValues());
      if (!parsed.success) {
        applyZodIssuesToForm(parsed.error.issues);
        return;
      }
      clearErrors();
      setStep("review");
    }
  };

  const prevStep = () => {
    if (step === "receiver") setStep("sender");
    else if (step === "items") setStep("receiver");
    else if (step === "review") setStep("items");
  };

  const goToStep = (target: WizardStep) => {
    if (step === "complete") return;
    const current = wizardStepIndex(step);
    const t = wizardStepIndex(target);
    if (t <= current) setStep(target);
  };

  const ensureReceipt = async (shipmentId: number): Promise<ShipmentReceipt> => {
    if (cachedReceipt && cachedReceipt.shipment.id === shipmentId) {
      return cachedReceipt;
    }
    const receipt = await createReceiptMutation(shipmentId);
    setCachedReceipt(receipt);
    return receipt;
  };

  const printReceiptFromCache = async () => {
    if (!createdShipment?.id) return;
    try {
      const receipt = await ensureReceipt(createdShipment.id);
      if (!openPrintHtml(buildReceiptHtml(receipt))) {
        toast.error(sw.toastPopupsReceipt);
      }
    } catch {
      toast.error(sw.toastReceiptFail);
    }
  };

  const printWaybillFromCache = async () => {
    if (!createdShipment?.id) return;
    try {
      const receipt = await ensureReceipt(createdShipment.id);
      if (!openPrintHtml(buildWaybillHtml(receipt))) {
        toast.error(sw.toastPopupsWaybill);
      }
    } catch {
      toast.error(sw.toastWaybillFail);
    }
  };

  const printInvoiceFromCache = async () => {
    if (!createdShipment?.id) return;
    try {
      const receipt = await ensureReceipt(createdShipment.id);
      if (!openPrintHtml(buildInvoiceHtml(receipt))) {
        toast.error(sw.toastPopupsInvoice);
      }
    } catch {
      toast.error(sw.toastInvoiceFail);
    }
  };

  const onSubmit = (data: ShipmentFormValues) => {
    if (!isEdit && stepRef.current !== "review") return;
    if (isEdit && shipmentId && stepRef.current !== "items") return;

    const toValidate = normalizeShipmentValuesForSchema(
      data,
      senderMode,
      receiverMode,
    );
    const parsed = shipmentSchema.safeParse(toValidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") as keyof ShipmentFormValues | string;
        if (path) {
          setError(path as keyof ShipmentFormValues & string, {
            message: issue.message,
          });
        }
      }
      const detail = parsed.error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .slice(0, 3)
        .join(" · ");
      toast.error(sw.toastCannotRegister, {
        description: detail || sw.toastFixStepHint,
      });
      const issues = parsed.error.issues;
      if (issues.some((i) => i.path[0] === "sender")) setStep("sender");
      else if (issues.some((i) => i.path[0] === "receiver"))
        setStep("receiver");
      else setStep("items");
      return;
    }

    const submitData: ShipmentInput = parsed.data;

    if (isEdit && shipmentId) {
      const toastId = toast.loading(sw.toastSaving);
      updateShipment(
        {
          id: shipmentId,
          data: {
            trackingNumber: submitData.trackingNumber,
            shipmentType: submitData.shipmentType,
            itemName: submitData.itemName,
            itemDescription: submitData.itemDescription?.trim() || undefined,
            itemWeight: submitData.itemWeight?.trim() || undefined,
            itemDimensions: submitData.itemDimensions?.trim() || undefined,
            vesselId: submitData.vesselId,
            itemImage:
              submitData.itemImage?.trim() !== ""
                ? submitData.itemImage?.trim()
                : undefined,
            shippingCost: submitData.shippingCost,
            estimatedDelivery: submitData.estimatedDelivery,
          },
        },
        {
          onSuccess: () => {
            toast.dismiss(toastId);
            toast.success(sw.toastUpdated);
            closeWizard();
            onSuccess?.();
          },
          onError: (err) => {
            toast.dismiss(toastId);
            toast.error(sw.toastUpdateFailTitle, {
              description:
                err instanceof Error ? err.message : sw.toastTryAgain,
            });
          },
        },
      );
      return;
    }

    const payload = { ...submitData };
    if (senderMode === "existing") delete payload.sender;
    else delete payload.senderId;
    if (receiverMode === "existing") delete payload.receiver;
    else delete payload.receiverId;
    const requestPayload = {
      ...payload,
      notifyPartiesByEmail: sendCreationEmail,
    };

    const toastId = toast.loading(fc.processing);
    createShipment(requestPayload as ShipmentInput, {
      onSuccess: async (created: Shipment) => {
        toast.dismiss(toastId);
        toast.success(sw.toastRegistered);
        pendingShipmentsListRefresh.current = true;
        setCachedReceipt(null);
        setCreatedShipment(created);
        setStep("complete");

        if (createInvoiceAfterCreation) {
          try {
            const receipt = await ensureReceipt(created.id);
            if (!openPrintHtml(buildInvoiceHtml(receipt))) {
              toast.error(sw.toastPopupsInvoice);
            }
          } catch {
            toast.error(sw.toastInvoiceAfterFail);
          }
        }
      },
      onError: (err) => {
        toast.dismiss(toastId);
        toast.error(sw.toastCreateFailTitle, {
          description: err instanceof Error ? err.message : sw.toastTryAgain,
        });
      },
    });
  };

  const showLoadError = isEdit && editEnabled && shipmentLoadError;
  const showLoader = isEdit && editEnabled && isLoadingShipment;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex h-full max-h-dvh w-full flex-col gap-0 border-l border-white/5 bg-background p-0 sm:max-w-4xl md:max-w-5xl lg:max-w-6xl"
      >
        <SheetHeader className="px-6 py-5 border-b border-white/5 bg-muted/20">
          <SheetTitle className="text-2xl font-bold tracking-tight">
            {isEdit ? sw.sheetTitleEdit : sw.sheetTitleNew}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground/70">
            {isEdit ? sw.sheetDescEdit : sw.sheetDescNew}
          </SheetDescription>
        </SheetHeader>

        <ShipmentWizardStepper step={step} onGoToStep={goToStep} isEdit={isEdit} />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {showLoader ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">{sw.loadingShipment}</p>
            </div>
          ) : showLoadError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive">
              {sw.loadError}
            </div>
          ) : (
            <FormProvider {...methods}>
              {!isEdit && step === "complete" && createdShipment ? (
                <div
                  key="complete"
                  className="mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
                >
                  <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">
                      {sw.completeTitle}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                      {sw.trackingNumberLabel}
                    </p>
                    <p className="mt-1 break-all font-mono text-2xl font-semibold tracking-tight text-foreground">
                      {createdShipment.trackingNumber}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {sw.labelItem} :
                      </span>{" "}
                      {createdShipment.itemName || "—"}
                    </p>
                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={isReceiptLoading}
                        onClick={() => void printReceiptFromCache()}
                      >
                        {sw.printReceipt}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={isReceiptLoading}
                        onClick={() => void printWaybillFromCache()}
                      >
                        {sw.printWaybill}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={isReceiptLoading}
                        onClick={() => void printInvoiceFromCache()}
                      >
                        {sw.printInvoice}
                      </Button>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {sw.completeHint}
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  id="wizard-form"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                  onKeyDownCapture={(e) => {
                    if (e.key !== "Enter") return;
                    const target = e.target as HTMLElement;
                    if (target.tagName === "TEXTAREA") return;
                    if (isEdit) {
                      if (stepRef.current !== "items") {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                      return;
                    }
                    if (stepRef.current !== "review") {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="mx-auto max-w-3xl space-y-6"
                >
                  <div
                    key={step}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
                  >
                    {step === "sender" && (
                      <ShipmentSenderStep
                        isEdit={isEdit}
                        existingShipment={existingShipment}
                        customers={customers}
                        senderMode={senderMode}
                        onSenderModeChange={setSenderMode}
                        mapPreview={senderMapPreview}
                        onMapPreviewChange={setSenderMapPreview}
                      />
                    )}
                    {step === "receiver" && (
                      <ShipmentReceiverStep
                        isEdit={isEdit}
                        existingShipment={existingShipment}
                        customers={customers}
                        receiverMode={receiverMode}
                        onReceiverModeChange={setReceiverMode}
                        mapPreview={receiverMapPreview}
                        onMapPreviewChange={setReceiverMapPreview}
                      />
                    )}
                    {step === "items" && <ShipmentItemsStep />}
                    {step === "review" && (
                      <div className="rounded-xl border border-border bg-card p-5 md:p-6">
                        <div className="mb-4 border-b border-border pb-4">
                          <h3 className="text-lg font-semibold">
                            {sw.reviewTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {sw.reviewSubtitle}
                          </p>
                        </div>

                        <div className="space-y-5 text-sm">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                              {sw.sectionShipment}
                            </p>
                            <div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 md:grid-cols-2">
                              <p>
                                <span className="font-medium">
                                  {sw.labelTracking} :
                                </span>{" "}
                                {watchedValues.trackingNumber || "-"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {sw.labelShipmentType} :
                                </span>{" "}
                                {watchedValues.shipmentType === "international"
                                  ? sw.shipmentTypeInternational
                                  : watchedValues.shipmentType === "local"
                                    ? sw.shipmentTypeLocal
                                    : "-"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {sw.labelItem} :
                                </span>{" "}
                                {watchedValues.itemName || "-"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {sw.labelWeight} :
                                </span>{" "}
                                {watchedValues.itemWeight || "-"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {sw.labelDimensions} :
                                </span>{" "}
                                {watchedValues.itemDimensions || "-"}
                              </p>
                              <p className="md:col-span-2">
                                <span className="font-medium">
                                  {sw.labelTransport} :
                                </span>{" "}
                                {(() => {
                                  const vid = watchedValues.vesselId;
                                  const v =
                                    vid != null
                                      ? vesselsForReview.find(
                                          (row) => row.id === vid,
                                        )
                                      : undefined;
                                  return v
                                    ? `${v.name} (${v.imo}) · ${v.type}`
                                    : "-";
                                })()}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {sw.labelShippingCost} :
                                </span>{" "}
                                {typeof watchedValues.shippingCost === "number"
                                  ? `$${(watchedValues.shippingCost / 100).toFixed(2)}`
                                  : "-"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {sw.labelEstimatedDelivery} :
                                </span>{" "}
                                {watchedValues.estimatedDelivery
                                  ? new Date(
                                      watchedValues.estimatedDelivery,
                                    ).toLocaleDateString("fr-FR")
                                  : "-"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">
                              {sw.sectionSender}
                            </p>
                            <div className="rounded-lg border border-border bg-muted/20 p-3">
                              {senderMode === "existing" ? (
                                (() => {
                                  const sender = customers.find(
                                    (c) => c.id === watchedValues.senderId,
                                  );
                                  if (!sender) return <p>-</p>;
                                  return (
                                    <>
                                      <p className="font-medium">{sender.name}</p>
                                      <p>{sender.email}</p>
                                      <p>{sender.phone}</p>
                                      <p>
                                        {sender.address}, {sender.city},{" "}
                                        {sender.country}
                                      </p>
                                    </>
                                  );
                                })()
                              ) : (
                                <>
                                  <p className="font-medium">
                                    {watchedValues.sender?.name || "-"}
                                  </p>
                                  <p>{watchedValues.sender?.email || "-"}</p>
                                  <p>{watchedValues.sender?.phone || "-"}</p>
                                  <p>
                                    {watchedValues.sender?.address || "-"},{" "}
                                    {watchedValues.sender?.city || "-"},{" "}
                                    {watchedValues.sender?.country || "-"}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                              {sw.sectionReceiver}
                            </p>
                            <div className="rounded-lg border border-border bg-muted/20 p-3">
                              {receiverMode === "existing" ? (
                                (() => {
                                  const receiver = customers.find(
                                    (c) =>
                                      c.id === watchedValues.receiverId,
                                  );
                                  if (!receiver) return <p>-</p>;
                                  return (
                                    <>
                                      <p className="font-medium">{receiver.name}</p>
                                      <p>{receiver.email}</p>
                                      <p>{receiver.phone}</p>
                                      <p>
                                        {receiver.address}, {receiver.city},{" "}
                                        {receiver.country}
                                      </p>
                                    </>
                                  );
                                })()
                              ) : (
                                <>
                                  <p className="font-medium">
                                    {watchedValues.receiver?.name || "-"}
                                  </p>
                                  <p>{watchedValues.receiver?.email || "-"}</p>
                                  <p>{watchedValues.receiver?.phone || "-"}</p>
                                  <p>
                                    {watchedValues.receiver?.address || "-"},{" "}
                                    {watchedValues.receiver?.city || "-"},{" "}
                                    {watchedValues.receiver?.country || "-"}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/20 p-4">
                            <p className="mb-3 text-xs font-semibold text-muted-foreground">
                              {sw.sectionAfterCreate}
                            </p>
                            <label className="mb-2 flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={sendCreationEmail}
                                onCheckedChange={(v) => setSendCreationEmail(!!v)}
                              />
                              {sw.emailToParties}
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={createInvoiceAfterCreation}
                                onCheckedChange={(v) =>
                                  setCreateInvoiceAfterCreation(!!v)
                                }
                              />
                              {sw.generateInvoiceAfter}
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </FormProvider>
          )}
        </div>

        {!showLoader && !showLoadError && (
          <SheetFooter className="p-6 border-t border-white/5 bg-muted/20 flex-row-reverse justify-start gap-3">
            {!isEdit && step === "complete" ? (
              <Button type="button" variant="outline" onClick={closeWizard} className="h-11 rounded-xl">
                {fc.close}
              </Button>
            ) : (
              <>
                <div className="flex gap-3">
                  {(isEdit && step === "items") ||
                  (!isEdit && step === "review") ? (
                    <Button
                      type="button"
                      disabled={isPending}
                      className="h-11 rounded-xl px-8 font-semibold btn-shiny"
                      onClick={() => {
                        if (isEdit) {
                          if (stepRef.current !== "items") return;
                        } else if (stepRef.current !== "review") return;
                        void handleSubmit(onSubmit)();
                      }}
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isEdit ? (
                        sw.saveChanges
                      ) : (
                        sw.registerShipment
                      )}
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => void nextStep()} className="h-11 rounded-xl px-8 font-semibold">
                      {fc.next}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-gray-200"
                  onClick={step === "sender" ? closeWizard : prevStep}
                >
                  {step === "sender" ? (
                    fc.cancel
                  ) : (
                    <>
                      <ArrowLeft className="mr-2 size-4" />
                      {fc.back}
                    </>
                  )}
                </Button>
              </>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
