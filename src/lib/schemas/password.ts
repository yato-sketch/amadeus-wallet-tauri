import { z } from "zod";

const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,}$/;

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
        PASSWORD_REGEX,
        "Password must include upper, lower, number, and special character"
    );

export const loginSchema = z.object({
    password: passwordSchema,
});

export const createPasswordSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type CreatePasswordForm = z.infer<typeof createPasswordSchema>;

export const importWalletSchema = createPasswordSchema.extend({
    privateKey: z.string().min(1, "Private key is required"),
});

export type ImportWalletForm = z.infer<typeof importWalletSchema>;