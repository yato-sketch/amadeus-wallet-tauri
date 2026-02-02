import { z } from "zod";

const base58AddressSchema = z
    .string()
    .min(1, "Address is required")
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Base58 address");

const amountSchema = z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Amount must be a positive number");

export const sendTransferSchema = z.object({
    recipientAddress: base58AddressSchema,
    amount: amountSchema,
    memo: z.string().max(256, "Memo too long").optional(),
});

export type SendTransferForm = z.infer<typeof sendTransferSchema>;

export const receiveRequestSchema = z.object({
    amount: z.string().optional(),
    memo: z.string().max(256).optional(),
});

export type ReceiveRequestForm = z.infer<typeof receiveRequestSchema>;
