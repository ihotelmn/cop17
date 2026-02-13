-- Add total_inventory to rooms table
ALTER TABLE public.rooms 
ADD COLUMN total_inventory INTEGER NOT NULL DEFAULT 0;

-- Optional: Add a check constraint to ensure inventory is positive
ALTER TABLE public.rooms 
ADD CONSTRAINT positive_inventory CHECK (total_inventory >= 0);

-- Update RLS if necessary (already covers basic select)
