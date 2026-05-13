import {
  UserGroupIcon,
  Location01Icon,
  PackageIcon,
  Note01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

export type WizardStep =
  | "sender"
  | "receiver"
  | "items"
  | "review"
  | "complete";

export const WIZARD_STEP_ORDER: WizardStep[] = [
  "sender",
  "receiver",
  "items",
  "review",
  "complete",
];

export const WIZARD_STEP_META = [
  { id: "sender" as const, title: "Sender", icon: UserGroupIcon },
  { id: "receiver" as const, title: "Receiver", icon: Location01Icon },
  { id: "items" as const, title: "Cargo", icon: PackageIcon },
  { id: "review" as const, title: "Review", icon: Note01Icon },
  { id: "complete" as const, title: "Done", icon: CheckmarkCircle02Icon },
];

export function wizardStepIndex(s: WizardStep): number {
  return WIZARD_STEP_ORDER.indexOf(s);
}
