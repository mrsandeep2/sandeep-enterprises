-- Add saved_addresses column to profiles table for address management
ALTER TABLE public.profiles 
ADD COLUMN saved_addresses jsonb DEFAULT '[]'::jsonb;

-- Add phone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone text;