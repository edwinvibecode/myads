import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

export const domainSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung")
    .trim(),
});

export const revenueSchema = z.object({
  domainId: z.coerce.number().int().positive(),
  network: z.enum(["CLICKADILLA", "CLICKADU", "ADSTERRA"]),
  amount: z.coerce.number().positive().max(999999999),
  currency: z.enum(["USD", "IDR"]),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  notes: z.string().max(500).trim().optional(),
});

export const expenseSchema = z.object({
  domainId: z.coerce.number().int().positive().optional().nullable(),
  type: z.enum(["OPERATIONAL", "OTHER"]),
  category: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
  amount: z.coerce.number().positive().max(999999999),
  currency: z.enum(["USD", "IDR"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  isRecurring: z.coerce.boolean().optional().default(false),
});

export const exchangeRateSchema = z.object({
  fromCurrency: z.enum(["USD", "IDR"]),
  toCurrency: z.enum(["USD", "IDR"]),
  rate: z.coerce.number().positive().max(99999999),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const csvRowSchema = z.object({
  domain: z.string().min(1).max(100).trim(),
  network: z.enum(["CLICKADILLA", "CLICKADU", "ADSTERRA"]),
  amount: z.coerce.number().positive().max(999999999),
  currency: z.enum(["USD", "IDR"]),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  notes: z.string().max(500).trim().optional(),
});
