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