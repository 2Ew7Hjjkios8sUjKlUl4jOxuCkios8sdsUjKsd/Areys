-- Run this in your Supabase SQL Editor to add pricing columns to the airlines table

ALTER TABLE airlines
ADD COLUMN IF NOT EXISTS adult_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS child_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS infant_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge NUMERIC(10, 2) DEFAULT 0;
