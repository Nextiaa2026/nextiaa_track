"use client";

import React, { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WIZARD_STEP_META,
  wizardStepIndex,
  type WizardStep,
} from "./shipment-wizard-constants";
import { fr } from "@/lib/i18n/fr";

const STEP_TITLE: Record<WizardStep, string> = {
  sender: fr.forms.shipmentWizard.stepSender,
  receiver: fr.forms.shipmentWizard.stepReceiver,
  items: fr.forms.shipmentWizard.stepCargo,
  review: fr.forms.shipmentWizard.stepReview,
  complete: fr.forms.shipmentWizard.stepDone,
};

type Props = {
  step: WizardStep;
  onGoToStep: (target: WizardStep) => void;
  isEdit?: boolean;
};

export function ShipmentWizardStepper({
  step,
  onGoToStep,
  isEdit = false,
}: Props) {
  const stepsMeta = useMemo(
    () =>
      isEdit
        ? WIZARD_STEP_META.filter(
            (s) => s.id !== "review" && s.id !== "complete",
          )
        : WIZARD_STEP_META,
    [isEdit],
  );

  const idx = stepsMeta.findIndex((s) => s.id === step);
  const stepperLocked = step === "complete";

  return (
    <div className="shrink-0 border-b border-border bg-muted/20 px-6 py-4">
      <nav
        aria-label={fr.forms.shipmentWizard.stepsNavAria}
        className="mx-auto max-w-2xl"
      >
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {stepsMeta.map((s, i) => {
            const active = step === s.id;
            const si = wizardStepIndex(s.id);
            const done = idx > si;
            const canJumpBack = !stepperLocked && si <= idx && s.id !== "complete";
            const clickable = canJumpBack;

            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onGoToStep(s.id)}
                  className={cn(
                    "group flex items-center gap-2.5 transition-all",
                    !clickable && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                      active &&
                        "border-primary bg-primary text-primary-foreground shadow-sm",
                      done &&
                        !active &&
                        "border-primary bg-primary/10 text-primary",
                      !active &&
                        !done &&
                        "border-muted-foreground/20 text-muted-foreground",
                    )}
                  >
                    {done && !active ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : (
                      <span className="text-[10px] font-bold">{si + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm capitalize font-semibold transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {STEP_TITLE[s.id]}
                  </span>
                </button>
                {i < stepsMeta.length - 1 && (
                  <div className="h-px w-8 bg-border md:w-12" aria-hidden />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
