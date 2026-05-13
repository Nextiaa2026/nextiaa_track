import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["admin", "staff"]).default("staff"),
});

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(5, "Le téléphone doit contenir au moins 5 caractères"),
  address: z.string().min(2, "L'adresse est obligatoire"),
  city: z.string().min(2, "La ville est obligatoire"),
  state: z.string().min(2, "La région est obligatoire"),
  zipCode: z.string().min(3, "Le code postal est obligatoire"),
  country: z.string().min(2, "Le pays est obligatoire"),
  locality: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/** Coerce empty / NaN number inputs from RHF into undefined for optional steps */
function optionalShippingCost(val: unknown): unknown {
  if (val === "" || val === undefined) return undefined;
  if (typeof val === "number" && Number.isNaN(val)) return undefined;
  return val;
}

const shipmentPartyRefines = <S extends z.ZodObject<z.ZodRawShape>>(schema: S) =>
  schema
    .refine((data) => data.senderId || data.sender, {
      message: "L'expéditeur ou son identifiant est obligatoire",
      path: ["sender"],
    })
    .refine((data) => data.receiverId || data.receiver, {
      message: "Le destinataire ou son identifiant est obligatoire",
      path: ["receiver"],
    });

const shipmentSharedShape = {
  trackingNumber: z.string().min(5, "Le numéro de suivi est obligatoire"),
  shipmentType: z
    .enum(["international", "local"], {
      error: "Le type d'expédition est obligatoire",
    })
    .default("international"),
  senderId: z.number().int().optional(),
  receiverId: z.number().int().optional(),
  vesselId: z.number().int().optional(),
  itemDescription: z.string().optional(),
  itemWeight: z.string().optional(),
  itemDimensions: z.string().optional(),
  vesselName: z.string().optional(),
  vesselImo: z.string().optional(),
  itemImage: z
    .string()
    .url("URL de l'image invalide")
    .optional()
    .or(z.literal("")),
  estimatedDelivery: z.coerce.date().optional(),
  status: z.enum(["pending", "in_transit", "delivered", "failed"]).optional(),
};

const shipmentCoreShape = {
  ...shipmentSharedShape,
  sender: customerSchema.optional(),
  receiver: customerSchema.optional(),
};

/**
 * Wizard form: no party refines, partial customers — RHF+zod still parse the full object
 * on each change; refines and strict customers would require receiver while still on sender.
 */
export const shipmentFormSchema = z.object({
  ...shipmentSharedShape,
  sender: customerSchema.partial().optional(),
  receiver: customerSchema.partial().optional(),
  itemName: z.string().optional(),
  shippingCost: z.preprocess(
    optionalShippingCost,
    z.number().optional(),
  ),
});

/** Step “Next” — existing customer pick */
export const wizardSenderExistingSchema = z.object({
  senderId: z.coerce
    .number({ error: "Choisissez un expéditeur" })
    .int()
    .positive(),
});

/** Step “Next” — new sender (full address from search + geocoded fields) */
export const wizardSenderNewSchema = z.object({
  sender: customerSchema,
});

export const wizardReceiverExistingSchema = z.object({
  receiverId: z.coerce
    .number({ error: "Choisissez un destinataire" })
    .int()
    .positive(),
});

export const wizardReceiverNewSchema = z.object({
  receiver: customerSchema,
});

/** Items step — validated before moving to Review (create flow). */
export const wizardItemsSchema = z.object({
  trackingNumber: z.string().min(5, "Le numéro de suivi est obligatoire"),
  shipmentType: z.enum(["international", "local"]),
  itemName: z.string().min(2, "Le titre de l'article est obligatoire"),
  itemDescription: z.string().optional(),
  itemWeight: z.string().optional(),
  itemDimensions: z.string().optional(),
  vesselId: z.coerce
    .number({ error: "Choisissez un transport" })
    .int()
    .positive("Choisissez un transport"),
  shippingCost: z.preprocess(
    optionalShippingCost,
    z
      .number({ error: "Les frais d'expédition sont obligatoires" })
      .int()
      .positive("Les frais d'expédition doivent être positifs"),
  ),
  estimatedDelivery: z.coerce.date().optional(),
});

/** API + final register: requires item title, vessel, and positive shipping (cents). */
export const shipmentSchema = shipmentPartyRefines(
  z
    .object({
      ...shipmentCoreShape,
      itemName: z.string().min(2, "Le titre de l'article est obligatoire"),
      shippingCost: z.preprocess(
        optionalShippingCost,
        z
          .number({ error: "Les frais d'expédition sont obligatoires" })
          .int()
          .positive("Les frais d'expédition doivent être positifs"),
      ),
    })
    .extend({
      vesselId: z.number({ error: "Choisissez un transport" }).int().positive(),
    }),
);

/** PATCH updates: DB columns only — no party refines (status-only updates must pass). */
export const shipmentPatchSchema = z
  .object({
    trackingNumber: z.string().min(5).optional(),
    shipmentType: z.enum(["international", "local"]).optional(),
    senderId: z.number().int().positive().optional(),
    receiverId: z.number().int().positive().optional(),
    vesselId: z.number().int().positive().nullable().optional(),
    status: z.enum(["pending", "in_transit", "delivered", "failed"]).optional(),
    itemName: z.string().min(2).optional(),
    itemDescription: z.string().optional(),
    itemWeight: z.string().optional(),
    itemDimensions: z.string().optional(),
    vesselName: z.string().optional(),
    vesselImo: z.string().optional(),
    itemImage: z
      .union([
        z.string().url("URL de l'image invalide"),
        z.literal(""),
      ])
      .optional(),
    shippingCost: z.preprocess(
      optionalShippingCost,
      z.number().int().positive().optional(),
    ),
    estimatedDelivery: z.union([z.coerce.date(), z.null()]).optional(),
    actualDelivery: z.union([z.coerce.date(), z.null()]).optional(),
  })
  .strict();

export const shipmentLogSchema = z.object({
  shipmentId: z.number().int("Une expédition doit être sélectionnée"),
  status: z.enum(["pending", "in_transit", "delivered", "failed"]),
  location: z.string().optional(),
  address: z.string().optional(),
  message: z.string().min(5, "Le message est obligatoire"),
});

export const trackingSchema = z.object({
  trackingNumber: z.string().min(5, "Le numéro de suivi est obligatoire"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  otp: z.string().length(6, "Le code doit contenir 6 chiffres"),
  type: z.enum(["signup", "forgot-password"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  otp: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;
export type ShipmentInput = z.infer<typeof shipmentSchema>;
export type ShipmentPatchInput = z.infer<typeof shipmentPatchSchema>;
export type WizardItemsValues = z.infer<typeof wizardItemsSchema>;
export type ShipmentLogInput = z.infer<typeof shipmentLogSchema>;
export type TrackingInput = z.infer<typeof trackingSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
