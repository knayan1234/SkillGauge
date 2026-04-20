import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
});

export type AuthFormValues = z.infer<typeof authSchema>;
