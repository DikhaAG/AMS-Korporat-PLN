import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .trim(),
  email: z
    .string()
    .email("Format email tidak valid")
    .toLowerCase()
    .trim(),
  nip: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(100, "Kata sandi maksimal 100 karakter"),
  role: z.enum(["admin", "user"]),
  positionId: z
    .string()
    .uuid("Posisi tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
