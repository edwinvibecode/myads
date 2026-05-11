-- Migration: Add 2FA fields to User table
-- Run this SQL to add two-factor authentication columns

-- Add twoFactorSecret column (nullable, for TOTP secret key)
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;

-- Add twoFactorEnabled column (default false)
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" INTEGER NOT NULL DEFAULT 0;
